import assert from "node:assert/strict";
import test from "node:test";
import { classifyDiscoverySource } from "../app/analytics-client";
import { ANALYTICS_VARIANTS, normalizeAnalyticsPayload } from "../app/analytics-events";

test("accepts every allowlisted aggregate event", () => {
  for (const [event, variants] of Object.entries(ANALYTICS_VARIANTS)) {
    for (const variant of variants) {
      assert.deepEqual(normalizeAnalyticsPayload({ event, variant }), { event, variant });
    }
  }
});

test("rejects unknown events and dimensions", () => {
  assert.equal(normalizeAnalyticsPayload(null), null);
  assert.equal(normalizeAnalyticsPayload({ event: "drawing_uploaded", variant: "" }), null);
  assert.equal(normalizeAnalyticsPayload({ event: "share", variant: "challenge-url" }), null);
  assert.equal(normalizeAnalyticsPayload({ event: "guess_completed", variant: "prompt-42" }), null);
});

test("normalizes omitted variants only for dimensionless events", () => {
  assert.deepEqual(normalizeAnalyticsPayload({ event: "page_view" }), { event: "page_view", variant: "" });
  assert.equal(normalizeAnalyticsPayload({ event: "share" }), null);
});

test("classifies discovery without exposing a raw referrer", () => {
  assert.equal(classifyDiscoverySource("chatgpt.com", ""), "chatgpt");
  assert.equal(classifyDiscoverySource(null, "https://chatgpt.com/c/abc"), "chatgpt");
  assert.equal(classifyDiscoverySource(null, "https://www.google.co.in/search?q=drawing+icebreaker"), "google");
  assert.equal(classifyDiscoverySource(null, "https://www.bing.com/search?q=drawing+game"), "bing");
  assert.equal(classifyDiscoverySource(null, "https://duckduckgo.com/?q=team+game"), "other_search");
  assert.equal(classifyDiscoverySource(null, "https://example.com/a/very/private/path"), "other_referral");
  assert.equal(classifyDiscoverySource(null, ""), "direct");
});
