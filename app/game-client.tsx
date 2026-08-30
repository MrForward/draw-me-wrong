"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackAnalytics, trackDiscoverySource, trackPresence } from "./analytics-client";
import { isShortChallengeCode } from "./challenge-links";
import { Challenge, Stroke, TracePoint, challengeSeed, decodeChallenge, encodeChallenge } from "./codec";
import {
  DailyProgress,
  LANGUAGE_NAMES,
  LOCALES,
  Locale,
  PROMPTS,
  UI,
  advanceDailyProgress,
  dailyPromptId,
  detectLocale,
  fill,
  isDayKey,
  promptById,
  shuffledOptions,
  utcDayKey,
} from "./game-data";
import { HOME_POSITIONING } from "./home-positioning";

type Screen = "home" | "draw" | "share" | "guess" | "result" | "invalid";
type DrawMode = "random" | "daily" | "reply";
type LinkStatus = "idle" | "creating" | "ready" | "fallback";

const LOGICAL_SIZE = 256;
const DRAWING_SECONDS = 10;
const DAILY_STORAGE_KEY = "dmw-daily-v1";

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(width / LOGICAL_SIZE, 0, 0, height / LOGICAL_SIZE, 0, 0);
  context.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 5.4;
  context.strokeStyle = "#171714";
  context.fillStyle = "#171714";
  return context;
}

function drawTrace(canvas: HTMLCanvasElement | null, strokes: Stroke[], until = Number.POSITIVE_INFINITY) {
  if (!canvas) return;
  const context = setupCanvas(canvas);
  if (!context) return;

  for (const stroke of strokes) {
    if (stroke.length === 0 || stroke[0].t > until) continue;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    let visiblePoints = 1;

    for (let index = 1; index < stroke.length; index += 1) {
      const previous = stroke[index - 1];
      const point = stroke[index];
      if (point.t <= until) {
        context.lineTo(point.x, point.y);
        visiblePoints += 1;
        continue;
      }
      if (previous.t < until && point.t > previous.t) {
        const progress = Math.max(0, Math.min(1, (until - previous.t) / (point.t - previous.t)));
        context.lineTo(previous.x + (point.x - previous.x) * progress, previous.y + (point.y - previous.y) * progress);
        visiblePoints += 1;
      }
      break;
    }

    if (visiblePoints === 1) {
      context.arc(stroke[0].x, stroke[0].y, 2.7, 0, Math.PI * 2);
      context.fill();
    } else {
      context.stroke();
    }
  }
}

function pointerPoint(event: React.PointerEvent<HTMLCanvasElement>, startedAt: number): TracePoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(255, Math.round(((event.clientX - rect.left) / rect.width) * 255))),
    y: Math.max(0, Math.min(255, Math.round(((event.clientY - rect.top) / rect.height) * 255))),
    t: Math.max(0, Math.min(10000, Math.round(performance.now() - startedAt))),
  };
}

function randomPrompt(exclude?: number): number {
  if (PROMPTS.length <= 1) return PROMPTS[0].id;
  let next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)].id;
  while (next === exclude) next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)].id;
  return next;
}

function parseDailyProgress(value: string | null): DailyProgress | null {
  if (!value || value.length > 160) return null;
  try {
    const parsed = JSON.parse(value) as Partial<DailyProgress>;
    if (
      typeof parsed.lastCompletedDay !== "string" ||
      !isDayKey(parsed.lastCompletedDay) ||
      !Number.isInteger(parsed.streak) ||
      !Number.isInteger(parsed.bestStreak) ||
      (parsed.streak ?? 0) < 1 ||
      (parsed.bestStreak ?? 0) < 1
    ) return null;
    return parsed as DailyProgress;
  } catch {
    return null;
  }
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
}

