import { decodeChallenge } from "./codec";
import { LOCALES, dailyPromptId, isDayKey, promptById } from "./game-data";

export const SHORT_CHALLENGE_CODE_LENGTH = 16;
export const SHORT_CHALLENGE_RETENTION_SECONDS = 30 * 24 * 60 * 60;
export const MAX_STORED_PAYLOAD_LENGTH = 440;

export type StoredChallengeInput = {
  payload: string;
  day: string | null;
};

export function isShortChallengeCode(value: string): boolean {
  return new RegExp(`^[A-Za-z0-9_-]{${SHORT_CHALLENGE_CODE_LENGTH}}$`).test(value);
}

export function normalizeStoredChallengeInput(value: unknown): StoredChallengeInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as { payload?: unknown; day?: unknown };
  if (
    typeof candidate.payload !== "string" ||
    candidate.payload.length < 9 ||
    candidate.payload.length > MAX_STORED_PAYLOAD_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(candidate.payload)
  ) return null;

  const day = candidate.day === undefined || candidate.day === null ? null : candidate.day;
  if (day !== null && (typeof day !== "string" || !isDayKey(day))) return null;

  try {
    const challenge = decodeChallenge(candidate.payload);
    if (!promptById(challenge.promptId) || !LOCALES[challenge.languageId]) return null;
    if (day && dailyPromptId(day) !== challenge.promptId) return null;
  } catch {
    return null;
  }

  return { payload: candidate.payload, day };
}

export function createShortChallengeCode(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(12));
  if (bytes.length !== 12) throw new Error("Short challenge IDs require 12 random bytes");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
