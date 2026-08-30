import { LOCALES, PROMPTS } from "../app/game-data";

export interface LiveStatement {
  bind(...values: Array<string | number | null>): LiveStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}

export interface LiveDatabase {
  prepare(query: string): LiveStatement;
  batch(statements: LiveStatement[]): Promise<unknown[]>;
}

type RoomStatus = "lobby" | "starting" | "drawing" | "guessing" | "results" | "finished";
type RoomKind = "private" | "public";
type RoomSource = "home" | "team" | "quick";

type Room = {
  code: string;
  kind: RoomKind;
  source: RoomSource;
  status: RoomStatus;
  hostPlayerId: string;
  languageId: number;
  playerCount: number;
  roundNumber: number;
  maxRounds: number;
  drawerPlayerId: string | null;
  promptId: number | null;
  drawingPayload: string | null;
  phaseEndsAt: number | null;
  version: number;
  expiresAt: number;
};

type Player = {
  id: string;
  nickname: string;
  languageId: number;
  seatOrder: number;
  score: number;
  lastSeenAt: number;
  leftAt: number | null;
};

type LiveDrawing = {
  durationMs: number;
  strokes: Array<Array<{ x: number; y: number; t: number }>>;
};

const ROOM_SECONDS = 2 * 60 * 60;
// The extra four seconds absorb first-poll latency and leave the client time to
// deliver an auto-submit while still presenting a truthful ten-second round.
const DRAW_PHASE_SECONDS = 14;
const GUESS_SECONDS = 14;
const RESULTS_SECONDS = 8;
const QUICK_QUEUE_SECONDS = 30;
const HOST_HANDOFF_SECONDS = 90;
const MAX_PLAYERS = 6;
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const SAFE_NAMES = new Set(["Dizzy Panda", "Wobbly Tiger", "Sleepy Fox", "Tiny Whale", "Odd Penguin", "Happy Gecko", "Messy Koala", "Brave Otter", "Silly Yak", "Lucky Crow", "Neon Snail", "Wild Llama"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function randomId(length: number) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nickname(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = Array.from(value.normalize("NFKC"), (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? "" : character).join("").replace(/\s+/g, " ").trim();
  return clean.length >= 2 && clean.length <= 18 && SAFE_NAMES.has(clean) ? clean : null;
}

export function normalizeLiveDrawing(value: unknown): LiveDrawing | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as { durationMs?: unknown; strokes?: unknown };
  if (typeof candidate.durationMs !== "number" || candidate.durationMs < 100 || candidate.durationMs > 10_000 || !Array.isArray(candidate.strokes)) return null;
  if (candidate.strokes.length < 1 || candidate.strokes.length > 24) return null;
  let total = 0;
  const strokes: LiveDrawing["strokes"] = [];
  for (const rawStroke of candidate.strokes) {
    if (!Array.isArray(rawStroke) || rawStroke.length < 1 || rawStroke.length > 96) return null;
    total += rawStroke.length;
    if (total > 120) return null;
    const stroke: LiveDrawing["strokes"][number] = [];
    let previousTime = -1;
    for (const rawPoint of rawStroke) {
      if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) return null;
      const point = rawPoint as { x?: unknown; y?: unknown; t?: unknown };
      if (![point.x, point.y, point.t].every(Number.isFinite)) return null;
      const x = Math.round(point.x as number);
      const y = Math.round(point.y as number);
      const t = Math.round(point.t as number);
      if (x < 0 || x > 255 || y < 0 || y > 255 || t < 0 || t > 10_000 || t < previousTime) return null;
      previousTime = t;
      stroke.push({ x, y, t });
    }
    strokes.push(stroke);
  }
  return { durationMs: Math.round(candidate.durationMs), strokes };
}

function parseDrawing(value: string | null) {
  if (!value) return null;
  try {
    return normalizeLiveDrawing(JSON.parse(value));
  } catch {
    return null;
  }
}

function languageId(value: unknown) {
  if (typeof value !== "string") return 0;
  const exact = LOCALES.indexOf(value as (typeof LOCALES)[number]);
  if (exact >= 0) return exact;
  const base = value.toLowerCase().split("-")[0];
  const loose = LOCALES.findIndex((locale) => locale.toLowerCase().split("-")[0] === base);
  return loose >= 0 ? loose : 0;
}

function roomSource(value: unknown): Exclude<RoomSource, "quick"> {
  return value === "team" ? "team" : "home";
}

async function trackServerEvent(db: LiveDatabase, event: string, variant: RoomSource, now: number) {
  try {
    const day = new Date(now * 1000).toISOString().slice(0, 10);
    await db.prepare(`
      INSERT INTO analytics_daily (day, event, variant, count, updated_at)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(day, event, variant) DO UPDATE SET
        count = count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(day, event, variant).run();
  } catch (error) {
    // Product measurement must never interrupt a live game.
    console.error("live analytics error", error);
  }
}

function optionOrder(promptId: number, round: number) {
  const values = [0, 1, 2, 3];
  let seed = ((promptId + 1) * 2654435761 + round * 1013904223) >>> 0;
  for (let index = values.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (index + 1);
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

async function readRoom(db: LiveDatabase, code: string) {
  return db.prepare(`
    SELECT code, kind, source, status, host_player_id AS hostPlayerId, language_id AS languageId,
      player_count AS playerCount, round_number AS roundNumber, max_rounds AS maxRounds,
      drawer_player_id AS drawerPlayerId, prompt_id AS promptId, drawing_payload AS drawingPayload,
      phase_ends_at AS phaseEndsAt, version, expires_at AS expiresAt
    FROM live_rooms WHERE code = ? LIMIT 1
  `).bind(code).first<Room>();
}

async function authenticate(db: LiveDatabase, code: string, playerId: unknown, token: unknown) {
  if (typeof playerId !== "string" || typeof token !== "string" || playerId.length > 40 || token.length > 80) return null;
  const tokenHash = await hashToken(token);
  return db.prepare(`
    SELECT id, nickname, language_id AS languageId, seat_order AS seatOrder, score, last_seen_at AS lastSeenAt, left_at AS leftAt
    FROM live_players WHERE id = ? AND room_code = ? AND token_hash = ? LIMIT 1
  `).bind(playerId, code, tokenHash).first<Player>();
}

async function addPlayer(db: LiveDatabase, room: Room, name: string, locale: unknown, now: number) {
  if (room.status !== "lobby") return null;
  const publicRoom = room.kind === "public";
  const reserved = await db.prepare(publicRoom ? `
    UPDATE live_rooms SET player_count = player_count + 1, status = 'starting', queue_slot = NULL,
      max_rounds = player_count + 1, phase_ends_at = ?, updated_at = ?, expires_at = ?, version = version + 1
    WHERE code = ? AND status = 'lobby' AND player_count = 1
    RETURNING player_count AS playerCount
  ` : `
    UPDATE live_rooms SET player_count = player_count + 1, updated_at = ?, expires_at = ?, version = version + 1
    WHERE code = ? AND status = 'lobby' AND player_count < ?
    RETURNING player_count AS playerCount
  `).bind(...(publicRoom
    ? [now + 5, now, now + ROOM_SECONDS, room.code]
    : [now, now + ROOM_SECONDS, room.code, MAX_PLAYERS])).first<{ playerCount: number }>();
  if (!reserved) return null;
  const id = randomId(14);
  const token = randomToken();
  const tokenHash = await hashToken(token);
  let inserted = false;
  for (let attempt = 0; attempt < 4 && !inserted; attempt += 1) {
    const nextSeat = (await db.prepare("SELECT COALESCE(MAX(seat_order), -1) + 1 AS seatOrder FROM live_players WHERE room_code = ?")
      .bind(room.code).first<{ seatOrder: number }>())?.seatOrder ?? reserved.playerCount - 1;
    try {
      const result = await db.prepare(`
        INSERT INTO live_players (id, room_code, token_hash, nickname, language_id, seat_order, score, joined_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).bind(id, room.code, tokenHash, name, languageId(locale), nextSeat, now, now).run();
      inserted = result.meta?.changes === 1;
    } catch {
      // A concurrent join may have claimed this seat after MAX was read. Retry
      // with the next authoritative value before releasing the reservation.
    }
  }
  if (!inserted) {
    await db.prepare(publicRoom ? `
      UPDATE OR IGNORE live_rooms SET player_count = MAX(1, player_count - 1), status = 'lobby',
        queue_slot = 1, max_rounds = 0, phase_ends_at = NULL, updated_at = ?, version = version + 1
      WHERE code = ?
    ` : "UPDATE live_rooms SET player_count = MAX(1, player_count - 1), updated_at = ?, version = version + 1 WHERE code = ?")
      .bind(now, room.code).run();
    return null;
  }
  if (reserved.playerCount === 2) await trackServerEvent(db, "live_room_formed", room.source, now);
  return { id, token, code: room.code };
}

async function createRoom(db: LiveDatabase, kind: RoomKind, source: RoomSource, name: string, locale: unknown, now: number) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = randomId(12);
    const id = randomId(14);
    const token = randomToken();
    const result = await db.prepare(`
      INSERT OR IGNORE INTO live_rooms
        (code, kind, source, status, host_player_id, language_id, queue_slot, player_count, round_number, max_rounds, version, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, 'lobby', ?, ?, ?, 1, 0, 0, 0, ?, ?, ?)
    `).bind(code, kind, source, id, languageId(locale), kind === "public" ? 1 : null, now, now, now + ROOM_SECONDS).run();
    if (result.meta?.changes !== 1) {
      if (kind === "public") return null;
      continue;
    }
    try {
      await db.prepare(`
        INSERT INTO live_players (id, room_code, token_hash, nickname, language_id, seat_order, score, joined_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
      `).bind(id, code, await hashToken(token), name, languageId(locale), now, now).run();
    } catch {
      await db.prepare("DELETE FROM live_rooms WHERE code = ?").bind(code).run();
      continue;
    }
    if (kind === "public") await trackServerEvent(db, "live_queue_entered", "quick", now);
    return { id, token, code };
  }
  if (kind === "public") return null;
  throw new Error("Unable to allocate room");
}

