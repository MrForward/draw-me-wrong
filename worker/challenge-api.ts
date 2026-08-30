import { normalizeStoredChallengeInput } from "../app/challenge-links";
import { ChallengeDatabase, saveShortChallenge } from "../db/challenges";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: NO_STORE_HEADERS });
}

export async function createChallengeResponse(request: Request, database?: ChallengeDatabase): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return errorResponse("forbidden", 403);
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return errorResponse("unsupported media type", 415);
  }
  if (!database) return errorResponse("short links unavailable", 503);

  try {
    const body = await request.text();
    if (body.length > 512) return errorResponse("payload too large", 413);
    const challenge = normalizeStoredChallengeInput(JSON.parse(body));
    if (!challenge) return errorResponse("invalid challenge", 400);
    const saved = await saveShortChallenge(database, challenge);
    return Response.json(
      { path: `/c/${saved.code}`, expiresAt: saved.expiresAt },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch {
    return errorResponse("short links unavailable", 503);
  }
}
