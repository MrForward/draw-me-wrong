import {
  SHORT_CHALLENGE_RETENTION_SECONDS,
  StoredChallengeInput,
  createShortChallengeCode,
} from "../app/challenge-links";

export interface ChallengeStatement {
  bind(...values: Array<string | number | null>): ChallengeStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number } }>;
}

export interface ChallengeDatabase {
  prepare(query: string): ChallengeStatement;
}

export type StoredChallengeRecord = StoredChallengeInput & {
  expiresAt: number;
};

export async function saveShortChallenge(
  database: ChallengeDatabase,
  challenge: StoredChallengeInput,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ code: string; expiresAt: number }> {
  const expiresAt = nowSeconds + SHORT_CHALLENGE_RETENTION_SECONDS;

  await database.prepare(`
    DELETE FROM short_challenges
    WHERE code IN (
      SELECT code FROM short_challenges
      WHERE expires_at <= ?
      ORDER BY expires_at
      LIMIT 100
    )
  `).bind(nowSeconds).run();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = createShortChallengeCode();
    const result = await database.prepare(`
      INSERT OR IGNORE INTO short_challenges (code, payload, day, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(code, challenge.payload, challenge.day, nowSeconds, expiresAt).run();

    if (result.meta?.changes === 1) return { code, expiresAt };

    const existing = await database.prepare(`
      SELECT payload, day FROM short_challenges WHERE code = ? LIMIT 1
    `).bind(code).first<{ payload: string; day: string | null }>();
    if (existing?.payload === challenge.payload && existing.day === challenge.day) return { code, expiresAt };
  }

  throw new Error("Unable to allocate a short challenge ID");
}

export async function loadShortChallenge(
  database: ChallengeDatabase,
  code: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<StoredChallengeRecord | null> {
  const record = await database.prepare(`
    SELECT payload, day, expires_at AS expiresAt
    FROM short_challenges
    WHERE code = ? AND expires_at > ?
    LIMIT 1
  `).bind(code, nowSeconds).first<{ payload: string; day: string | null; expiresAt: number }>();
  return record ?? null;
}