async function startRound(db: LiveDatabase, room: Room, now: number) {
  const nextRound = room.roundNumber + 1;
  if (room.maxRounds > 0 && nextRound > room.maxRounds) {
    const finished = await db.prepare(`
      UPDATE live_rooms SET status = 'finished', phase_ends_at = NULL, version = version + 1, updated_at = ?
      WHERE code = ? AND status = 'results' AND round_number = ?
    `).bind(now, room.code, room.roundNumber).run();
    if (finished.meta?.changes === 1) await trackServerEvent(db, "live_game_finished", room.source, now);
    return;
  }
  const activeCount = (await db.prepare("SELECT COUNT(*) AS count FROM live_players WHERE room_code = ? AND left_at IS NULL")
    .bind(room.code).first<{ count: number }>())?.count ?? 0;
  if (activeCount < 2) {
    await db.prepare(`UPDATE live_rooms SET status = 'lobby', max_rounds = 0, phase_ends_at = NULL, version = version + 1, updated_at = ? WHERE code = ?`)
      .bind(now, room.code).run();
    return;
  }
  const drawer = await db.prepare(`
    SELECT id FROM live_players WHERE room_code = ? AND left_at IS NULL ORDER BY seat_order LIMIT 1 OFFSET ?
  `).bind(room.code, Math.max(0, (nextRound - 1) % activeCount)).first<{ id: string }>();
  if (!drawer) {
    await db.prepare(`UPDATE live_rooms SET status = 'finished', phase_ends_at = NULL, version = version + 1 WHERE code = ?`).bind(room.code).run();
    return;
  }
  const promptId = crypto.getRandomValues(new Uint8Array(1))[0] % PROMPTS.length;
  const started = await db.prepare(`
    UPDATE live_rooms SET status = 'drawing', round_number = ?, drawer_player_id = ?, prompt_id = ?,
      drawing_payload = NULL, phase_ends_at = ?, updated_at = ?, expires_at = ?, version = version + 1
    WHERE code = ? AND status IN ('starting', 'results')
  `).bind(nextRound, drawer.id, promptId, now + DRAW_PHASE_SECONDS, now, now + ROOM_SECONDS, room.code).run();
  if (nextRound === 1 && started.meta?.changes === 1) await trackServerEvent(db, "live_game_started", room.source, now);
}

