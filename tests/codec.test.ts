import assert from "node:assert/strict";
import test from "node:test";
import { Challenge, decodeChallenge, encodeChallenge } from "../app/codec";
import {
  LOCALES,
  PROMPTS,
  UI,
  advanceDailyProgress,
  dailyPromptId,
  promptById,
  utcDayKey,
} from "../app/game-data";

const fixture: Challenge = {
  promptId: 5,
  languageId: 2,
  durationMs: 4870,
  strokes: [
    [
      { x: 0, y: 255, t: 0 },
      { x: 16, y: 235, t: 60 },
      { x: 80, y: 180, t: 220 },
      { x: 255, y: 0, t: 520 },
    ],
    [
      { x: 30, y: 40, t: 900 },
      { x: 31, y: 42, t: 960 },
      { x: 100, y: 150, t: 1220 },
      { x: 220, y: 240, t: 1550 },
    ],
  ],
};

test("challenge codec round-trips metadata, strokes, and timing", () => {
  const encoded = encodeChallenge(fixture, 360);
  const decoded = decodeChallenge(encoded.payload);
  assert.equal(decoded.promptId, fixture.promptId);
  assert.equal(decoded.languageId, fixture.languageId);
  assert.equal(decoded.durationMs, 4880);
  assert.equal(decoded.strokes.length, encoded.challenge.strokes.length);
  decoded.strokes.forEach((stroke, strokeIndex) => {
    const original = encoded.challenge.strokes[strokeIndex];
    assert.equal(stroke.length, original.length);
    stroke.forEach((point, pointIndex) => {
      assert.equal(point.x, original[pointIndex].x);
      assert.equal(point.y, original[pointIndex].y);
      assert.ok(Math.abs(point.t - original[pointIndex].t) <= 20);
    });
  });
});

test("typical challenge leaves room for a short production URL", () => {
  const manyPoints: Challenge = {
    ...fixture,
    strokes: Array.from({ length: 7 }, (_, strokeIndex) =>
      Array.from({ length: 90 }, (_, pointIndex) => ({
        x: (pointIndex * 7 + strokeIndex * 11) % 256,
        y: (pointIndex * 13 + strokeIndex * 17) % 256,
        t: strokeIndex * 500 + pointIndex * 45,
      }))),
  };
  const encoded = encodeChallenge(manyPoints, 360);
  assert.ok(encoded.payload.length <= 360);
  assert.ok(`https://drawmewrong.fun/#d=${encoded.payload}&day=2026-08-24`.length < 450);
  assert.ok(encoded.simplified);
  assert.doesNotThrow(() => decodeChallenge(encoded.payload));
});

test("corrupted and truncated challenges are rejected", () => {
  const { payload } = encodeChallenge(fixture);
  const flipped = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;
  assert.throws(() => decodeChallenge(flipped));
  assert.throws(() => decodeChallenge(payload.slice(0, -4)));
  assert.throws(() => decodeChallenge("not+base64"));
});

test("every locale has complete UI and safe four-choice prompt packs", () => {
  const englishKeys = Object.keys(UI.en).sort();
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(UI[locale]).sort(), englishKeys);
    for (const key of englishKeys) {
      const englishPlaceholders = [...UI.en[key as keyof typeof UI.en].matchAll(/\{([a-z]+)\}/g)].map((match) => match[1]).sort();
      const localizedPlaceholders = [...UI[locale][key as keyof typeof UI.en].matchAll(/\{([a-z]+)\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(localizedPlaceholders, englishPlaceholders, `${locale}.${key} placeholder mismatch`);
      assert.doesNotMatch(UI[locale][key as keyof typeof UI.en], /[—–]/, `${locale}.${key} contains a banned dash`);
    }
    for (const prompt of PROMPTS) {
      const words = prompt.words[locale];
      assert.equal(words.length, 4);
      assert.equal(new Set(words.map((word) => word.trim().toLocaleLowerCase(locale))).size, 4);
      assert.ok(words.every((word) => word.trim().length > 0));
    }
  }
});

test("prompt IDs are unique, stable, and resolvable", () => {
  assert.deepEqual(PROMPTS.map((prompt) => prompt.id), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(new Set(PROMPTS.map((prompt) => prompt.id)).size, PROMPTS.length);
  for (const prompt of PROMPTS) assert.equal(promptById(prompt.id), prompt);
  assert.equal(promptById(65_535), undefined);
});

test("daily prompt and local streak rules are deterministic", () => {
  const day = utcDayKey(new Date("2026-08-24T23:59:59.000Z"));
  assert.equal(day, "2026-08-24");
  assert.equal(dailyPromptId(day), dailyPromptId(day));
  assert.ok(promptById(dailyPromptId(day)));

  const first = advanceDailyProgress(null, "2026-08-22");
  assert.deepEqual(first, { lastCompletedDay: "2026-08-22", streak: 1, bestStreak: 1 });
  assert.equal(advanceDailyProgress(first, "2026-08-22"), first);
  const second = advanceDailyProgress(first, "2026-08-23");
  assert.deepEqual(second, { lastCompletedDay: "2026-08-23", streak: 2, bestStreak: 2 });
  const reset = advanceDailyProgress(second, "2026-08-25");
  assert.deepEqual(reset, { lastCompletedDay: "2026-08-25", streak: 1, bestStreak: 2 });
  assert.throws(() => dailyPromptId("not-a-day"));
});
