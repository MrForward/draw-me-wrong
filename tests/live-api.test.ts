import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { handleLiveRequest, normalizeLiveDrawing, type LiveDatabase, type LiveStatement } from "../worker/live-api";

class SqliteStatement implements LiveStatement {
  private values: Array<string | number | null> = [];

  constructor(private readonly database: DatabaseSync, private readonly query: string) {}

  bind(...values: Array<string | number | null>) {
    this.values = values;
    return this;
  }

  async first<T>() {
    return (this.database.prepare(this.query).get(...this.values) as T | undefined) ?? null;
  }

  async all<T>() {
    return { results: this.database.prepare(this.query).all(...this.values) as T[] };
  }

  async run() {
    const result = this.database.prepare(this.query).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

class SqliteLiveDatabase implements LiveDatabase {
  readonly raw = new DatabaseSync(":memory:");

  constructor() {
    this.raw.exec(`
      CREATE TABLE live_rooms (
        code TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'home', status TEXT NOT NULL,
        host_player_id TEXT NOT NULL, language_id INTEGER NOT NULL, queue_slot INTEGER,
        player_count INTEGER NOT NULL, round_number INTEGER NOT NULL, max_rounds INTEGER NOT NULL,
        drawer_player_id TEXT, prompt_id INTEGER, drawing_payload TEXT, phase_ends_at INTEGER,
        version INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE UNIQUE INDEX live_rooms_queue_slot_idx ON live_rooms(queue_slot);
      CREATE TABLE live_players (
        id TEXT PRIMARY KEY NOT NULL, room_code TEXT NOT NULL, token_hash TEXT NOT NULL,
        nickname TEXT NOT NULL, language_id INTEGER NOT NULL, seat_order INTEGER NOT NULL,
        score INTEGER NOT NULL, joined_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, left_at INTEGER
      );
      CREATE UNIQUE INDEX live_players_room_seat_idx ON live_players(room_code, seat_order);
      CREATE TABLE live_guesses (
        room_code TEXT NOT NULL, round_number INTEGER NOT NULL, player_id TEXT NOT NULL,
        option_index INTEGER NOT NULL, is_correct INTEGER NOT NULL, created_at INTEGER NOT NULL,
        PRIMARY KEY(room_code, round_number, player_id)
      );
      CREATE TABLE live_reports (
        room_code TEXT NOT NULL, round_number INTEGER NOT NULL, reporter_player_id TEXT NOT NULL,
        created_at INTEGER NOT NULL, PRIMARY KEY(room_code, round_number, reporter_player_id)
      );
      CREATE TABLE analytics_daily (
        day TEXT NOT NULL, event TEXT NOT NULL, variant TEXT NOT NULL DEFAULT '',
        count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(day, event, variant)
      );
    `);
  }

  prepare(query: string) {
    return new SqliteStatement(this.raw, query);
  }

  async batch(statements: LiveStatement[]) {
    return Promise.all(statements.map((statement) => statement.run()));
  }
}

type TestSession = { code: string; playerId: string; token: string };

async function livePost(database: LiveDatabase, body: Record<string, unknown>) {
  return handleLiveRequest(new Request("https://drawmewrong.fun/api/live", {
    method: "POST",
    headers: { origin: "https://drawmewrong.fun", "content-type": "application/json" },
    body: JSON.stringify(body),
  }), database);
}

async function createPlayer(database: LiveDatabase, action: "create" | "join", nickname: string, code?: string, source?: "home" | "team") {
  const response = await livePost(database, { action, nickname, locale: "en", code, source });
  if (!response.ok) assert.fail(await response.text());
  return (await response.json() as { session: TestSession }).session;
}

test("live drawing payload is answer-free and bounded", () => {
  const normalized = normalizeLiveDrawing({
    durationMs: 1200,
    promptId: 7,
    languageId: 2,
    strokes: [[{ x: 10.3, y: 20.8, t: 0 }, { x: 30, y: 40, t: 100 }]],
  });
  assert.deepEqual(normalized, { durationMs: 1200, strokes: [[{ x: 10, y: 21, t: 0 }, { x: 30, y: 40, t: 100 }]] });
  assert.doesNotMatch(JSON.stringify(normalized), /prompt|language/i);
  assert.equal(normalizeLiveDrawing({ durationMs: 100, strokes: [[{ x: 999, y: 0, t: 0 }]] }), null);
  assert.equal(normalizeLiveDrawing({ durationMs: 100, strokes: [] }), null);
});

test("live API rejects cross-site and untyped requests before database access", async () => {
  const crossSite = await handleLiveRequest(new Request("https://drawmewrong.fun/api/live", {
    method: "POST",
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    body: JSON.stringify({ action: "create" }),
  }), {} as never);
  assert.equal(crossSite.status, 403);

  const missingOrigin = await handleLiveRequest(new Request("https://drawmewrong.fun/api/live", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  }), {} as never);
  assert.equal(missingOrigin.status, 403);

  const untyped = await handleLiveRequest(new Request("https://drawmewrong.fun/api/live", {
    method: "POST",
    headers: { origin: "https://drawmewrong.fun" },
    body: "{}",
  }), {} as never);
  assert.equal(untyped.status, 400);
});

test("finished rooms restart the same group at the same URL and reset scores", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda");
  const guest = await createPlayer(database, "join", "Wobbly Tiger", host.code);
  const now = Math.floor(Date.now() / 1000);
  database.raw.prepare("UPDATE live_rooms SET status = 'finished', round_number = 2, max_rounds = 2, phase_ends_at = NULL WHERE code = ?").run(host.code);
  database.raw.prepare("UPDATE live_players SET score = 150 WHERE room_code = ?").run(host.code);
  database.raw.prepare("INSERT INTO live_guesses VALUES (?, 1, ?, 0, 1, ?)").run(host.code, guest.playerId, now);

  const response = await livePost(database, { action: "rematch", ...host });
  assert.equal(response.status, 200);
  const state = await response.json() as { room: { code: string; status: string; roundNumber: number; maxRounds: number }; players: Array<{ score: number }> };
  assert.equal(state.room.code, host.code);
  assert.equal(state.room.status, "starting");
  assert.equal(state.room.roundNumber, 0);
  assert.equal(state.room.maxRounds, 2);
  assert.deepEqual(state.players.map((player) => player.score), [0, 0]);
  assert.equal((database.raw.prepare("SELECT COUNT(*) AS count FROM live_guesses WHERE room_code = ?").get(host.code) as { count: number }).count, 0);

  const guestSync = await livePost(database, { action: "sync", ...guest });
  const guestState = await guestSync.json() as { room: { code: string; status: string } };
  assert.equal(guestState.room.code, host.code);
  assert.equal(guestState.room.status, "starting");
});