async function advanceExpired(db: LiveDatabase, room: Room, now: number) {
  if (!room.phaseEndsAt || room.phaseEndsAt > now) return room;
  if (room.status === "starting") {
    const count = await db.prepare("SELECT COUNT(*) AS count FROM live_players WHERE room_code = ? AND left_at IS NULL")
      .bind(room.code).first<{ count: number }>();
    if ((count?.count ?? 0) < 2) {
      await db.prepare(`UPDATE live_rooms SET status = 'lobby', phase_ends_at = NULL, version = version + 1 WHERE code = ? AND status = 'starting'`).bind(room.code).run();
    } else {
      await startRound(db, room, now);
    }
  } else if (room.status === "drawing" || room.status === "guessing") {
    await db.prepare(`UPDATE live_rooms SET status = 'results', phase_ends_at = ?, updated_at = ?, version = version + 1 WHERE code = ? AND status = ? AND round_number = ?`)
      .bind(now + RESULTS_SECONDS, now, room.code, room.status, room.roundNumber).run();
  } else if (room.status === "results") {
    await startRound(db, room, now);
  }
  return (await readRoom(db, room.code)) ?? room;
}

async function roomView(db: LiveDatabase, room: Room, player: Player, now: number) {
  const players = (await db.prepare(`
    SELECT id, nickname, language_id AS languageId, seat_order AS seatOrder, score, last_seen_at AS lastSeenAt, left_at AS leftAt
    FROM live_players WHERE room_code = ? ORDER BY seat_order
  `).bind(room.code).all<Player>()).results ?? [];
  const guess = room.roundNumber > 0
    ? await db.prepare("SELECT option_index AS optionIndex, is_correct AS isCorrect FROM live_guesses WHERE room_code = ? AND round_number = ? AND player_id = ? LIMIT 1")
      .bind(room.code, room.roundNumber, player.id).first<{ optionIndex: number; isCorrect: number }>()
    : null;
  const guessCount = room.roundNumber > 0
    ? (await db.prepare("SELECT COUNT(*) AS count FROM live_guesses WHERE room_code = ? AND round_number = ?").bind(room.code, room.roundNumber).first<{ count: number }>())?.count ?? 0
    : 0;
  const prompt = room.promptId === null ? null : PROMPTS[room.promptId];
  const locale = LOCALES[player.languageId] ?? "en";
  const order = prompt ? optionOrder(prompt.id, room.roundNumber) : [0, 1, 2, 3];
  const reveal = room.status === "results" || room.status === "finished";
  return {
    room: {
      code: room.code,
      kind: room.kind,
      source: room.source,
      status: room.status,
      roundNumber: room.roundNumber,
      maxRounds: room.maxRounds,
      playerCount: room.playerCount,
      phaseEndsAt: room.phaseEndsAt,
      version: room.version,
      hostPlayerId: room.hostPlayerId,
      drawerPlayerId: room.drawerPlayerId,
      drawing: room.status === "guessing" || reveal ? parseDrawing(room.drawingPayload) : null,
      promptId: prompt && player.id === room.drawerPlayerId && room.status === "drawing" ? prompt.id : null,
      prompt: prompt && (player.id === room.drawerPlayerId || reveal) ? prompt.words[locale][0] : null,
      options: prompt && (room.status === "guessing" || reveal) ? order.map((index) => prompt.words[locale][index]) : [],
      correctIndex: reveal ? order.indexOf(0) : null,
      guessCount,
      eligibleGuesses: Math.max(0, players.filter((item) => !item.leftAt).length - 1),
    },
    you: { id: player.id, nickname: player.nickname, isHost: room.hostPlayerId === player.id, isDrawer: room.drawerPlayerId === player.id, guess },
    players: players.map((item) => ({ id: item.id, nickname: item.nickname, score: item.score, online: !item.leftAt && now - item.lastSeenAt <= 12, left: Boolean(item.leftAt) })),
    serverNow: now,
  };
}

