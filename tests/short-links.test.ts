import assert from "node:assert/strict";
import test from "node:test";
import {
  SHORT_CHALLENGE_RETENTION_SECONDS,
  createShortChallengeCode,
  isShortChallengeCode,
  normalizeStoredChallengeInput,
} from "../app/challenge-links";
import { encodeChallenge } from "../app/codec";
import { dailyPromptId } from "../app/game-data";
import { ChallengeDatabase, ChallengeStatement, loadShortChallenge } from "../db/challenges";
import { createChallengeResponse } from "../worker/challenge-api";

type Row = {
  code: string;
  payload: string;
  day: string | null;
  createdAt: number;
  expiresAt: number;
};

class MemoryStatement implements ChallengeStatement {
  private values: Array<string | number | null> = [];

  constructor(private readonly database: MemoryDatabase, private readonly query: string) {}

  bind(...values: Array<string | number | null>): ChallengeStatement {
    this.values = values;
    return this;
  }

  async run(): Promise<{ meta?: { changes?: number } }> {
    if (this.query.includes("DELETE FROM short_challenges")) {
      const cutoff = this.values[0] as number;
      let changes = 0;
      for (const [code, row] of this.database.rows) {
        if (row.expiresAt <= cutoff && changes < 100) {
          this.database.rows.delete(code);
          changes += 1;
        }
      }
      return { meta: { changes } };
    }
    if (this.query.includes("INSERT OR IGNORE INTO short_challenges")) {
      const [code, payload, day, createdAt, expiresAt] = this.values as [string, string, string | null, number, number];
      if (this.database.rows.has(code)) return { meta: { changes: 0 } };
      this.database.rows.set(code, { code, payload, day, createdAt, expiresAt });
      return { meta: { changes: 1 } };
    }
    return { meta: { changes: 0 } };
  }

  async first<T>(): Promise<T | null> {
    const code = this.values[0] as string;
    const cutoff = typeof this.values[1] === "number" ? this.values[1] : Number.NEGATIVE_INFINITY;
    const row = this.database.rows.get(code);
    if (!row || row.expiresAt <= cutoff) return null;
    return { payload: row.payload, day: row.day, expiresAt: row.expiresAt } as T;
  }
}

class MemoryDatabase implements ChallengeDatabase {
  readonly rows = new Map<string, Row>();

  prepare(query: string): ChallengeStatement {
    return new MemoryStatement(this, query);
  }
}

function challengePayload(promptId = 2, languageId = 0): string {
  return encodeChallenge({
    promptId,
    languageId,
    durationMs: 800,
    strokes: [[{ x: 10, y: 20, t: 0 }, { x: 30, y: 40, t: 180 }]],
  }).payload;
}

test("short challenge codes are 96-bit base64url values", () => {
  const code = createShortChallengeCode(Uint8Array.from({ length: 12 }, (_, index) => index));
  assert.equal(code, "AAECAwQFBgcICQoL");
  assert.ok(isShortChallengeCode(code));
  assert.equal(SHORT_CHALLENGE_RETENTION_SECONDS, 30 * 24 * 60 * 60);
  assert.equal(isShortChallengeCode("too-short"), false);
});

test("stored challenge validation checks the codec, locale, and daily prompt", () => {
  const payload = challengePayload();
  assert.deepEqual(normalizeStoredChallengeInput({ payload, day: null }), { payload, day: null });
  assert.equal(normalizeStoredChallengeInput({ payload: `${payload.slice(0, -1)}A`, day: null }), null);
  assert.equal(normalizeStoredChallengeInput({ payload: challengePayload(2, 99), day: null }), null);

  const day = "2026-08-25";
  const dailyPayload = challengePayload(dailyPromptId(day));
  assert.deepEqual(normalizeStoredChallengeInput({ payload: dailyPayload, day }), { payload: dailyPayload, day });
  assert.equal(normalizeStoredChallengeInput({ payload, day }), null);
});

test("the creation endpoint stores a valid challenge and returns only a short path", async () => {
  const database = new MemoryDatabase();
  const payload = challengePayload();
  const request = new Request("https://drawmewrong.fun/api/challenges", {
    method: "POST",
    headers: { Origin: "https://drawmewrong.fun", "Content-Type": "application/json" },
    body: JSON.stringify({ payload, day: null }),
  });
  const response = await createChallengeResponse(request, database);
  assert.equal(response.status, 201);
  const body = await response.json() as { path: string; expiresAt: number };
  assert.match(body.path, /^\/c\/[A-Za-z0-9_-]{16}$/);
  assert.equal(Object.keys(body).sort().join(","), "expiresAt,path");
  assert.equal(database.rows.size, 1);

  const code = body.path.slice(3);
  const stored = await loadShortChallenge(database, code, body.expiresAt - 1);
  assert.deepEqual(stored, { payload, day: null, expiresAt: body.expiresAt });
  assert.equal(await loadShortChallenge(database, code, body.expiresAt), null);
});

test("the creation endpoint rejects cross-origin, malformed, and oversized requests", async () => {
  const database = new MemoryDatabase();
  const crossOrigin = await createChallengeResponse(new Request("https://drawmewrong.fun/api/challenges", {
    method: "POST",
    headers: { Origin: "https://example.com", "Content-Type": "application/json" },
    body: "{}",
  }), database);
  assert.equal(crossOrigin.status, 403);

  const malformed = await createChallengeResponse(new Request("https://drawmewrong.fun/api/challenges", {
    method: "POST",
    headers: { Origin: "https://drawmewrong.fun", "Content-Type": "application/json" },
    body: JSON.stringify({ payload: "not-a-challenge", day: null }),
  }), database);
  assert.equal(malformed.status, 400);

  const oversized = await createChallengeResponse(new Request("https://drawmewrong.fun/api/challenges", {
    method: "POST",
    headers: { Origin: "https://drawmewrong.fun", "Content-Type": "application/json" },
    body: "x".repeat(513),
  }), database);
  assert.equal(oversized.status, 413);
});
