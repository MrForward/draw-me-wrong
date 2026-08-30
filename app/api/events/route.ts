import { normalizeAnalyticsPayload } from "../../analytics-events";
import { incrementAnalytics } from "../../../db/analytics";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export async function POST(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: RESPONSE_HEADERS });
  }

  try {
    const body = await request.text();
    if (body.length > 256) {
      return Response.json({ error: "payload too large" }, { status: 413, headers: RESPONSE_HEADERS });
    }
    const payload = normalizeAnalyticsPayload(JSON.parse(body));
    if (!payload) {
      return Response.json({ error: "invalid event" }, { status: 400, headers: RESPONSE_HEADERS });
    }
    await incrementAnalytics(payload);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "metrics unavailable" }, { status: 503, headers: RESPONSE_HEADERS });
  }
}

export function GET() {
  return Response.json({ error: "not found" }, { status: 404, headers: RESPONSE_HEADERS });
}
