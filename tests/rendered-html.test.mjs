import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", database) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://draw-me-wrong.test${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: database },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

function challengeDatabase(record) {
  return {
    prepare() {
      let values = [];
      return {
        bind(...nextValues) {
          values = nextValues;
          return this;
        },
        async first() {
          if (values[0] !== record?.code || values[1] >= record?.expiresAt) return null;
          return record;
        },
      };
    },
  };
}

test("server-renders the finished game and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/i);
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=86400/);

  const html = await response.text();
  assert.match(html, /<title>Draw Me Wrong: Bad drawings, better together\.<\/title>/i);
  assert.match(html, /DRAW IT WRONG\. LAUGH TOGETHER\./);
  assert.match(html, /A tiny drawing game for people who can&#x27;t draw/);
  assert.match(html, /Take turns drawing a secret word in 10 seconds/);
  assert.match(html, /class="primary-cta live-hero-cta"[^>]*>Start a private room/);
  assert.match(html, /class="secondary-button"[^>]*>Send a 10-second dare/);
  assert.ok(html.indexOf("Start a private room") < html.indexOf("Send a 10-second dare"), "live room remains the first homepage action");
  assert.match(html, /Give me a prompt/);
  assert.match(html, /Play today&#x27;s prompt/);
  assert.match(html, /One bad drawing starts a chain/);
  assert.match(html, /Need a meeting icebreaker\?/);
  assert.match(html, /href="\/play\/team-icebreaker"/);
  assert.match(html, /property="og:image" content="https?:\/\/[^"]+\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
  assert.match(html, /name="google-site-verification" content="[^"]+"/i);
  assert.match(html, /rel="canonical" href="https?:\/\/[^"]+"/i);
  assert.match(html, /rel="icon" href="\/favicon\.svg"/i);
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
  assert.ok(jsonLdMatch, "expected product JSON-LD in the first HTML response");
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  const application = jsonLd["@graph"].find((entry) => Array.isArray(entry["@type"]) && entry["@type"].includes("WebApplication"));
  assert.equal(application.name, "Draw Me Wrong");
  assert.equal(application.url, "https://drawmewrong.fun/");
  assert.equal(application.applicationCategory, "GameApplication");
  assert.equal(application.offers.price, "0");
  assert.equal(application.offers.priceCurrency, "USD");
  assert.equal(application.aggregateRating, undefined);
  assert.equal(application.review, undefined);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project|react-loading-skeleton/i);
});

test("starter-only preview assets are gone and the landing route stays static", async () => {
  const [page, gameClient, layout, packageJson, readme] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  assert.match(page, /dynamic\s*=\s*["']force-static["']/);
  assert.match(gameClient, /encodeChallenge/);
  assert.match(gameClient, /LOCALES\.map/);
  assert.match(layout, /Draw Me Wrong/);
  assert.doesNotMatch(packageJson, /starter|react-loading-skeleton/i);
  assert.doesNotMatch(readme, /vinext-starter|ChatGPT sign-in helper/i);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/favicon.svg", import.meta.url));
});

test("a short URL embeds its immutable challenge in the first HTML response", async () => {
  const code = "AAECAwQFBgcICQoL";
  const payload = "1wECACgAAQIKFAAAHigJfDI";
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const response = await render(`/c/${code}`, challengeDatabase({ code, payload, day: null, expiresAt }));
  assert.equal(response.status, 200);
  const shortLinkTtl = Number(response.headers.get("cache-control")?.match(/s-maxage=(\d+)/)?.[1]);
  assert.ok(shortLinkTtl >= 3590 && shortLinkTtl <= 3600, `expected about one hour of short-link cache, got ${shortLinkTtl}`);
  assert.match(response.headers.get("server-timing") ?? "", /^short-link;dur=/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const html = await response.text();
  assert.match(html, new RegExp(`<script id="dmw-challenge-data" type="application/json">[^<]*${payload}`));
  assert.match(html, /DRAW IT WRONG\. LAUGH TOGETHER\./);
});

test("live rooms render directly and through an invite URL", async () => {
  for (const path of ["/live", "/live/23456789ABCD"]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /A bad drawing is better live\./);
    assert.match(html, /Start a private room/);
    assert.match(html, /Quick match/);
    assert.doesNotMatch(html, /sign.?in|login/i);
    assert.match(html, /name="robots" content="noindex, nofollow"/i);
    if (path !== "/live") assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  }
});

test("team icebreaker route is substantive, indexable, and enters the tailored room flow", async () => {
  const response = await render("/play/team-icebreaker");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=86400/);
  const html = await response.text();
  assert.match(html, /5-minute drawing icebreaker for remote teams/i);
  assert.match(html, /Break the ice\. Draw it wrong\./);
  assert.match(html, /remote team laughing/i);
  assert.match(html, /sprint retro/i);
  assert.match(html, /2-6 players/i);
  assert.match(html, /What is a drawing icebreaker\?/i);
  assert.match(html, /How long does it take, and how many people can play\?/i);
  assert.match(html, /free to play in a modern phone or laptop browser/i);
  assert.match(html, /href="\/live\?p=team"/);
  assert.match(html, /rel="canonical" href="https?:\/\/[^"]+\/play\/team-icebreaker"/i);
  assert.match(html, /property="og:title" content="5-Minute Drawing Icebreaker for Remote Teams \| Draw Me Wrong"/i);
  assert.match(html, /property="og:image" content="https?:\/\/[^"]+\/og\.png"/i);
  assert.doesNotMatch(html, /name="robots" content="noindex/i);
  assert.doesNotMatch(html, /sign.?in|login/i);
});

test("search controls expose only indexable product pages", async () => {
  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robots.headers.get("cache-control") ?? "", /s-maxage=86400/);
  assert.match(robotsText, /User-Agent: OAI-SearchBot/i);
  assert.match(robotsText, /User-Agent: GPTBot/i);
  assert.match(robotsText, /User-Agent: ChatGPT-User/i);
  const wildcardBlock = robotsText.match(/User-Agent: \*\r?\n([\s\S]*?)(?:\r?\n\r?\n|$)/i)?.[1] ?? "";
  assert.match(wildcardBlock, /Allow: \//);
  assert.match(wildcardBlock, /Disallow: \/api\//);
  assert.doesNotMatch(wildcardBlock, /Disallow: \/c\//);
  assert.doesNotMatch(wildcardBlock, /Disallow: \/live\//);
  assert.match(robotsText, /Sitemap: https:\/\/drawmewrong\.fun\/sitemap\.xml/);

  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /https:\/\/drawmewrong\.fun\//);
  assert.match(sitemapText, /https:\/\/drawmewrong\.fun\/play\/team-icebreaker/);
  assert.doesNotMatch(sitemapText, /\/live|\/c\//);
});
