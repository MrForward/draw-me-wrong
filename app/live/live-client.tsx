"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trackAnalytics } from "../analytics-client";
import { simplifyStrokes, type Stroke, type TracePoint } from "../codec";
import { LANGUAGE_NAMES, LOCALES, UI, type Locale, detectLocale } from "../game-data";
import { normalizeUseCase, type UseCaseId } from "../play/use-case-preset";
import { fillLive, LIVE_COPY, LIVE_GROWTH_COPY, SAFE_NAMES } from "./live-copy";
import { liveInvitePath, type LiveRoomSource } from "./live-links";

type Session = { code: string; playerId: string; token: string };
type LiveState = {
  room: {
    code: string; kind: "private" | "public"; source: LiveRoomSource; status: "lobby" | "starting" | "drawing" | "guessing" | "results" | "finished";
    roundNumber: number; maxRounds: number; playerCount: number; phaseEndsAt: number | null; version: number;
    hostPlayerId: string; drawerPlayerId: string | null; drawing: LiveDrawing | null; promptId: number | null; prompt: string | null;
    options: string[]; correctIndex: number | null; guessCount: number; eligibleGuesses: number;
  };
  you: { id: string; nickname: string; isHost: boolean; isDrawer: boolean; guess: { optionIndex: number; isCorrect: number } | null };
  players: Array<{ id: string; nickname: string; score: number; online: boolean; left: boolean }>;
  serverNow: number;
};
type LiveDrawing = { durationMs: number; strokes: Stroke[] };

const LOGICAL_SIZE = 256;

function setupCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(width / LOGICAL_SIZE, 0, 0, height / LOGICAL_SIZE, 0, 0);
  context.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
  context.lineCap = "round"; context.lineJoin = "round"; context.lineWidth = 5.4; context.strokeStyle = "#171714"; context.fillStyle = "#171714";
  return context;
}

function drawStrokes(canvas: HTMLCanvasElement | null, strokes: Stroke[], until = Infinity) {
  if (!canvas) return;
  const context = setupCanvas(canvas);
  if (!context) return;
  for (const stroke of strokes) {
    if (!stroke[0] || stroke[0].t > until) continue;
    context.beginPath(); context.moveTo(stroke[0].x, stroke[0].y);
    let count = 1;
    for (let i = 1; i < stroke.length && stroke[i].t <= until; i += 1) { context.lineTo(stroke[i].x, stroke[i].y); count += 1; }
    if (count === 1) { context.arc(stroke[0].x, stroke[0].y, 2.7, 0, Math.PI * 2); context.fill(); } else context.stroke();
  }
}

function randomName() { return SAFE_NAMES[Math.floor(Math.random() * SAFE_NAMES.length)]; }
function storageKey(code: string) { return `dmw-live-${code}`; }
function presetStorageKey(code: string) { return `dmw-live-preset-v1-${code}`; }

