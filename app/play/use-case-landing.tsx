"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackAnalytics, trackDiscoverySource } from "../analytics-client";
import { LANGUAGE_NAMES, LOCALES, PROMPTS, UI, detectLocale, type Locale } from "../game-data";
import { TEAM_ICEBREAKER_COPY } from "./team-icebreaker-copy";

type DoodlePoint = { x: number; y: number };
type DoodleStroke = DoodlePoint[];

const SAMPLE_APPLE: DoodleStroke[] = [
  [{ x: 126, y: 55 }, { x: 116, y: 42 }, { x: 120, y: 27 }],
  [{ x: 123, y: 42 }, { x: 145, y: 34 }, { x: 153, y: 42 }, { x: 139, y: 48 }],
  [{ x: 126, y: 62 }, { x: 94, y: 52 }, { x: 67, y: 70 }, { x: 55, y: 105 }, { x: 62, y: 148 }, { x: 88, y: 190 }, { x: 122, y: 209 }, { x: 154, y: 195 }, { x: 183, y: 159 }, { x: 193, y: 111 }, { x: 177, y: 76 }, { x: 151, y: 57 }, { x: 126, y: 62 }],
  [{ x: 78, y: 101 }, { x: 104, y: 91 }],
];

function renderDoodle(canvas: HTMLCanvasElement | null, strokes: DoodleStroke[]) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(width / 256, 0, 0, height / 256, 0, 0);
  context.clearRect(0, 0, 256, 256);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 6;
  context.strokeStyle = "#171714";
  for (const stroke of strokes) {
    if (!stroke[0]) continue;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
  }
}

function TeamDoodle({ locale }: { locale: Locale }) {
  const [seconds, setSeconds] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<DoodleStroke[]>(SAMPLE_APPLE.map((stroke) => stroke.slice()));
  const activeRef = useRef<DoodleStroke | null>(null);
  const freshRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);

  const paint = useCallback(() => renderDoodle(canvasRef.current, strokesRef.current), []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(paint);
    window.addEventListener("resize", paint);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", paint);
    };
  }, [paint]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (deadlineRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        deadlineRef.current = null;
        activeRef.current = null;
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>): DoodlePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(256, ((event.clientX - rect.left) / rect.width) * 256)),
      y: Math.max(0, Math.min(256, ((event.clientY - rect.top) / rect.height) * 256)),
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (seconds === 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!freshRef.current) {
      freshRef.current = true;
      strokesRef.current = [];
    }
    if (deadlineRef.current === null) {
      deadlineRef.current = performance.now() + 10_000;
      setSeconds(10);
    }
    const stroke = [point(event)];
    activeRef.current = stroke;
    strokesRef.current = [...strokesRef.current, stroke];
    paint();
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (seconds === 0 || !activeRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = point(event);
    const previous = activeRef.current[activeRef.current.length - 1];
    if (Math.hypot(next.x - previous.x, next.y - previous.y) < 2.5) return;
    activeRef.current.push(next);
    paint();
  };

  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    activeRef.current = null;
  };

  const clear = () => {
    freshRef.current = true;
    strokesRef.current = [];
    activeRef.current = null;
    deadlineRef.current = null;
    setSeconds(10);
    paint();
  };

  return (
    <section className="team-doodle-card" aria-label={UI[locale].drawSomething}>
      <div className="team-doodle-head">
        <div><span>{UI[locale].yourPrompt}</span><strong>{PROMPTS[0].words[locale][0]}</strong></div>
        <b aria-live="polite">{seconds}s</b>
      </div>
      <div className="canvas-wrap team-doodle-canvas">
        <canvas
          ref={canvasRef}
          aria-label={UI[locale].drawSomething}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <button className="team-doodle-clear" type="button" onClick={clear}>{UI[locale].clear} ↺</button>
    </section>
  );
}

export default function UseCaseLanding() {
  const [locale, setLocale] = useState<Locale>("en");
  const viewedRef = useRef(false);
  const copy = TEAM_ICEBREAKER_COPY[locale];

  useEffect(() => {
    let chosen = detectLocale(navigator.language);
    try {
      const saved = localStorage.getItem("dmw-language") as Locale | null;
      if (saved && LOCALES.includes(saved)) chosen = saved;
    } catch {
      // Device-local language memory is optional.
    }
    const frame = window.requestAnimationFrame(() => {
      setLocale(chosen);
      if (!viewedRef.current) {
        viewedRef.current = true;
        trackDiscoverySource();
        trackAnalytics("use_case_view", "team");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem("dmw-language", locale); } catch { /* optional */ }
  }, [locale]);

  const changeLocale = (next: Locale) => setLocale(next);
  const trackCta = () => trackAnalytics("use_case_cta", "team");

  return (
    <main className="usecase-shell">
      <nav className="topbar usecase-topbar">
        <Link className="wordmark" href="/"><span>DRAW ME</span> WRONG</Link>
        <label className="language-picker">
          <span className="sr-only">{UI[locale].language}</span>
          <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)} aria-label={UI[locale].language}>
            {LOCALES.map((language) => <option key={language} value={language}>{LANGUAGE_NAMES[language]}</option>)}
          </select>
        </label>
      </nav>

      <section className="usecase-hero">
        <div className="usecase-hero-copy">
          <p className="eyebrow">{copy.heroBadge}</p>
          <h1>{copy.title}</h1>
          <p className="usecase-dek">{copy.subtitle}</p>
          <Link className="primary-cta team-primary-cta" href="/live?p=team" onClick={trackCta}>
            {copy.primaryCta}<span aria-hidden="true">→</span>
          </Link>
        </div>
        <TeamDoodle locale={locale} />
      </section>

      <p className="usecase-trust">{copy.trustPrivacy}</p>

      <section className="usecase-format" aria-labelledby="format-heading">
        <h2 id="format-heading">{copy.facilitationHeading}</h2>
        <ol>
          {copy.actions.map((action) => (
            <li key={action.label}><strong>{action.label}</strong><p>{action.body}</p></li>
          ))}
        </ol>
      </section>

      <section className="usecase-moments" aria-labelledby="moments-heading">
        <h2 id="moments-heading">{copy.momentsHeading}</h2>
        <div>
          {copy.moments.map((moment, index) => <p key={moment}><span aria-hidden="true">{["↗", "〰", "★"][index]}</span>{moment}</p>)}
        </div>
      </section>

      <section className="usecase-facts" aria-labelledby="facts-heading">
        <h2 id="facts-heading">{copy.factsHeading}</h2>
        <ul>{copy.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      </section>

      <section className="usecase-questions" aria-labelledby="questions-heading">
        <h2 id="questions-heading">{copy.questionsHeading}</h2>
        <dl>
          {copy.questions.map((item, index) => (
            <div key={item.question}>
              <dt><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="usecase-final">
        <h2>{copy.finalHeading}</h2>
        <Link className="primary-cta team-primary-cta" href="/live?p=team" onClick={trackCta}>
          {copy.finalCta}<span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