async function remainingPlayers(db: LiveDatabase, code: string) {
  return (await db.prepare(`
    SELECT id, nickname, language_id AS languageId, seat_order AS seatOrder, score,
      last_seen_at AS lastSeenAt, left_at AS leftAt
    FROM live_players WHERE room_code = ? AND left_at IS NULL ORDER BY seat_order
  `).bind(code).all<Player>()).results ?? [];
}

async function updateRoomAfterDeparture(db: LiveDatabase, room: Room, player: Player, now: number) {
  await db.prepare("UPDATE live_players SET left_at = ?, last_seen_at = ? WHERE id = ? AND left_at IS NULL")
    .bind(now, now, player.id).run();
  const remaining = await remainingPlayers(db, room.code);
  if (remaining.length === 0) {
    await db.batch([
      db.prepare("DELETE FROM live_guesses WHERE room_code = ?").bind(room.code),
      db.prepare("DELETE FROM live_reports WHERE room_code = ?").bind(room.code),
      db.prepare("DELETE FROM live_players WHERE room_code = ?").bind(room.code),
      db.prepare("DELETE FROM live_rooms WHERE code = ?").bind(room.code),
    ]);
    return;
  }

  const nextHost = room.hostPlayerId === player.id ? remaining[0].id : room.hostPlayerId;
  const shouldReturnToLobby = room.status === "starting" && remaining.length < 2;
  await db.prepare(`
    UPDATE live_rooms SET host_player_id = ?, player_count = ?,
      status = CASE WHEN ? = 1 THEN 'lobby' ELSE status END,
      max_rounds = CASE WHEN status IN ('drawing', 'guessing', 'results') THEN MIN(max_rounds, ?) WHEN ? = 1 THEN 0 ELSE max_rounds END,
      phase_ends_at = CASE WHEN ? = 1 THEN NULL ELSE phase_ends_at END,
      queue_slot = NULL, updated_at = ?, expires_at = ?, version = version + 1
    WHERE code = ?
  `).bind(nextHost, remaining.length, shouldReturnToLobby ? 1 : 0, remaining.length, shouldReturnToLobby ? 1 : 0,
    shouldReturnToLobby ? 1 : 0, now, now + ROOM_SECONDS, room.code).run();
  if (room.kind === "public" && shouldReturnToLobby) {
    await db.prepare(`
      UPDATE OR IGNORE live_rooms SET queue_slot = 1, updated_at = ?, version = version + 1
      WHERE code = ? AND kind = 'public' AND status = 'lobby' AND player_count = 1
    `).bind(now, room.code).run();
  }
}