export default function LiveClient() {
  const [locale, setLocale] = useState<Locale>("en");
  const [preset, setPreset] = useState<UseCaseId | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<LiveState | null>(null);
  const [name, setName] = useState("Dizzy Panda");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(() => Date.now() / 1000);
  const [clockOffset, setClockOffset] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [quickWaitExpired, setQuickWaitExpired] = useState(false);
  const [quickWaitEpoch, setQuickWaitEpoch] = useState(0);
  const strokesRef = useRef<Stroke[]>([]);
  const activeRef = useRef<Stroke | null>(null);
  const drawStartRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRoundRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const quickWaitStartedRef = useRef<number | null>(null);
  const useCaseEntryTrackedRef = useRef(false);
  const copy = LIVE_COPY[locale];
  const growth = LIVE_GROWTH_COPY[locale];

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(response.status === 404 ? copy.expired : copy.error);
    return data;
  }, [copy.error, copy.expired]);

  const sync = useCallback(async (active = session) => {
    if (!active) return;
    try {
      const data = await post({ action: "sync", code: active.code, playerId: active.playerId, token: active.token }) as unknown as LiveState;
      setState(data); setClockOffset(data.serverNow - Date.now() / 1000); setNotice("");
      const nextPreset = data.room.source === "team" ? "team" : null;
      setPreset(nextPreset);
      try {
        if (nextPreset) sessionStorage.setItem(presetStorageKey(active.code), nextPreset);
        else sessionStorage.removeItem(presetStorageKey(active.code));
      } catch { /* optional */ }
    } catch (error) { setNotice(error instanceof Error ? error.message : copy.error); }
  }, [copy.error, post, session]);

  useEffect(() => {
    let chosen = detectLocale(navigator.language);
    try { const saved = localStorage.getItem("dmw-language") as Locale | null; if (saved && LOCALES.includes(saved)) chosen = saved; } catch { /* optional */ }
    const match = window.location.pathname.match(/^\/live\/([A-Z2-9]{12})\/?$/i);
    let nextPreset = normalizeUseCase(new URLSearchParams(window.location.search).get("p"));
    if (match && !nextPreset) {
      try { nextPreset = normalizeUseCase(sessionStorage.getItem(presetStorageKey(match[1].toUpperCase()))); } catch { /* optional */ }
    }
    const frame = window.requestAnimationFrame(() => {
      setLocale(chosen); setName(randomName()); setPreset(nextPreset);
      if (nextPreset === "team" && !useCaseEntryTrackedRef.current) {
        useCaseEntryTrackedRef.current = true;
        trackAnalytics("use_case_live_entry", "team");
      }
      if (!match) return;
      const code = match[1].toUpperCase(); setRoomCode(code); trackAnalytics("live_entry", "invite");
      try { const saved = localStorage.getItem(storageKey(code)); if (saved) setSession(JSON.parse(saved) as Session); } catch { /* expired local session */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem("dmw-language", locale); } catch { /* optional */ }
  }, [locale]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => void sync(session), 0);
    return () => window.clearTimeout(timer);
  }, [session, sync]);
  useEffect(() => {
    if (!roomCode || session) return;
    let cancelled = false;
    void post({ action: "preview", code: roomCode }).then((data) => {
      if (cancelled) return;
      const nextPreset = data.source === "team" ? "team" : null;
      setPreset(nextPreset);
      try {
        if (nextPreset) sessionStorage.setItem(presetStorageKey(roomCode), nextPreset);
        else sessionStorage.removeItem(presetStorageKey(roomCode));
      } catch { /* optional */ }
    }).catch(() => { /* join will show the localized room error */ });
    return () => { cancelled = true; };
  }, [post, roomCode, session]);
  useEffect(() => {
    if (!session) return;
    const delay = 1800;
    const timer = window.setInterval(() => { if (!document.hidden) void sync(); }, delay);
    const visible = () => { if (!document.hidden) void sync(); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [session, sync]);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now() / 1000), 250); return () => window.clearInterval(timer); }, []);

  useEffect(() => {
    if (!state || state.room.roundNumber === lastRoundRef.current) return;
    lastRoundRef.current = state.room.roundNumber; autoSubmittedRef.current = false; strokesRef.current = []; activeRef.current = null; drawStartRef.current = null; setStrokes([]);
    drawStrokes(canvasRef.current, []);
  }, [state]);

  useEffect(() => {
    const drawing = state?.room.drawing;
    if (!drawing || (state?.room.status !== "guessing" && state?.room.status !== "results" && state?.room.status !== "finished")) return;
    let frame = 0; const begun = performance.now(); const duration = Math.min(4200, Math.max(900, drawing.durationMs));
    const animate = (now: number) => {
      const elapsed = Math.min(drawing.durationMs, ((now - begun) / duration) * drawing.durationMs);
      drawStrokes(canvasRef.current, drawing.strokes, elapsed);
      if (elapsed < drawing.durationMs) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [state?.room.drawing, state?.room.status, state?.room.roundNumber]);

  const changeLocale = (next: Locale) => { setLocale(next); try { localStorage.setItem("dmw-language", next); } catch { /* optional */ } };
  const adoptSession = (next: Session, nextPreset = preset) => {
    setSession(next); setRoomCode(next.code); setState(null); window.history.replaceState(null, "", `/live/${next.code}`);
    try {
      localStorage.setItem(storageKey(next.code), JSON.stringify(next));
      if (nextPreset) sessionStorage.setItem(presetStorageKey(next.code), nextPreset);
      else sessionStorage.removeItem(presetStorageKey(next.code));
    } catch { /* reconnect is optional */ }
  };
  const enter = async (action: "create" | "match" | "join") => {
    setBusy(true); setNotice("");
    try {
      const result = await post({ action, code: roomCode, nickname: name, locale, source: preset === "team" ? "team" : "home" });
      const next = result.session as Session; adoptSession(next);
      if (action === "match" && result.matchStatus === "queued") { quickWaitStartedRef.current = Date.now(); setQuickWaitExpired(false); }
      if (action === "create") trackAnalytics("live_room_created", "private");
      if (action === "create" && preset === "team") trackAnalytics("use_case_room_created", "team");
    } catch (error) { setNotice(error instanceof Error ? error.message : copy.error); } finally { setBusy(false); }
  };
  const roomAction = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!session) return;
    setBusy(true);
    try {
      const data = await post({ action, code: session.code, playerId: session.playerId, token: session.token, ...extra });
      if (action === "leave" || action === "report") {
        try { localStorage.removeItem(storageKey(session.code)); sessionStorage.removeItem(presetStorageKey(session.code)); } catch { /* optional */ }
        setSession(null); setState(null); setRoomCode(null); setPreset(null); window.history.replaceState(null, "", "/live");
        if (action === "report") setNotice(copy.reported);
      } else {
        setState(data as unknown as LiveState);
      }
      return data;
    } catch (error) { setNotice(error instanceof Error ? error.message : copy.error); } finally { setBusy(false); }
  }, [copy.error, copy.reported, post, session]);

  const shareInvite = async () => {
    if (!roomCode) return;
    const source = state?.room.source ?? (preset === "team" ? "team" : "home");
    const url = `${window.location.origin}${liveInvitePath(roomCode, source)}`; const text = source === "team" ? growth.teamShareText : copy.shareText;
    if (navigator.share) {
      try { await navigator.share({ title: "Draw Me Wrong", text, url }); trackAnalytics("live_invite_shared", `${source}_native`); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    await navigator.clipboard.writeText(url); setNotice(copy.copied); trackAnalytics("live_invite_shared", `${source}_copy`);
  };

  const point = (event: React.PointerEvent<HTMLCanvasElement>): TracePoint => {
    const rect = event.currentTarget.getBoundingClientRect(); const start = drawStartRef.current ?? performance.now();
    return { x: Math.max(0, Math.min(255, Math.round(((event.clientX - rect.left) / rect.width) * 255))), y: Math.max(0, Math.min(255, Math.round(((event.clientY - rect.top) / rect.height) * 255))), t: Math.max(0, Math.min(10_000, Math.round(performance.now() - start))) };
  };
  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!state?.you.isDrawer || state.room.status !== "drawing") return;
    if (!drawStartRef.current) drawStartRef.current = performance.now(); event.currentTarget.setPointerCapture(event.pointerId);
    const stroke = [point(event)]; activeRef.current = stroke; strokesRef.current = [...strokesRef.current, stroke]; setStrokes([...strokesRef.current]); drawStrokes(canvasRef.current, strokesRef.current);
  };
  const moveStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    activeRef.current.push(point(event)); setStrokes([...strokesRef.current]); drawStrokes(canvasRef.current, strokesRef.current);
  };
  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); activeRef.current = null; };
  const submitDrawing = useCallback(async () => {
    if (!strokesRef.current.length) return false;
    const durationMs = Math.max(100, Math.min(10_000, Math.round(performance.now() - (drawStartRef.current ?? performance.now()))));
    const drawing: LiveDrawing = { durationMs, strokes: simplifyStrokes(strokesRef.current, 96) };
    return Boolean(await roomAction("drawing", { drawing }));
  }, [roomAction]);

  const rawSecondsLeft = (state?.room.phaseEndsAt ?? 0) - (clock + clockOffset);
  const secondsLeft = state?.room.status === "drawing"
    ? Math.min(10, Math.max(0, Math.ceil(rawSecondsLeft - 2)))
    : Math.max(0, Math.ceil(rawSecondsLeft));
  const drawer = state?.players.find((player) => player.id === state.room.drawerPlayerId);
  const activePlayers = useMemo(() => state?.players.filter((player) => !player.left) ?? [], [state]);
  const isTeamContext = state ? state.room.source === "team" : preset === "team";
  const winner = useMemo(() => activePlayers.slice().sort((a, b) => b.score - a.score)[0], [activePlayers]);

  useEffect(() => {
    if (state?.room.status !== "drawing" || !state.you.isDrawer || secondsLeft > 0 || busy || !strokesRef.current.length || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void submitDrawing().then((submitted) => {
      if (!submitted) autoSubmittedRef.current = false;
    });
  }, [busy, secondsLeft, state?.room.status, state?.you.isDrawer, submitDrawing]);

  useEffect(() => {
    const waiting = state?.room.kind === "public" && state.room.status === "lobby" && activePlayers.length === 1;
    if (!waiting) {
      quickWaitStartedRef.current = null;
      return;
    }
    if (!quickWaitStartedRef.current) quickWaitStartedRef.current = Date.now();
    const remaining = Math.max(0, 15_000 - (Date.now() - quickWaitStartedRef.current));
    const timer = window.setTimeout(() => {
      setQuickWaitExpired(true);
      void roomAction("pause_match");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [activePlayers.length, quickWaitEpoch, roomAction, state?.room.kind, state?.room.status]);

  const keepWaiting = async () => {
    const result = await roomAction("renew_match");
    if (!result) return;
    quickWaitStartedRef.current = Date.now();
    setQuickWaitExpired(false);
    setQuickWaitEpoch((value) => value + 1);
  };

  const restartGroup = async () => {
    const result = await roomAction("rematch");
    if (result) {
      setQuickWaitExpired(false);
    }
  };

  const leaveForSolo = async () => {
    await roomAction("leave");
    window.location.assign("/");
  };

  const shareResult = async () => {
    if (!state || !winner) return;
    const url = `${window.location.origin}${state.room.source === "team" ? "/play/team-icebreaker" : "/"}`;
    const text = fillLive(growth.resultShareText, { name: winner.nickname });
    if (navigator.share) {
      try {
        await navigator.share({ title: "Draw Me Wrong", text, url });
        trackAnalytics("live_result_shared", `${state.room.source}_native`);
        return;
      } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setNotice(`✓ ${growth.shareResult}`);
    trackAnalytics("live_result_shared", `${state.room.source}_copy`);
  };

  return (
    <main className="live-shell">
      <nav className="topbar live-topbar"><Link className="wordmark" href="/"><span>DRAW ME</span> WRONG</Link><label className="language-picker"><span className="sr-only">{UI[locale].language}</span><select aria-label={UI[locale].language} value={locale} onChange={(e) => changeLocale(e.target.value as Locale)}>{LOCALES.map((item) => <option key={item} value={item}>{LANGUAGE_NAMES[item]}</option>)}</select></label></nav>

      {!session && (
        <section className="live-entry">
          <div className="live-intro"><p className="eyebrow">{isTeamContext ? growth.teamBadge : copy.liveBadge}</p><h1>{roomCode && isTeamContext ? growth.teamJoinTitle : isTeamContext ? growth.teamTitle : roomCode ? copy.lobby : copy.title}</h1><p className="dek">{roomCode && isTeamContext ? `${growth.teamJoinSubtitle} ${fillLive(copy.roomCode, { code: roomCode })}` : roomCode ? fillLive(copy.roomCode, { code: roomCode }) : isTeamContext ? growth.teamSubtitle : copy.subtitle}</p></div>
          <div className="live-entry-card">
            <span className="live-label">{copy.yourName}</span><div className="alias-row"><strong>{name}</strong><button onClick={() => setName(randomName())}>{copy.reroll}</button></div>
            {roomCode ? <button className="primary-cta wide-button" disabled={busy} onClick={() => void enter("join")}>{busy ? copy.joining : isTeamContext ? growth.teamJoinCta : copy.joinRoom}<span>→</span></button> : <><button className="primary-cta wide-button" disabled={busy} onClick={() => void enter("create")}>{preset === "team" ? growth.teamRoom : copy.privateRoom}<span>→</span></button>{preset !== "team" && <><button className="secondary-button wide-button" disabled={busy} onClick={() => void enter("match")}>{copy.quickMatch}</button><small>{copy.quickNote}</small></>}</>}
            <p className="live-privacy">{copy.privacy}</p>
          </div>
        </section>
      )}

      {session && !state && <section className="live-center"><span className="loader-scribble">〰〰〰</span><h2>{copy.loading}</h2><p className="notice">{notice}</p></section>}

      {state && (
        <section className="live-game">
          <header className="live-room-head"><div><p className="tiny-rule">{fillLive(copy.roomCode, { code: state.room.code })}</p><h2>{state.room.status === "lobby" ? isTeamContext ? growth.teamTitle : copy.lobby : state.room.status === "finished" ? copy.gameOver : fillLive(copy.round, { n: state.room.roundNumber, total: state.room.maxRounds })}</h2></div><div className="live-head-actions">{state.room.status !== "finished" && <button className="text-button" onClick={() => void shareInvite()}>{copy.invite} ↗</button>}<button className="text-button" onClick={() => void roomAction("leave")}>{copy.leave}</button></div></header>
          <div className="live-layout">
            <div className="live-main-card">
              {state.room.status === "lobby" && <div className="live-message"><span className="live-mark">↗</span><h3>{quickWaitExpired ? copy.quickMatch : isTeamContext ? state.you.isHost ? growth.teamHostLobbyTitle : growth.teamGuestLobbyTitle : copy.invite}</h3><p>{quickWaitExpired ? growth.matchTimeout : isTeamContext ? state.you.isHost ? growth.teamHostLobbyBody : growth.teamGuestLobbyBody : activePlayers.length < 2 ? copy.waitingPlayers : copy.privacy}</p><button className="primary-cta" onClick={() => void shareInvite()}>{copy.copyLink}<span>↗</span></button>{quickWaitExpired && <><button className="secondary-button" onClick={() => void keepWaiting()}>{growth.keepWaiting}</button><button className="text-button" onClick={() => void leaveForSolo()}>{growth.playSolo}</button></>}{state.you.isHost && state.room.kind === "private" && <button className="secondary-button" disabled={activePlayers.length < 2 || busy} onClick={() => void roomAction("start")}>{copy.startGame}</button>}</div>}
              {state.room.status === "starting" && <div className="live-message"><span className="countdown">{secondsLeft}</span><h3>{fillLive(copy.starting, { n: secondsLeft })}</h3></div>}
              {state.room.status === "drawing" && state.you.isDrawer && <><div className="live-round-title"><p>{copy.yourTurn}</p><h3>{fillLive(copy.drawPrompt, { prompt: state.room.prompt ?? "" })}</h3><span className="live-timer">{secondsLeft}s</span><small>{copy.drawNow}</small></div><div className="canvas-wrap live-canvas"><canvas ref={canvasRef} onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={endStroke} onPointerCancel={endStroke} />{!strokes.length && <span className="canvas-hint">{UI[locale].drawAnywhere}</span>}</div><button className="primary-cta wide-button" disabled={!strokes.length || busy} onClick={() => void submitDrawing()}>{copy.submitDrawing}<span>→</span></button><button className="text-button live-skip" disabled={busy} onClick={() => void roomAction("skip")}>{growth.skipRound}</button></>}
              {state.room.status === "drawing" && !state.you.isDrawer && <div className="live-message"><span className="live-mark">〰</span><h3>{fillLive(copy.waitingDrawer, { name: drawer?.nickname ?? "…" })}</h3><span className="live-timer inline-timer">{secondsLeft}s</span></div>}
              {state.room.status === "guessing" && <><div className="live-round-title"><p>{state.you.isDrawer ? fillLive(copy.waitingGuesses, { n: state.room.guessCount, total: state.room.eligibleGuesses }) : copy.pickOne}</p><h3>{state.you.isDrawer ? copy.yourTurn : fillLive(copy.guessIt, { name: drawer?.nickname ?? "…" })}</h3><span className="live-timer">{secondsLeft}s</span></div><div className="canvas-wrap live-canvas"><canvas ref={canvasRef} /></div>{!state.you.isDrawer && <div className="live-options">{state.room.options.map((option, index) => <button key={option} disabled={Boolean(state.you.guess) || busy} className={state.you.guess?.optionIndex === index ? "selected" : ""} onClick={() => void roomAction("guess", { optionIndex: index })}><span>{index + 1}</span>{option}</button>)}</div>}</>}
              {state.room.status === "results" && <><div className="live-round-title result"><p>{!state.room.drawing ? growth.skippedRound : state.you.isDrawer ? fillLive(copy.waitingGuesses, { n: state.room.guessCount, total: state.room.eligibleGuesses }) : state.you.guess?.isCorrect ? copy.correct : copy.missed}</p><h3>{fillLive(copy.result, { prompt: state.room.prompt ?? "" })}</h3><span className="live-timer">{secondsLeft}s</span></div>{state.room.drawing && <div className="canvas-wrap live-canvas"><canvas ref={canvasRef} /></div>}</>}
              {state.room.status === "finished" && <div className="live-final-result"><div className="live-final-copy"><span className="live-mark">★</span><p className="tiny-rule">{growth.finalStamp}</p><h3>{copy.gameOver}</h3>{winner && <p className="live-winner">{fillLive(copy.winner, { name: winner.nickname })}</p>}</div>{state.room.drawing && <div className="canvas-wrap live-canvas live-final-canvas"><canvas ref={canvasRef} /></div>}<div className="live-final-actions"><button className="secondary-button" onClick={() => void shareResult()}>{growth.shareResult}</button>{state.you.isHost ? <><button className="primary-cta" disabled={busy} onClick={() => void restartGroup()}>{growth.playAgain}<span>→</span></button>{isTeamContext && <p>{growth.rematchNote}</p>}</> : <p>{growth.hostRestart}</p>}<button className="text-button" disabled={busy} onClick={() => void enter("create")}>{growth.newRoom} ↗</button></div></div>}
            </div>
            <aside className="live-scoreboard"><p className="tiny-rule">{copy.players}</p><ol>{activePlayers.slice().sort((a,b) => b.score-a.score).map((player) => <li key={player.id}><span className={`presence ${player.online ? "on" : ""}`} /><strong>{player.nickname}</strong><em>{player.id === state.you.id ? copy.you : player.id === state.room.hostPlayerId ? copy.host : player.online ? copy.online : copy.offline}</em><b>{player.score}</b></li>)}</ol>{state.room.kind === "public" && state.room.status !== "lobby" && <button className="report-link" onClick={() => void roomAction("report")}>{copy.reportLeave}</button>}<p className="live-privacy">{copy.privacy}</p></aside>
          </div>
          <p className="notice" role="status">{notice}</p>
        </section>
      )}
      {!session && <Link className="live-home-link" href="/">← {copy.home}</Link>}
    </main>
  );
}
