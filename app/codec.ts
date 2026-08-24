export type TracePoint = { x: number; y: number; t: number };
export type Stroke = TracePoint[];

export type Challenge = {
  promptId: number;
  languageId: number;
  durationMs: number;
  strokes: Stroke[];
};

export type EncodedChallenge = {
  payload: string;
  challenge: Challenge;
  simplified: boolean;
};

const MAGIC = 0xd7;
const VERSION = 1;
const TICK_MS = 20;
const MAX_STROKES = 24;
const DEFAULT_POINT_BUDGET = 78;

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

function crc16(bytes: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 1200) throw new Error("Invalid challenge encoding");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("Invalid challenge encoding");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function distanceToSegment(point: TracePoint, start: TracePoint, end: TracePoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

function rdp(points: Stroke, epsilon: number): Stroke {
  if (points.length <= 2) return points.slice();
  let farthestDistance = 0;
  let farthestIndex = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(points[index], points[0], points[points.length - 1]);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  if (farthestDistance <= epsilon) return [points[0], points[points.length - 1]];
  const left = rdp(points.slice(0, farthestIndex + 1), epsilon);
  const right = rdp(points.slice(farthestIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

function sampleStroke(stroke: Stroke, target: number): Stroke {
  if (target >= stroke.length) return stroke.slice();
  if (target <= 1) return [stroke[0]];
  const sampled: Stroke = [];
  for (let index = 0; index < target; index += 1) {
    sampled.push(stroke[Math.round((index * (stroke.length - 1)) / (target - 1))]);
  }
  return sampled;
}

function fitToPointBudget(strokes: Stroke[], budget: number): Stroke[] {
  const minimums = strokes.map((stroke) => (stroke.length > 1 ? 2 : 1));
  const minimumTotal = minimums.reduce((sum, value) => sum + value, 0);
  const safeBudget = Math.max(minimumTotal, budget);
  const extras = strokes.map((stroke, index) => Math.max(0, stroke.length - minimums[index]));
  const extraTotal = extras.reduce((sum, value) => sum + value, 0);
  let remaining = safeBudget - minimumTotal;
  const targets = minimums.slice();
  if (extraTotal > 0 && remaining > 0) {
    const fractions = extras.map((extra, index) => ({ index, fraction: (remaining * extra) / extraTotal }));
    for (const item of fractions) {
      const addition = Math.min(extras[item.index], Math.floor(item.fraction));
      targets[item.index] += addition;
      remaining -= addition;
    }
    fractions.sort((a, b) => (b.fraction % 1) - (a.fraction % 1));
    for (const item of fractions) {
      if (remaining <= 0) break;
      if (targets[item.index] < strokes[item.index].length) {
        targets[item.index] += 1;
        remaining -= 1;
      }
    }
  }
  return strokes.map((stroke, index) => sampleStroke(stroke, targets[index]));
}

export function simplifyStrokes(input: Stroke[], pointBudget = DEFAULT_POINT_BUDGET): Stroke[] {
  const clean = input
    .slice(0, MAX_STROKES)
    .map((stroke) => stroke
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.t))
      .map((point) => ({ x: clampByte(point.x), y: clampByte(point.y), t: Math.max(0, Math.round(point.t)) })))
    .filter((stroke) => stroke.length > 0);

  let epsilon = 1.4;
  let simplified = clean.map((stroke) => rdp(stroke, epsilon));
  while (simplified.reduce((sum, stroke) => sum + stroke.length, 0) > pointBudget && epsilon < 16) {
    epsilon *= 1.35;
    simplified = clean.map((stroke) => rdp(stroke, epsilon));
  }
  if (simplified.reduce((sum, stroke) => sum + stroke.length, 0) > pointBudget) {
    simplified = fitToPointBudget(simplified, pointBudget);
  }
  return simplified;
}

function encodeBytes(challenge: Challenge): Uint8Array {
  const strokes = challenge.strokes.filter((stroke) => stroke.length > 0).slice(0, MAX_STROKES);
  const bytes: number[] = [
    MAGIC,
    VERSION,
    clampByte(challenge.promptId),
    clampByte(challenge.languageId),
  ];
  const durationTicks = Math.max(0, Math.min(500, Math.round(challenge.durationMs / TICK_MS)));
  bytes.push(durationTicks & 0xff, (durationTicks >>> 8) & 0xff, strokes.length);

  for (const stroke of strokes) {
    const points = stroke.slice(0, 255);
    bytes.push(points.length);
    const first = points[0];
    const firstTick = Math.max(0, Math.min(500, Math.round(first.t / TICK_MS)));
    bytes.push(clampByte(first.x), clampByte(first.y), firstTick & 0xff, (firstTick >>> 8) & 0xff);
    let previousTick = firstTick;
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      const tick = Math.max(previousTick + 1, Math.min(500, Math.round(point.t / TICK_MS)));
      bytes.push(clampByte(point.x), clampByte(point.y), Math.max(1, Math.min(255, tick - previousTick)));
      previousTick = tick;
    }
  }

  const body = Uint8Array.from(bytes);
  const checksum = crc16(body);
  return Uint8Array.from([...body, checksum & 0xff, (checksum >>> 8) & 0xff]);
}

export function encodeChallenge(input: Challenge, maxPayloadCharacters = 360): EncodedChallenge {
  const originalPointCount = input.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
  let budget = DEFAULT_POINT_BUDGET;
  while (budget >= 18) {
    const strokes = simplifyStrokes(input.strokes, budget);
    const challenge = { ...input, strokes };
    const payload = toBase64Url(encodeBytes(challenge));
    if (payload.length <= maxPayloadCharacters) {
      return {
        payload,
        challenge,
        simplified: strokes.reduce((sum, stroke) => sum + stroke.length, 0) < originalPointCount,
      };
    }
    budget -= 6;
  }
  throw new Error("Drawing is too complex to fit in a shareable link");
}

export function decodeChallenge(payload: string): Challenge {
  const bytes = fromBase64Url(payload);
  if (bytes.length < 9) throw new Error("Challenge is too short");
  const body = bytes.slice(0, -2);
  const expectedChecksum = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
  if (crc16(body) !== expectedChecksum) throw new Error("Challenge checksum failed");
  if (body[0] !== MAGIC || body[1] !== VERSION) throw new Error("Unsupported challenge version");

  const promptId = body[2];
  const languageId = body[3];
  const durationMs = (body[4] | (body[5] << 8)) * TICK_MS;
  const strokeCount = body[6];
  if (durationMs > 10000 || strokeCount > MAX_STROKES) throw new Error("Challenge limits exceeded");

  let offset = 7;
  let totalPoints = 0;
  const strokes: Stroke[] = [];
  const take = () => {
    if (offset >= body.length) throw new Error("Truncated challenge");
    return body[offset++];
  };

  for (let strokeIndex = 0; strokeIndex < strokeCount; strokeIndex += 1) {
    const pointCount = take();
    if (pointCount < 1 || pointCount > 96) throw new Error("Invalid point count");
    totalPoints += pointCount;
    if (totalPoints > 120) throw new Error("Challenge is too large");
    const firstX = take();
    const firstY = take();
    let tick = take() | (take() << 8);
    if (tick > 500) throw new Error("Invalid challenge timing");
    const stroke: Stroke = [{ x: firstX, y: firstY, t: tick * TICK_MS }];
    for (let pointIndex = 1; pointIndex < pointCount; pointIndex += 1) {
      const x = take();
      const y = take();
      const delta = take();
      if (delta < 1) throw new Error("Invalid point timing");
      tick += delta;
      if (tick > 500) throw new Error("Invalid challenge timing");
      stroke.push({ x, y, t: tick * TICK_MS });
    }
    strokes.push(stroke);
  }
  if (offset !== body.length || strokes.length === 0) throw new Error("Invalid challenge structure");
  return { promptId, languageId, durationMs, strokes };
}

export function challengeSeed(challenge: Challenge): number {
  let hash = 2166136261;
  hash ^= challenge.promptId;
  hash = Math.imul(hash, 16777619);
  for (const stroke of challenge.strokes) {
    for (const point of stroke) {
      hash ^= point.x;
      hash = Math.imul(hash, 16777619);
      hash ^= point.y;
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}
