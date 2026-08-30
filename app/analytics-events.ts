export const ANALYTICS_VARIANTS = {
  first_visit: [""],
  daily_active: [""],
  page_view: [""],
  discovery_source: ["chatgpt", "google", "bing", "other_search", "other_referral", "direct"],
  home_view: ["social_dare_v1"],
  hero_cta: ["random", "daily"],
  challenge_opened: ["shared", "daily"],
  challenge_started: ["random", "daily", "reply"],
  challenge_created: ["random", "daily", "reply"],
  guess_started: ["shared", "daily"],
  guess_completed: ["correct", "wrong", "timeout"],
  share: ["direct", "group", "copy", "result"],
  daily_completed: [""],
  live_entry: ["private", "quick", "invite"],
  live_room_created: ["private", "public"],
  live_invite_shared: ["home_native", "home_copy", "team_native", "team_copy", "quick_native", "quick_copy"],
  live_room_formed: ["home", "team", "quick"],
  live_game_started: ["home", "team", "quick"],
  live_game_finished: ["home", "team", "quick"],
  live_rematch_started: ["home", "team", "quick"],
  live_queue_entered: ["quick"],
  live_queue_timed_out: ["quick"],
  live_result_shared: ["home_native", "home_copy", "team_native", "team_copy", "quick_native", "quick_copy"],
  use_case_view: ["team"],
  use_case_cta: ["team"],
  use_case_live_entry: ["team"],
  use_case_room_created: ["team"],
} as const;

export type AnalyticsEvent = keyof typeof ANALYTICS_VARIANTS;

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  variant: string;
}

export function normalizeAnalyticsPayload(value: unknown): AnalyticsPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as { event?: unknown; variant?: unknown };
  if (typeof candidate.event !== "string" || !(candidate.event in ANALYTICS_VARIANTS)) return null;

  const event = candidate.event as AnalyticsEvent;
  const variant = typeof candidate.variant === "string" ? candidate.variant : "";
  const allowed = ANALYTICS_VARIANTS[event] as readonly string[];
  if (!allowed.includes(variant)) return null;
  return { event, variant };
}
