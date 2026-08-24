import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://draw-me-wrong.test/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished game and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/i);

  const html = await response.text();
  assert.match(html, /<title>Draw Me Wrong: 10 seconds\. One guess\.<\/title>/i);
  assert.match(html, /CAN THEY GUESS IT\?/);
  assert.match(html, /Make a 10-second challenge/);
  assert.match(html, /Today&#x27;s Disaster/);
  assert.match(html, /How the disaster spreads/);
  assert.match(html, /property="og:image" content="https?:\/\/[^"]+\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
  assert.match(html, /rel="canonical" href="https?:\/\/[^"]+"/i);
  assert.match(html, /rel="icon" href="\/favicon\.svg"/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project|react-loading-skeleton/i);
});

test("starter-only preview assets are gone", async () => {
  const [page, layout, packageJson, readme] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  assert.match(page, /encodeChallenge/);
  assert.match(page, /LOCALES\.map/);
  assert.match(layout, /Draw Me Wrong/);
  assert.doesNotMatch(packageJson, /starter|react-loading-skeleton|drizzle/i);
  assert.doesNotMatch(readme, /vinext-starter|ChatGPT sign-in helper/i);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/favicon.svg", import.meta.url));
});
