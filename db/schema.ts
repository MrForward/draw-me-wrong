import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const analyticsDaily = sqliteTable(
  "analytics_daily",
  {
    day: text("day").notNull(),
    event: text("event").notNull(),
    variant: text("variant").notNull().default(""),
    count: integer("count").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.day, table.event, table.variant] }),
  ],
);

export const shortChallenges = sqliteTable(
  "short_challenges",
  {
    code: text("code").primaryKey().notNull(),
    payload: text("payload").notNull(),
    day: text("day"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [
    index("short_challenges_expires_at_idx").on(table.expiresAt),
  ],
);

export const liveRooms = sqliteTable(
  "live_rooms",
  {
    code: text("code").primaryKey().notNull(),
    kind: text("kind").notNull(),
    source: text("source").notNull().default("home"),
    status: text("status").notNull().default("lobby"),
    hostPlayerId: text("host_player_id").notNull(),
    languageId: integer("language_id").notNull(),
    queueSlot: integer("queue_slot"),
    playerCount: integer("player_count").notNull().default(1),
    roundNumber: integer("round_number").notNull().default(0),
    maxRounds: integer("max_rounds").notNull().default(0),
    drawerPlayerId: text("drawer_player_id"),
    promptId: integer("prompt_id"),
    drawingPayload: text("drawing_payload"),
    phaseEndsAt: integer("phase_ends_at"),
    version: integer("version").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [
    index("live_rooms_match_idx").on(table.kind, table.status, table.updatedAt),
    index("live_rooms_expires_at_idx").on(table.expiresAt),
    uniqueIndex("live_rooms_queue_slot_idx").on(table.queueSlot),
  ],
);

export const livePlayers = sqliteTable(
  "live_players",
  {
    id: text("id").primaryKey().notNull(),
    roomCode: text("room_code").notNull(),
    tokenHash: text("token_hash").notNull(),
    nickname: text("nickname").notNull(),
    languageId: integer("language_id").notNull().default(0),
    seatOrder: integer("seat_order").notNull(),
    score: integer("score").notNull().default(0),
    joinedAt: integer("joined_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
    leftAt: integer("left_at"),
  },
  (table) => [
    index("live_players_room_idx").on(table.roomCode),
    uniqueIndex("live_players_room_seat_idx").on(table.roomCode, table.seatOrder),
  ],
);

export const liveGuesses = sqliteTable(
  "live_guesses",
  {
    roomCode: text("room_code").notNull(),
    roundNumber: integer("round_number").notNull(),
    playerId: text("player_id").notNull(),
    optionIndex: integer("option_index").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomCode, table.roundNumber, table.playerId] }),
  ],
);

export const liveReports = sqliteTable(
  "live_reports",
  {
    roomCode: text("room_code").notNull(),
    roundNumber: integer("round_number").notNull(),
    reporterPlayerId: text("reporter_player_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.roomCode, table.roundNumber, table.reporterPlayerId] })],
);
