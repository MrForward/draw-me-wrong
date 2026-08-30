/** Cloudflare Worker entry point for Draw Me Wrong. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { isShortChallengeCode, normalizeStoredChallengeInput } from "../app/challenge-links";
import { ChallengeDatabase, loadShortChallenge } from "../db/challenges";
import { createChallengeResponse } from "./challenge-api";
import { handleLiveRequest, LiveDatabase } from "./live-api";

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetFetcher;
  DB?: ChallengeDatabase & LiveDatabase;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function withDiscoveryCaching(request: Request, response: Response): Response {
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  const pathname = new URL(request.url).pathname;
  const headers = new Headers(response.headers);

  if (pathname === "/" || pathname === "/play/team-icebreaker") {
    headers.set("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
  } else if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  } else {
    return response;
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function renderShortChallenge(
  request: Request,
  code: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const startedAt = performance.now();
  let record = null;
  try {
    record = env.DB ? await loadShortChallenge(env.DB, code) : null;
  } catch {
    // The embedded invalid state below is safer than leaking a database error.
  }

  const validRecord = record && normalizeStoredChallengeInput(record) ? record : null;
  const rootUrl = new URL(request.url);
  rootUrl.pathname = "/";
  rootUrl.search = "";
  rootUrl.hash = "";
  const rootRequest = new Request(rootUrl, { method: "GET", headers: request.headers });
  const rootResponse = await handler.fetch(rootRequest, env, ctx);
  const rootHtml = await rootResponse.text();
  const embeddedData = validRecord
    ? JSON.stringify({ payload: validRecord.payload, day: validRecord.day, code })
    : JSON.stringify({ invalid: true, code });
  const marker = `<script id="dmw-challenge-data" type="application/json">${embeddedData}</script>`;
  const html = rootHtml.includes("</head>") ? rootHtml.replace("</head>", `${marker}</head>`) : `${marker}${rootHtml}`;
  const headers = new Headers(rootResponse.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Server-Timing", `short-link;dur=${Math.max(0, performance.now() - startedAt).toFixed(1)}`);
  headers.set("X-Robots-Tag", "noindex, nofollow");

  if (!validRecord) {
    headers.set("Cache-Control", "no-store");
    return withSecurityHeaders(new Response(html, { status: env.DB ? 404 : 503, headers }));
  }

  const remaining = Math.max(1, validRecord.expiresAt - Math.floor(Date.now() / 1000));
  headers.set("Cache-Control", `public, max-age=${Math.min(300, remaining)}, s-maxage=${Math.min(3600, remaining)}`);
  return withSecurityHeaders(new Response(html, { status: 200, headers }));
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/challenges" && request.method === "POST") {
      return withSecurityHeaders(await createChallengeResponse(request, env.DB));
    }

    if (url.pathname === "/api/live" && request.method === "POST") {
      return withSecurityHeaders(await handleLiveRequest(request, env.DB));
    }

    const shortChallengeMatch = url.pathname.match(/^\/c\/([A-Za-z0-9_-]+)$/);
    if (shortChallengeMatch && isShortChallengeCode(shortChallengeMatch[1]) && request.method === "GET") {
      return renderShortChallenge(request, shortChallengeMatch[1], env, ctx);
    }

    if (/^\/live\/[A-Z2-9]{12}\/?$/i.test(url.pathname) && request.method === "GET") {
      const liveUrl = new URL(request.url);
      liveUrl.pathname = "/live";
      const response = await handler.fetch(new Request(liveUrl, { method: "GET", headers: request.headers }), env, ctx);
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      headers.set("Cache-Control", "no-store");
      return withSecurityHeaders(new Response(response.body, { status: response.status, statusText: response.statusText, headers }));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(response);
    }

    return withSecurityHeaders(withDiscoveryCaching(request, await handler.fetch(request, env, ctx)));
  },
};

export default worker;