async function createShortChallengeLink(payload: string, day: string | null): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, day }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Short link request failed");
    const result = await response.json() as { path?: unknown };
    if (typeof result.path !== "string") throw new Error("Short link response was invalid");
    const match = result.path.match(/^\/c\/([A-Za-z0-9_-]+)$/);
    if (!match || !isShortChallengeCode(match[1])) throw new Error("Short link response was invalid");
    return `${window.location.origin}${result.path}`;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function GameClient() {
  const [screen, setScreen] = useState<Screen>("home");
  const [locale, setLocale] = useState<Locale>("en");
  const [promptId, setPromptId] = useState(PROMPTS[0].id);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawingStarted, setDrawingStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DRAWING_SECONDS);
  const [notice, setNotice] = useState("");
  const [challengeLink, setChallengeLink] = useState("");
  const [challengeLinkStatus, setChallengeLinkStatus] = useState<LinkStatus>("idle");
  const [createdChallenge, setCreatedChallenge] = useState<Challenge | null>(null);
  const [receivedChallenge, setReceivedChallenge] = useState<Challenge | null>(null);
  const [receivedShareLink, setReceivedShareLink] = useState("");
  const [receivedLinkStatus, setReceivedLinkStatus] = useState<LinkStatus>("idle");
  const [replyMode, setReplyMode] = useState(false);
  const [dailyKey, setDailyKey] = useState<string | null>(null);
  const [receivedDailyKey, setReceivedDailyKey] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [wasSimplified, setWasSimplified] = useState(false);
  const [guessStarted, setGuessStarted] = useState(false);
  const [replayDone, setReplayDone] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [recognitionMs, setRecognitionMs] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawStartRef = useRef<number | null>(null);
  const guessStartRef = useRef<number | null>(null);
  const guessAnsweredRef = useRef(false);
  const replayFrameRef = useRef<number | null>(null);
  const replayUntilRef = useRef(0);
  const presenceTrackedRef = useRef(false);
  const homeViewTrackedRef = useRef(false);
  const openedChallengeRef = useRef("");
  const linkRequestVersionRef = useRef(0);

  const copy = UI[locale];
  const homePositioning = HOME_POSITIONING[locale];
  const prompt = promptById(promptId) || PROMPTS[0];
  const createdPrompt = createdChallenge ? promptById(createdChallenge.promptId) ?? null : null;
  const receivedPrompt = receivedChallenge ? promptById(receivedChallenge.promptId) ?? null : null;

  const optionOrder = useMemo(() => {
    if (!receivedChallenge) return [0, 1, 2, 3];
    return shuffledOptions(receivedChallenge.promptId, challengeSeed(receivedChallenge));
  }, [receivedChallenge]);

  const resetDrawing = useCallback(() => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    drawStartRef.current = null;
    setStrokes([]);
    setDrawingStarted(false);
    setTimeLeft(DRAWING_SECONDS);
    setNotice("");
  }, []);

  const removeChallengeHash = useCallback(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", "/");
  }, []);

  const beginDraw = useCallback((mode: DrawMode = "random", exclude?: number, forcedPromptId?: number, forcedDay?: string) => {
    removeChallengeHash();
    resetDrawing();
    const nextDay = mode === "daily" ? (forcedDay && isDayKey(forcedDay) ? forcedDay : utcDayKey()) : null;
    const nextPrompt = mode === "daily" && nextDay ? (forcedPromptId ?? dailyPromptId(nextDay)) : randomPrompt(exclude);
    setPromptId(promptById(nextPrompt)?.id ?? PROMPTS[0].id);
    setReplyMode(mode === "reply");
    setDailyKey(nextDay);
    setCreatedChallenge(null);
    setChallengeLink("");
    setChallengeLinkStatus("idle");
    linkRequestVersionRef.current += 1;
    setWasSimplified(false);
    setScreen("draw");
    trackAnalytics("challenge_started", mode);
  }, [removeChallengeHash, resetDrawing]);

  const beginFromHero = useCallback((mode: "random" | "daily") => {
    trackAnalytics("hero_cta", mode);
    beginDraw(mode);
  }, [beginDraw]);

  const finalizeDrawing = useCallback(() => {
    const available = strokesRef.current.filter((stroke) => stroke.length > 0);
    if (available.length === 0) {
      setNotice(UI[locale].noDrawing);
      return;
    }

    const now = performance.now();
    const startedAt = drawStartRef.current ?? now;
    const durationMs = Math.max(300, Math.min(10000, Math.round(now - startedAt)));
    const base = `${window.location.origin}/`;
    const dailySuffix = dailyKey ? `&day=${dailyKey}` : "";
    const maxPayloadCharacters = Math.max(160, 450 - base.length - 3 - dailySuffix.length);

    try {
      const encoded = encodeChallenge({
        promptId,
        languageId: LOCALES.indexOf(locale),
        durationMs,
        strokes: available,
      }, maxPayloadCharacters);
      activeStrokeRef.current = null;
      setDrawingStarted(false);
      setStrokes(encoded.challenge.strokes);
      strokesRef.current = encoded.challenge.strokes;
      setCreatedChallenge(encoded.challenge);
      const fallbackLink = `${base}#d=${encoded.payload}${dailySuffix}`;
      const requestVersion = linkRequestVersionRef.current + 1;
      linkRequestVersionRef.current = requestVersion;
      setChallengeLink(fallbackLink);
      setChallengeLinkStatus("creating");
      void createShortChallengeLink(encoded.payload, dailyKey)
        .then((shortLink) => {
          if (linkRequestVersionRef.current !== requestVersion) return;
          setChallengeLink(shortLink);
          setChallengeLinkStatus("ready");
        })
        .catch(() => {
          if (linkRequestVersionRef.current !== requestVersion) return;
          setChallengeLinkStatus("fallback");
        });
      setWasSimplified(encoded.simplified);
      setNotice(dailyKey ? UI[locale].dailyComplete : "");
      const mode: DrawMode = dailyKey ? "daily" : replyMode ? "reply" : "random";
      trackAnalytics("challenge_created", mode);
      if (dailyKey) {
        trackAnalytics("daily_completed");
        setDailyProgress((previous) => {
          const next = advanceDailyProgress(previous, dailyKey);
          try {
            window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Daily continuity is optional device-local state.
          }
          return next;
        });
      }
      setScreen("share");
      navigator.vibrate?.(35);
    } catch {
      setNotice(UI[locale].drawingLimit);
    }
  }, [dailyKey, locale, promptId, replyMode]);

  useEffect(() => {
    let chosenLocale = detectLocale(navigator.language);
    let savedProgress: DailyProgress | null = null;
    try {
      const saved = window.localStorage.getItem("dmw-language") as Locale | null;
      if (saved && LOCALES.includes(saved)) chosenLocale = saved;
      savedProgress = parseDailyProgress(window.localStorage.getItem(DAILY_STORAGE_KEY));
    } catch {
      // Device storage is optional.
    }
    const localeFrame = window.requestAnimationFrame(() => {
      setLocale(chosenLocale);
      setDailyProgress(savedProgress);
    });

    const finishRouteLoading = () => {
      window.requestAnimationFrame(() => document.documentElement.removeAttribute("data-dmw-challenge"));
    };

    const applyReceivedChallenge = (
      payload: string,
      linkedDay: string | null,
      trackingKey: string,
      shareLink: string,
      linkStatus: LinkStatus,
    ) => {
      const challenge = decodeChallenge(payload);
      if (!promptById(challenge.promptId) || !LOCALES[challenge.languageId]) throw new Error("Unknown prompt");
      setReceivedChallenge(challenge);
      setReceivedDailyKey(linkedDay);
      setReceivedShareLink(shareLink);
      setReceivedLinkStatus(linkStatus);
      setGuessStarted(false);
      setReplayDone(false);
      setSelectedOption(null);
      setRecognitionMs(null);
      guessAnsweredRef.current = false;
      setScreen("guess");
      finishRouteLoading();
      if (openedChallengeRef.current !== trackingKey) {
        openedChallengeRef.current = trackingKey;
        trackAnalytics("challenge_opened", linkedDay ? "daily" : "shared");
      }
    };

    const loadChallenge = () => {
      const embedded = document.getElementById("dmw-challenge-data");
      const shortPath = window.location.pathname.match(/^\/c\/([A-Za-z0-9_-]+)$/);

      if (embedded && shortPath && isShortChallengeCode(shortPath[1])) {
        try {
          const stored = JSON.parse(embedded.textContent ?? "") as { payload?: unknown; day?: unknown; code?: unknown };
          if (stored.code !== shortPath[1] || typeof stored.payload !== "string") throw new Error("Invalid stored challenge");
          const linkedDay = stored.day === null || stored.day === undefined
            ? null
            : typeof stored.day === "string" && isDayKey(stored.day)
              ? stored.day
              : null;
          applyReceivedChallenge(
            stored.payload,
            linkedDay,
            `short:${shortPath[1]}`,
            `${window.location.origin}/c/${shortPath[1]}`,
            "ready",
          );
          return;
        } catch {
          setScreen("invalid");
          finishRouteLoading();
          return;
        }
      }

      const match = window.location.hash.match(/^#d=([A-Za-z0-9_-]+)(?:&day=(\d{4}-\d{2}-\d{2}))?$/);
      if (!match) {
        if (window.location.hash.startsWith("#d=") || shortPath) {
          setScreen("invalid");
          finishRouteLoading();
        } else if (!window.location.hash && !homeViewTrackedRef.current) {
          homeViewTrackedRef.current = true;
          trackAnalytics("home_view", "social_dare_v1");
        }
        return;
      }
      try {
        const linkedDay = match[2] && isDayKey(match[2]) ? match[2] : null;
        const fallbackLink = `${window.location.origin}/#d=${match[1]}${linkedDay ? `&day=${linkedDay}` : ""}`;
        applyReceivedChallenge(match[1], linkedDay, match[1], fallbackLink, "fallback");
      } catch {
        setScreen("invalid");
        finishRouteLoading();
      }
    };

    loadChallenge();
    window.addEventListener("hashchange", loadChallenge);

    const presenceTimer = window.setTimeout(() => {
      if (!presenceTrackedRef.current) {
        presenceTrackedRef.current = true;
        trackDiscoverySource();
        trackPresence(utcDayKey());
      }
    }, 0);

    return () => {
      window.cancelAnimationFrame(localeFrame);
      window.clearTimeout(presenceTimer);
      window.removeEventListener("hashchange", loadChallenge);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem("dmw-language", locale);
      document.cookie = `dmw-language=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // Device storage is optional.
    }
  }, [locale]);

  useEffect(() => {
    const heading = shellRef.current?.querySelector<HTMLElement>("[data-screen-title]");
    if (heading) heading.focus({ preventScroll: screen !== "home" });
  }, [screen]);

  useEffect(() => {
    if (!drawingStarted || screen !== "draw") return;
    const update = () => {
      const start = drawStartRef.current ?? performance.now();
      const remaining = Math.max(0, 10000 - (performance.now() - start));
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) finalizeDrawing();
    };
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [drawingStarted, finalizeDrawing, screen]);

  useEffect(() => {
    const render = () => {
      if (screen === "draw") drawTrace(canvasRef.current, strokesRef.current);
      if (screen === "share" && createdChallenge) drawTrace(canvasRef.current, createdChallenge.strokes);
      if (screen === "guess" && receivedChallenge) {
        drawTrace(canvasRef.current, receivedChallenge.strokes, guessStarted ? replayUntilRef.current : -1);
      }
      if (screen === "result" && receivedChallenge) drawTrace(canvasRef.current, receivedChallenge.strokes);
    };
    const frame = window.requestAnimationFrame(render);
    window.addEventListener("resize", render);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", render);
    };
  }, [createdChallenge, guessStarted, receivedChallenge, screen]);

  useEffect(() => {
    if (screen !== "guess" || !guessStarted || !receivedChallenge) return;
    const sourceDuration = Math.max(
      receivedChallenge.durationMs,
      ...receivedChallenge.strokes.flatMap((stroke) => stroke.map((point) => point.t)),
    );
    const playDuration = Math.max(1800, Math.min(6200, sourceDuration));
    const startedAt = performance.now();

    const finishUnanswered = () => {
      if (guessAnsweredRef.current) return;
      guessAnsweredRef.current = true;
      trackAnalytics("guess_completed", "timeout");
      setReplayDone(true);
      setRecognitionMs(playDuration);
      setSelectedOption(-1);
      setScreen("result");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawTrace(canvasRef.current, receivedChallenge.strokes);
      const timeout = window.setTimeout(finishUnanswered, playDuration);
      return () => window.clearTimeout(timeout);
    }

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      replayUntilRef.current = Math.min(sourceDuration, (elapsed / playDuration) * sourceDuration);
      drawTrace(canvasRef.current, receivedChallenge.strokes, replayUntilRef.current);
      if (elapsed < playDuration) {
        replayFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        replayFrameRef.current = null;
        finishUnanswered();
      }
    };
    replayFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (replayFrameRef.current) window.cancelAnimationFrame(replayFrameRef.current);
      replayFrameRef.current = null;
    };
  }, [guessStarted, receivedChallenge, screen]);

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "draw" || timeLeft <= 0 || strokesRef.current.length >= 24) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (drawStartRef.current === null) {
      drawStartRef.current = performance.now();
      setDrawingStarted(true);
      setNotice("");
    }
    const point = pointerPoint(event, drawStartRef.current);
    const stroke: Stroke = [point];
    activeStrokeRef.current = stroke;
    strokesRef.current = [...strokesRef.current, stroke];
    setStrokes(strokesRef.current.map((currentStroke) => currentStroke.slice()));
    drawTrace(canvasRef.current, strokesRef.current);
  };

  const moveStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const active = activeStrokeRef.current;
    if (!active || drawStartRef.current === null) return;
    const point = pointerPoint(event, drawStartRef.current);
    const previous = active[active.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 2.5 && point.t - previous.t < 55) return;
    active.push(point);
    drawTrace(canvasRef.current, strokesRef.current);
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const active = activeStrokeRef.current;
    if (!active || drawStartRef.current === null) return;
    const point = pointerPoint(event, drawStartRef.current);
    const previous = active[active.length - 1];
    if (point.x !== previous.x || point.y !== previous.y) active.push(point);
    activeStrokeRef.current = null;
    setStrokes(strokesRef.current.map((stroke) => stroke.slice()));
    drawTrace(canvasRef.current, strokesRef.current);
  };

  const clearDrawing = () => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    setStrokes([]);
    setNotice("");
    drawTrace(canvasRef.current, []);
  };

  const startGuessing = (event: React.MouseEvent<HTMLButtonElement>) => {
    replayUntilRef.current = 0;
    guessStartRef.current = event.timeStamp;
    guessAnsweredRef.current = false;
    setSelectedOption(null);
    setRecognitionMs(null);
    setReplayDone(false);
    setGuessStarted(true);
    trackAnalytics("guess_started", receivedDailyKey ? "daily" : "shared");
    navigator.vibrate?.(20);
  };

  const chooseGuess = (option: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!guessStarted || replayDone || selectedOption !== null || guessAnsweredRef.current) return;
    const elapsed = Math.max(0, event.timeStamp - (guessStartRef.current ?? event.timeStamp));
    guessAnsweredRef.current = true;
    trackAnalytics("guess_completed", option === 0 ? "correct" : "wrong");
    setSelectedOption(option);
    setRecognitionMs(elapsed);
    setScreen("result");
    navigator.vibrate?.(option === 0 ? [35, 35, 60] : 45);
  };

  const deliverShare = async (text: string, url: string): Promise<"shared" | "copied" | null> => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Draw Me Wrong", text, url });
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return null;
      }
    }
    await copyText(`${text} ${url}`);
    setNotice(copy.linkCopied);
    return "copied";
  };

  const share = async (group = false) => {
    if (!challengeLink || challengeLinkStatus === "creating") return;
    const text = group
      ? copy.groupShareText
      : dailyKey
        ? copy.dailyShareText
        : replyMode
          ? copy.shareBackText
          : copy.shareText;
    const delivery = await deliverShare(text, challengeLink);
    if (delivery === "shared") trackAnalytics("share", group ? "group" : "direct");
    if (delivery === "copied") trackAnalytics("share", "copy");
  };

  const shareResult = async () => {
    if (receivedLinkStatus === "creating") return;
    const resultText = selectedOption === 0
      ? fill(copy.shareResultCorrect, {
        n: new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          .format((recognitionMs ?? 0) / 1000),
      })
      : copy.shareResultWrong;
    const url = receivedShareLink || window.location.href;
    const delivery = await deliverShare(resultText, url);
    if (delivery === "shared") trackAnalytics("share", "result");
    if (delivery === "copied") trackAnalytics("share", "copy");
  };

  const copyLink = async () => {
    if (!challengeLink || challengeLinkStatus === "creating") return;
    await copyText(challengeLink);
    setNotice(challengeLinkStatus === "fallback" ? copy.shortLinkFallback : copy.linkCopied);
    trackAnalytics("share", "copy");
  };

  const goHome = () => {
    removeChallengeHash();
    resetDrawing();
    setReceivedChallenge(null);
    setReceivedDailyKey(null);
    setReceivedShareLink("");
    setReceivedLinkStatus("idle");
    setDailyKey(null);
    setScreen("home");
  };

  const answer = receivedPrompt?.words[locale][0] ?? "";
  const isCorrect = selectedOption === 0;
  const timedOut = selectedOption === -1;
  const scoreSeconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    .format((recognitionMs ?? 0) / 1000);
  const hasDrawing = strokes.length > 0;
  const visibleDailyKey = dailyKey ?? receivedDailyKey;
  const dailyDate = visibleDailyKey
    ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" })
      .format(new Date(`${visibleDailyKey}T00:00:00.000Z`))
    : "";

  return (
    <main ref={shellRef} className={`site-shell screen-${screen}`}>
      <nav className="topbar">
        <button className="wordmark" onClick={goHome} aria-label={copy.goHome}>
          <span>DRAW ME</span> WRONG
        </button>
        <div className="topbar-tools">
          <span className="tiny-rule">{copy.oneGuess}</span>
          <label className="language-picker">
            <span className="sr-only">{copy.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={copy.language}>
              {LOCALES.map((language) => <option key={language} value={language}>{LANGUAGE_NAMES[language]}</option>)}
            </select>
          </label>
        </div>
      </nav>

      <div className="challenge-route-loader" role="status" aria-live="polite">
        <span className="loader-wordmark"><b>DRAW ME</b> WRONG</span>
        <span className="loader-scribble" aria-hidden="true">〰〰〰</span>
        <p>{copy.waiting}</p>
      </div>

      {screen === "home" && (
        <>
          <section className="hero" id="top">
            <div className="hero-copy">
              <p className="eyebrow">{homePositioning.eyebrow}</p>
              <h1 data-screen-title tabIndex={-1}>{homePositioning.title}</h1>
              <p className="dek">{homePositioning.subtitle}</p>
              <div className="hero-actions">
                <a className="primary-cta live-hero-cta" href="/live" onClick={() => trackAnalytics("live_entry", "private") }>
                  {homePositioning.startRoom} <span aria-hidden="true">●</span>
                </a>
                <button className="secondary-button" onClick={() => beginFromHero("random")}>
                  {homePositioning.sendDare} <span aria-hidden="true">→</span>
                </button>
                <button className="daily-cta" onClick={() => beginFromHero("daily")}>
                  <span>{copy.dailyDisaster}</span>
                  {dailyProgress && <small>{fill(copy.dailyStreak, { n: dailyProgress.streak })}</small>}
                </button>
              </div>
              <p className="hero-proof">{copy.privacyLine}</p>
            </div>

            <button className="demo-card" onClick={() => beginFromHero("random")} aria-label={copy.makeChallenge}>
              <span className="tape">{copy.forBrave}</span>
              <span className="demo-prompt">{PROMPTS[0].words[locale][0]}</span>
              <span className="scribble" aria-hidden="true">〰〰〰</span>
              <span className="demo-caption">{copy.canTheyTell}</span>
            </button>
            <p className="side-note">{copy.oneGuessNoMercy}</p>
          </section>

          <a className="team-intent-link" href="/play/team-icebreaker">
            <span aria-hidden="true">↗</span><strong>{homePositioning.teamLink}</strong><em>5 min • 2-6</em>
          </a>

          <section className="how-section" aria-labelledby="how-title">
            <div className="how-heading">
              <h2 id="how-title">{copy.howTitle}</h2>
              <p>{copy.howSubtitle}</p>
            </div>
            <ol className="how-grid">
              <li>
                <strong>{copy.stepPromptTitle}</strong>
                <p>{copy.stepPromptBody}</p>
              </li>
              <li>
                <strong>{copy.stepDrawTitle}</strong>
                <p>{copy.stepDrawBody}</p>
              </li>
              <li>
                <strong>{copy.stepSendTitle}</strong>
                <p>{copy.stepSendBody}</p>
              </li>
            </ol>
            <aside className="privacy-proof">
              <strong>{copy.privacyLine}</strong>
              <p>{copy.drawingSafe}</p>
            </aside>
          </section>
        </>
      )}

      {screen === "draw" && (
        <section className="game-stage draw-stage">
          <header className="stage-header">
            <button className="back-button" onClick={goHome}>← {copy.quit}</button>
            <p>{dailyKey ? fill(copy.dailyChallengeLabel, { date: dailyDate }) : copy.yourPrompt}</p>
            <h2 data-screen-title tabIndex={-1}>{prompt.words[locale][0]}</h2>
            <span
              className={`timer ${drawingStarted ? "is-running" : ""}`}
              role="timer"
              aria-live={drawingStarted && timeLeft <= 3 ? "polite" : "off"}
              aria-label={fill(copy.seconds, { n: timeLeft })}
            >{fill(copy.seconds, { n: timeLeft })}</span>
            <p className="stage-instruction">{copy.makeRecognizable}</p>
          </header>
          <div className="canvas-wrap draw-canvas">
            <canvas
              ref={canvasRef}
              aria-label={copy.drawSomething}
              onPointerDown={startStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
            />
            {!hasDrawing && <span className="canvas-hint">{copy.drawAnywhere}</span>}
            {!drawingStarted && <span className="start-note">{copy.timerStarts}</span>}
          </div>
          <div className="draw-actions">
            <button className="secondary-button" onClick={clearDrawing} disabled={!hasDrawing}>{copy.clear}</button>
            <button className="primary-cta stage-cta" onClick={finalizeDrawing} disabled={!hasDrawing}>{copy.finish} <span>→</span></button>
          </div>
          <p className="notice" role="status" aria-live="polite">{notice}</p>
        </section>
      )}

      {screen === "share" && createdChallenge && createdPrompt && (
        <section className="game-stage share-stage">
          <header className="stage-header compact-header">
            <p>{dailyKey ? fill(copy.dailyChallengeLabel, { date: dailyDate }) : copy.yourPrompt}</p>
            <h2 data-screen-title tabIndex={-1}>{createdPrompt.words[locale][0]}</h2>
          </header>
          <div className="share-layout">
            <div className="canvas-wrap share-canvas">
              <canvas ref={canvasRef} aria-label={createdPrompt.words[locale][0]} />
              <span className="ready-stamp">{copy.challengeReady}</span>
            </div>
            <div className="share-panel">
              <p className="share-kicker">{copy.challengeReady}</p>
              <h3>{copy.shareTitle}</h3>
              <p>{copy.shareBody}</p>
              {wasSimplified && <p className="simplified-note">{copy.simplified}</p>}
              {challengeLinkStatus === "creating" && <p className="link-status">{copy.makingShortLink}</p>}
              <button className="primary-cta wide-button" onClick={() => share(false)} disabled={challengeLinkStatus === "creating"}>
                {challengeLinkStatus === "creating" ? copy.makingShortLink : copy.shareChallenge} <span>↗</span>
              </button>
              <button className="secondary-button wide-button" onClick={copyLink} disabled={challengeLinkStatus === "creating"}>
                {challengeLinkStatus === "creating" ? copy.makingShortLink : copy.copyLink}
              </button>
              <div className="outward-actions">
                {replyMode && <button className="text-button" onClick={() => share(false)} disabled={challengeLinkStatus === "creating"}>+ {copy.challengeSomeoneElse}</button>}
                <button className="text-button" onClick={() => share(true)} disabled={challengeLinkStatus === "creating"}>+ {copy.dropInGroup}</button>
              </div>
              <button className="text-button try-button" onClick={() => beginDraw(replyMode ? "reply" : "random", createdChallenge.promptId)}>
                ↻ {dailyKey ? copy.randomMode : copy.tryAnother}
              </button>
              <p className="share-privacy">{copy.drawingSafe}</p>
              <p className="notice" role="status" aria-live="polite">{notice}</p>
            </div>
          </div>
        </section>
      )}

      {screen === "guess" && receivedChallenge && receivedPrompt && (
        <section className="game-stage guess-stage">
          <header className="stage-header compact-header">
            <p>{receivedDailyKey ? fill(copy.dailyChallengeLabel, { date: dailyDate }) : copy.someoneDrew}</p>
            <h2 data-screen-title tabIndex={-1}>{copy.guessBeforeFinish}</h2>
            <p className="stage-instruction">{copy.tapToGuess}</p>
          </header>
          <div className="guess-layout">
            <div className={`canvas-wrap replay-canvas ${guessStarted ? "is-playing" : "is-sealed"}`}>
              <canvas ref={canvasRef} aria-label={copy.someoneDrew} />
              {!guessStarted && (
                <div className="sealed-overlay">
                  <span className="sealed-mark" aria-hidden="true">?</span>
                  <p>{copy.waiting}</p>
                  <button className="primary-cta" onClick={startGuessing}>{copy.startGuessing} <span>→</span></button>
                </div>
              )}
              {guessStarted && !replayDone && <span className="replay-badge">{copy.replay}</span>}
            </div>
            <div className={`guess-options ${guessStarted ? "are-live" : ""}`} aria-label={copy.yourGuess}>
              {optionOrder.map((option, index) => (
                <button key={option} disabled={!guessStarted || replayDone} onClick={(event) => chooseGuess(option, event)}>
                  <span>{index + 1}</span>{receivedPrompt.words[locale][option]}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {screen === "result" && receivedChallenge && receivedPrompt && selectedOption !== null && (
        <section className="game-stage result-stage">
          <div className="result-layout">
            <div className="canvas-wrap result-canvas">
              <canvas ref={canvasRef} aria-label={copy.someoneDrew} />
              <span className={`verdict-stamp ${isCorrect ? "is-correct" : "is-wrong"}`}>
                {timedOut ? copy.tooSlow : isCorrect ? copy.correct : copy.wrong}
              </span>
            </div>
            <div className="result-card">
              <p className="result-label">{copy.yourGuess}</p>
              <h2 data-screen-title tabIndex={-1}>{timedOut ? copy.tooSlow : isCorrect ? copy.correct : copy.wrong}</h2>
              <p className="answer-reveal">{fill(copy.itWas, { answer })}</p>
              <div className="score-block">
                <span>{isCorrect ? copy.recognitionTime : copy.timeTaken}</span>
                <strong>{fill(copy.seconds, { n: scoreSeconds })}</strong>
              </div>
              <button
                className="primary-cta wide-button"
                onClick={() => receivedDailyKey
                  ? beginDraw("daily", undefined, receivedChallenge.promptId, receivedDailyKey)
                  : beginDraw("reply", receivedChallenge.promptId)}
              >
                {receivedDailyKey ? copy.drawToday : copy.drawOneBack} <span>→</span>
              </button>
              <button className="secondary-button wide-button" onClick={shareResult} disabled={receivedLinkStatus === "creating"}>
                {receivedLinkStatus === "creating" ? copy.makingShortLink : copy.makeGroupGuess}
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === "invalid" && (
        <section className="invalid-stage">
          <span className="invalid-scribble" aria-hidden="true">〰</span>
          <p className="eyebrow">{copy.oneGuess}</p>
          <h2 data-screen-title tabIndex={-1}>{copy.invalidLink}</h2>
          <p>{copy.invalidBody}</p>
          <button className="primary-cta" onClick={goHome}>{copy.goHome} <span>→</span></button>
        </section>
      )}
    </main>
  );
}