async function migrateStaleHost(db: LiveDatabase, room: Room, now: number) {
  const host = await db.prepare(`
    SELECT id, nickname, language_id AS languageId, seat_order AS seatOrder, score,
      last_seen_at AS lastSeenAt, left_at AS leftAt
    FROM live_players WHERE id = ? AND room_code = ? LIMIT 1
  `).bind(room.hostPlayerId, room.code).first<Player>();
  if (!host || host.leftAt || now - host.lastSeenAt <= HOST_HANDOFF_SECONDS) return room;
  const nextHost = await db.prepare(`
    SELECT id FROM live_players
    WHERE room_code = ? AND id != ? AND left_at IS NULL AND last_seen_at >= ?
    ORDER BY seat_order LIMIT 1
  `).bind(room.code, host.id, now - HOST_HANDOFF_SECONDS).first<{ id: string }>();
  if (!nextHost) return room;
  await db.prepare(`
    UPDATE live_rooms SET host_player_id = ?, updated_at = ?, version = version + 1
    WHERE code = ? AND host_player_id = ?
  `).bind(nextHost.id, now, room.code, host.id).run();
  return (await readRoom(db, room.code)) ?? room;
}

async function parseBody(request: Request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new Error("bad_type");
  const raw = await request.text();
  if (raw.length > 24_000) throw new Error("too_large");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("bad_request");
  return value as Record<string, unknown>;
}

