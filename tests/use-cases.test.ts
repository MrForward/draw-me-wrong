import assert from "node:assert/strict";
import test from "node:test";
import { LOCALES } from "../app/game-data";
import { HOME_POSITIONING } from "../app/home-positioning";
import { LIVE_COPY, LIVE_GROWTH_COPY } from "../app/live/live-copy";
import { liveInvitePath } from "../app/live/live-links";
import { TEAM_ICEBREAKER_COPY } from "../app/play/team-icebreaker-copy";
import { normalizeUseCase } from "../app/play/use-case-preset";

function placeholders(value: string) {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

test("use-case presets are explicitly allowlisted", () => {
  assert.equal(normalizeUseCase("team"), "team");
  assert.equal(normalizeUseCase("party"), null);
  assert.equal(normalizeUseCase("team<script>"), null);
  assert.equal(normalizeUseCase(null), null);
});

test("team acquisition and home positioning copy covers every product locale", () => {
  for (const locale of LOCALES) {
    const landing = TEAM_ICEBREAKER_COPY[locale];
    const home = HOME_POSITIONING[locale];
    const live = LIVE_COPY[locale];
    const growth = LIVE_GROWTH_COPY[locale];
    assert.ok(landing.title.length > 4, `${locale} landing title`);
    assert.equal(landing.actions.length, 3, `${locale} facilitation actions`);
    assert.equal(landing.moments.length, 3, `${locale} use moments`);
    assert.equal(landing.facts.length, 4, `${locale} factual constraints`);
    assert.ok(home.title.length > 4, `${locale} home title`);
    for (const [key, value] of Object.entries(home)) assert.ok(value.trim(), `${locale} home.${key}`);
    for (const [key, value] of Object.entries(growth)) {
      assert.ok(value.trim(), `${locale} live growth.${key}`);
      assert.deepEqual(placeholders(value), placeholders(LIVE_GROWTH_COPY.en[key as keyof typeof growth]), `${locale} live growth.${key} placeholders`);
    }
    for (const [key, value] of Object.entries(live)) {
      assert.ok(value.trim(), `${locale} live.${key}`);
      assert.deepEqual(placeholders(value), placeholders(LIVE_COPY.en[key as keyof typeof live]), `${locale} live.${key} placeholders`);
    }
    assert.doesNotMatch(JSON.stringify({ landing, home, growth }), /[—–]/, `${locale} visible copy uses only regular hyphens`);
  }
});

test("team invite links preserve positioning without lengthening other room links", () => {
  assert.equal(liveInvitePath("23456789ABCD", "team"), "/live/23456789ABCD?p=team");
  assert.equal(liveInvitePath("23456789ABCD", "home"), "/live/23456789ABCD");
  assert.equal(liveInvitePath("23456789ABCD", "quick"), "/live/23456789ABCD");
});
