export type LiveRoomSource = "home" | "team" | "quick";

export function liveInvitePath(code: string, source: LiveRoomSource) {
  return `/live/${code}${source === "team" ? "?p=team" : ""}`;
}