async function maybeCleanExpiredRooms(db: LiveDatabase, now: number) {
  if ((crypto.getRandomValues(new Uint8Array(1))[0] & 31) !== 0) return;
  await db.prepare("DELETE FROM live_guesses WHERE room_code IN (SELECT code FROM live_rooms WHERE expires_at <= ?)").bind(now).run();
  await db.prepare("DELETE FROM live_reports WHERE room_code IN (SELECT code FROM live_rooms WHERE expires_at <= ?)").bind(now).run();
  await db.prepare("DELETE FROM live_players WHERE room_code IN (SELECT code FROM live_rooms WHERE expires_at <= ?)").bind(now).run();
  await db.prepare("DELETE FROM live_rooms WHERE expires_at <= ?").bind(now).run();
}

export async function handleLiveRequest(request: Request, db?: LiveDatabase) {
  if (!db) return json({ error: "Live rooms are unavailable." }, 503);
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return json({ error: "Cross-site request rejected." }, 403);
  let body: Record<string, unknown>;
  try {
    body = await parseBody(request);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const action = body.action;
  const now = Math.floor(Date.now() / 1000);
  try {
    if (action === "create" || action === "match") {
      const name = nickname(body.nickname);
      if (!name) return json({ error: "Use a nickname with 2–18 characters." }, 400);
      await maybeCleanExpiredRooms(db, now);
      if (action === "match") {
        await db.prepare(`
          UPDATE live_rooms SET queue_slot = NULL, updated_at = ?, version = version + 1
          WHERE queue_slot = 1 AND kind = 'public' AND updated_at < ?
        `).bind(now, now - QUICK_QUEUE_SECONDS).run();
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const waiting = await db.prepare(`
            SELECT code, kind, source, status, host_player_id AS hostPlayerId, language_id AS languageId,
              player_count AS playerCount, round_number AS roundNumber, max_rounds AS maxRounds,
              drawer_player_id AS drawerPlayerId, prompt_id AS promptId, drawing_payload AS drawingPayload,
              phase_ends_at AS phaseEndsAt, version, expires_at AS expiresAt
            FROM live_rooms WHERE queue_slot = 1 AND kind = 'public' AND status = 'lobby'
              AND player_count = 1 AND updated_at >= ? AND expires_at > ?
            LIMIT 1
          `).bind(now - QUICK_QUEUE_SECONDS, now).first<Room>();
          if (waiting) {
            const joined = await addPlayer(db, waiting, name, body.locale, now);
            if (joined) return json({ session: { code: joined.code, playerId: joined.id, token: joined.token }, matchStatus: "matched" });
            continue;
          }
          const created = await createRoom(db, "public", "quick", name, body.locale, now);
          if (created) return json({ session: { code: created.code, playerId: created.id, token: created.token }, matchStatus: "queued" }, 201);
        }
        return json({ error: "Matchmaking is busy. Try once more." }, 409);
      }
      const created = await createRoom(db, "private", roomSource(body.source), name, body.locale, now);
      if (!created) throw new Error("Unable to create room");
      return json({ session: { code: created.code, playerId: created.id, token: created.token } }, 201);
    }

    const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
    if (!/^[A-Z2-9]{12}$/.test(code)) return json({ error: "Room not found." }, 404);
    let room = await readRoom(db, code);
    if (!room || room.expiresAt <= now) return json({ error: "This room expired." }, 404);

    if (action === "preview") return json({ source: room.source });

    if (action === "join") {
      const name = nickname(body.nickname);
      if (!name) return json({ error: "Use a nickname with 2–18 characters." }, 400);
      const duplicate = await db.prepare("SELECT id FROM live_players WHERE room_code = ? AND lower(nickname) = lower(?) AND left_at IS NULL LIMIT 1")
        .bind(code, name).first<{ id: string }>();
      if (duplicate) return json({ error: "That nickname is already in the room." }, 409);
      const joined = await addPlayer(db, room, name, body.locale, now);
      return joined ? json({ session: { code, playerId: joined.id, token: joined.token } }, 201) : json({ error: "The game already started or the room is full." }, 409);
    }

    const player = await authenticate(db, code, body.playerId, body.token);
    if (!player || player.leftAt) return json({ error: "Your room session is no longer active." }, 401);
    await db.prepare("UPDATE live_players SET last_seen_at = ? WHERE id = ?").bind(now, player.id).run();
    room = await migrateStaleHost(db, room, now);
    room = await advanceExpired(db, room, now);

    if (action === "pause_match") {
      if (room.kind !== "public" || room.hostPlayerId !== player.id || room.status !== "lobby") {
        return json({ error: "This match queue already moved on." }, 409);
      }
      const paused = await db.prepare(`
        UPDATE live_rooms SET queue_slot = NULL, updated_at = ?, version = version + 1
        WHERE code = ? AND kind = 'public' AND status = 'lobby' AND host_player_id = ? AND queue_slot = 1
      `).bind(now, code, player.id).run();
      if (paused.meta?.changes === 1) await trackServerEvent(db, "live_queue_timed_out", "quick", now);
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "renew_match") {
      if (room.kind !== "public" || room.hostPlayerId !== player.id || room.status !== "lobby") {
        return json({ error: "This match queue already moved on." }, 409);
      }
      const renewed = await db.prepare(`
        UPDATE OR IGNORE live_rooms SET queue_slot = 1, updated_at = ?, expires_at = ?, version = version + 1
        WHERE code = ? AND kind = 'public' AND status = 'lobby' AND host_player_id = ?
      `).bind(now, now + ROOM_SECONDS, code, player.id).run();
      if (renewed.meta?.changes !== 1) return json({ error: "Another player is waiting first. Try Quick Match again." }, 409);
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "start") {
      if (room.hostPlayerId !== player.id || room.status !== "lobby") return json({ error: "Only the host can start this lobby." }, 403);
      if (room.playerCount < 2) return json({ error: "Invite at least one more player." }, 409);
      await db.prepare(`UPDATE live_rooms SET status = 'starting', max_rounds = player_count, phase_ends_at = ?, updated_at = ?, version = version + 1 WHERE code = ? AND status = 'lobby'`)
        .bind(now + 3, now, code).run();
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "drawing") {
      if (room.status === "guessing" && room.drawerPlayerId === player.id && room.drawingPayload) {
        return json(await roomView(db, room, player, now));
      }
      const drawing = normalizeLiveDrawing(body.drawing);
      if (room.status !== "drawing" || room.drawerPlayerId !== player.id || !drawing) {
        return json({ error: "This drawing cannot be submitted now." }, 409);
      }
      await db.prepare(`UPDATE live_rooms SET drawing_payload = ?, status = 'guessing', phase_ends_at = ?, updated_at = ?, version = version + 1 WHERE code = ? AND status = 'drawing' AND round_number = ? AND drawer_player_id = ?`)
        .bind(JSON.stringify(drawing), now + GUESS_SECONDS, now, code, room.roundNumber, player.id).run();
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "skip") {
      if (room.status !== "drawing" || room.drawerPlayerId !== player.id) {
        return json({ error: "This round cannot be skipped now." }, 409);
      }
      await db.prepare(`UPDATE live_rooms SET drawing_payload = NULL, status = 'results', phase_ends_at = ?, updated_at = ?, version = version + 1 WHERE code = ? AND status = 'drawing' AND round_number = ? AND drawer_player_id = ?`)
        .bind(now + RESULTS_SECONDS, now, code, room.roundNumber, player.id).run();
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "guess") {
      const option = typeof body.optionIndex === "number" ? Math.floor(body.optionIndex) : -1;
      if (room.status !== "guessing" || room.drawerPlayerId === player.id || option < 0 || option > 3 || room.promptId === null) return json({ error: "This guess cannot be submitted now." }, 409);
      const correct = optionOrder(room.promptId, room.roundNumber)[option] === 0;
      const inserted = await db.prepare(`INSERT OR IGNORE INTO live_guesses (room_code, round_number, player_id, option_index, is_correct, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(code, room.roundNumber, player.id, option, correct ? 1 : 0, now).run();
      if (inserted.meta?.changes === 1 && correct) {
        await db.batch([
          db.prepare("UPDATE live_players SET score = score + 100 WHERE id = ?").bind(player.id),
          db.prepare("UPDATE live_players SET score = score + 50 WHERE id = ?").bind(room.drawerPlayerId),
        ]);
      }
      const count = (await db.prepare("SELECT COUNT(*) AS count FROM live_guesses WHERE room_code = ? AND round_number = ?").bind(code, room.roundNumber).first<{ count: number }>())?.count ?? 0;
      if (count >= Math.max(1, room.playerCount - 1)) {
        await db.prepare(`UPDATE live_rooms SET status = 'results', phase_ends_at = ?, updated_at = ?, version = version + 1 WHERE code = ? AND status = 'guessing' AND round_number = ?`)
          .bind(now + RESULTS_SECONDS, now, code, room.roundNumber).run();
      }
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "rematch") {
      if (room.hostPlayerId !== player.id || room.status !== "finished") {
        return json({ error: "Only the host can restart a finished room." }, 403);
      }
      const active = await remainingPlayers(db, code);
      const nextStatus = active.length >= 2 ? "starting" : "lobby";
      const restarted = await db.prepare(`
        UPDATE live_rooms SET status = ?, player_count = ?, round_number = 0, max_rounds = ?,
          drawer_player_id = NULL, prompt_id = NULL, drawing_payload = NULL, phase_ends_at = ?, queue_slot = NULL,
          updated_at = ?, expires_at = ?, version = version + 1
        WHERE code = ? AND status = 'finished' AND host_player_id = ?
      `).bind(nextStatus, active.length, active.length >= 2 ? active.length : 0,
        active.length >= 2 ? now + 3 : null, now, now + ROOM_SECONDS, code, player.id).run();
      if (restarted.meta?.changes !== 1) return json({ error: "This room already moved on." }, 409);
      await trackServerEvent(db, "live_rematch_started", room.source, now);
      await db.batch([
        db.prepare("UPDATE live_players SET score = 0 WHERE room_code = ? AND left_at IS NULL").bind(code),
        db.prepare("DELETE FROM live_guesses WHERE room_code = ?").bind(code),
        db.prepare("DELETE FROM live_reports WHERE room_code = ?").bind(code),
      ]);
      room = (await readRoom(db, code)) ?? room;
    } else if (action === "report") {
      if (room.roundNumber > 0 && room.drawingPayload) {
        await db.prepare("INSERT OR IGNORE INTO live_reports (room_code, round_number, reporter_player_id, created_at) VALUES (?, ?, ?, ?)")
          .bind(code, room.roundNumber, player.id, now).run();
      }
      await updateRoomAfterDeparture(db, room, player, now);
      return json({ ok: true });
    } else if (action === "leave") {
      await updateRoomAfterDeparture(db, room, player, now);
      return json({ ok: true });
    } else if (action !== "sync") {
      return json({ error: "Unknown action." }, 400);
    }

    return json(await roomView(db, room, player, now));
  } catch (error) {
    console.error("live room error", error);
    return json({ error: "The room hit a temporary problem. Try again." }, 500);
  }
}