test("a departing lobby host hands control to the next player", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda");
  const guest = await createPlayer(database, "join", "Wobbly Tiger", host.code);

  const leave = await livePost(database, { action: "leave", ...host });
  assert.equal(leave.status, 200);
  const guestSync = await livePost(database, { action: "sync", ...guest });
  const state = await guestSync.json() as { room: { hostPlayerId: string; playerCount: number; status: string }; you: { isHost: boolean } };
  assert.equal(state.room.hostPlayerId, guest.playerId);
  assert.equal(state.room.playerCount, 1);
  assert.equal(state.room.status, "lobby");
  assert.equal(state.you.isHost, true);

  const replacement = await createPlayer(database, "join", "Sleepy Fox", host.code);
  assert.equal(replacement.code, host.code);
  const started = await livePost(database, { action: "start", ...guest });
  assert.equal(started.status, 200);
  assert.equal((await started.json() as { room: { status: string } }).room.status, "starting");
});

test("the drawer can explicitly skip a blank round", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda");
  await createPlayer(database, "join", "Wobbly Tiger", host.code);
  const now = Math.floor(Date.now() / 1000);
  database.raw.prepare("UPDATE live_rooms SET status = 'drawing', round_number = 1, max_rounds = 2, drawer_player_id = ?, prompt_id = 0, phase_ends_at = ? WHERE code = ?")
    .run(host.playerId, now + 10, host.code);

  const skipped = await livePost(database, { action: "skip", ...host });
  assert.equal(skipped.status, 200);
  const state = await skipped.json() as { room: { status: string; drawing: unknown; prompt: string } };
  assert.equal(state.room.status, "results");
  assert.equal(state.room.drawing, null);
  assert.equal(state.room.prompt, "Apple");
});

