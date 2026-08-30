import { AnalyticsEvent, normalizeAnalyticsPayload } from "./analytics-events";

const FIRST_VISIT_KEY = "dmw-metrics-seen-v1";
const DAILY_ACTIVE_KEY = "dmw-metrics-day-v1";
const DISCOVERY_SOURCE_KEY = "dmw-discovery-source-v1";

export type DiscoverySource = "chatgpt" | "google" | "bing" | "other_search" | "other_referral" | "direct";

export function classifyDiscoverySource(utmSource: string | null, referrer: string): DiscoverySource {
  const campaignSource = utmSource?.trim().toLowerCase() ?? "";
  if (campaignSource === "chatgpt" || campaignSource === "chatgpt.com" || campaignSource === "openai") return "chatgpt";
  if (campaignSource === "google") return "google";
  if (campaignSource === "bing") return "bing";

  if (!referrer) return "direct";
  let hostname = "";
  try { hostname = new URL(referrer).hostname.toLowerCase(); } catch { return "other_referral"; }

  if (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com") || hostname === "chat.openai.com") return "chatgpt";
  if (/(^|\.)google\./.test(hostname)) return "google";
  if (hostname === "bing.com" || hostname.endsWith(".bing.com")) return "bing";
  if (
    hostname === "duckduckgo.com" || hostname.endsWith(".duckduckgo.com") ||
    hostname === "search.brave.com" || hostname.endsWith(".search.brave.com") ||
    hostname === "search.yahoo.com" || hostname.endsWith(".search.yahoo.com") ||
    hostname === "ecosia.org" || hostname.endsWith(".ecosia.org")
  ) return "other_search";
  return "other_referral";
}

export function trackAnalytics(event: AnalyticsEvent, variant = ""): void {
  const payload = normalizeAnalyticsPayload({ event, variant });
  if (!payload || typeof window === "undefined") return;

  void window.fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    credentials: "omit",
    keepalive: true,
    referrerPolicy: "no-referrer",
  }).catch(() => {
    // Metrics must never interrupt the game.
  });
}

export function trackPresence(day: string): void {
  trackAnalytics("page_view");

  try {
    if (window.localStorage.getItem(FIRST_VISIT_KEY) !== "1") {
      window.localStorage.setItem(FIRST_VISIT_KEY, "1");
      trackAnalytics("first_visit");
    }
    if (window.localStorage.getItem(DAILY_ACTIVE_KEY) !== day) {
      window.localStorage.setItem(DAILY_ACTIVE_KEY, day);
      trackAnalytics("daily_active");
    }
  } catch {
    // Device-local deduplication is optional; page views still count.
  }
}

export function trackDiscoverySource(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(DISCOVERY_SOURCE_KEY) === "1") return;
    window.sessionStorage.setItem(DISCOVERY_SOURCE_KEY, "1");
  } catch {
    // Session deduplication is optional.
  }

  const campaignSource = new URLSearchParams(window.location.search).get("utm_source");
  trackAnalytics("discovery_source", classifyDiscoverySource(campaignSource, document.referrer));
}