test("team rooms persist their source and count authoritative funnel transitions once", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda", undefined, "team");
  const preview = await livePost(database, { action: "preview", code: host.code });
  assert.deepEqual(await preview.json(), { source: "team" });
  const guest = await createPlayer(database, "join", "Wobbly Tiger", host.code);

  const formed = database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_room_formed' AND variant = 'team'").get() as { count: number };
  assert.equal(formed.count, 1);

  const guestSync = await livePost(database, { action: "sync", ...guest });
  assert.equal((await guestSync.json() as { room: { source: string } }).room.source, "team");

  await livePost(database, { action: "start", ...host });
  const now = Math.floor(Date.now() / 1000);
  database.raw.prepare("UPDATE live_rooms SET phase_ends_at = ? WHERE code = ?").run(now - 1, host.code);
  await livePost(database, { action: "sync", ...guest });
  await livePost(database, { action: "sync", ...host });
  const started = database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_game_started' AND variant = 'team'").get() as { count: number };
  assert.equal(started.count, 1);

  database.raw.prepare("UPDATE live_rooms SET status = 'results', round_number = 2, max_rounds = 2, phase_ends_at = ? WHERE code = ?").run(now - 1, host.code);
  await livePost(database, { action: "sync", ...guest });
  await livePost(database, { action: "sync", ...host });
  const finished = database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_game_finished' AND variant = 'team'").get() as { count: number };
  assert.equal(finished.count, 1);

  await livePost(database, { action: "rematch", ...host });
  const rematched = database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_rematch_started' AND variant = 'team'").get() as { count: number };
  assert.equal(rematched.count, 1);
});

test("finished rooms hand off an absent host without invalidating their session", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda");
  const guest = await createPlayer(database, "join", "Wobbly Tiger", host.code);
  const now = Math.floor(Date.now() / 1000);
  database.raw.prepare("UPDATE live_players SET last_seen_at = ? WHERE id = ?").run(now - 100, host.playerId);
  database.raw.prepare("UPDATE live_rooms SET status = 'finished', round_number = 2, max_rounds = 2, phase_ends_at = NULL WHERE code = ?").run(host.code);

  const guestSync = await livePost(database, { action: "sync", ...guest });
  const state = await guestSync.json() as { room: { hostPlayerId: string; playerCount: number }; you: { isHost: boolean } };
  assert.equal(state.room.hostPlayerId, guest.playerId);
  assert.equal(state.room.playerCount, 2);
  assert.equal(state.you.isHost, true);

  const rematch = await livePost(database, { action: "rematch", ...guest });
  assert.equal(rematch.status, 200);

  const hostSync = await livePost(database, { action: "sync", ...host });
  assert.equal(hostSync.status, 200);
  assert.equal((database.raw.prepare("SELECT left_at FROM live_players WHERE id = ?").get(host.playerId) as { left_at: number | null }).left_at, null);
});

test("quick match queue pauses and renews on the server", async () => {
  const database = new SqliteLiveDatabase();
  const matched = await livePost(database, { action: "match", nickname: "Dizzy Panda", locale: "en" });
  const body = await matched.json() as { session: TestSession; matchStatus: string };
  assert.equal(body.matchStatus, "queued");

  const paused = await livePost(database, { action: "pause_match", ...body.session });
  assert.equal(paused.status, 200);
  assert.equal((database.raw.prepare("SELECT queue_slot FROM live_rooms WHERE code = ?").get(body.session.code) as { queue_slot: number | null }).queue_slot, null);
  const timedOut = database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_queue_timed_out' AND variant = 'quick'").get() as { count: number };
  assert.equal(timedOut.count, 1);

  await livePost(database, { action: "pause_match", ...body.session });
  assert.equal((database.raw.prepare("SELECT count FROM analytics_daily WHERE event = 'live_queue_timed_out' AND variant = 'quick'").get() as { count: number }).count, 1);

  const renewed = await livePost(database, { action: "renew_match", ...body.session });
  assert.equal(renewed.status, 200);
  assert.equal((database.raw.prepare("SELECT queue_slot FROM live_rooms WHERE code = ?").get(body.session.code) as { queue_slot: number | null }).queue_slot, 1);
});

test("concurrent private joins receive distinct seats", async () => {
  const database = new SqliteLiveDatabase();
  const host = await createPlayer(database, "create", "Dizzy Panda");
  const [first, second] = await Promise.all([
    livePost(database, { action: "join", nickname: "Wobbly Tiger", locale: "en", code: host.code }),
    livePost(database, { action: "join", nickname: "Sleepy Fox", locale: "en", code: host.code }),
  ]);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const seats = database.raw.prepare("SELECT seat_order FROM live_players WHERE room_code = ? ORDER BY seat_order").all(host.code) as Array<{ seat_order: number }>;
  assert.deepEqual(seats.map((seat) => seat.seat_order), [0, 1, 2]);
});
