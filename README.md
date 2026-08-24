# Draw Me Wrong

Draw Me Wrong is a tiny multilingual game about making recognizable art under unreasonable conditions.

You get a secret prompt and 10 seconds to draw it. The finished stroke replay is encoded inside a share link. A friend opens that link, watches the drawing appear, and gets one guess before time runs out.

No account. No backend. No upload.

## Play

The public game is hosted at [draw-me-wrong.chitu-atukuri2000.chatgpt.site](https://draw-me-wrong.chitu-atukuri2000.chatgpt.site).

Two modes are included:

- Random challenge: make a new prompt for a friend.
- Today's Disaster: everyone gets the same daily prompt, with a device-local streak and a group-friendly share.

The interface supports English, Hindi, Spanish, French, Brazilian Portuguese, German, Japanese, and Korean.

## How the link works

Every challenge is a versioned binary payload in the URL fragment after `#d=`. It contains a stable prompt ID, locale ID, drawing duration, and compacted stroke coordinates. A CRC rejects corrupted or truncated payloads.

URL fragments are not sent to the web server in normal HTTP requests. Anyone who receives the full link can still decode and replay the drawing, so players should not draw private information.

Prompt IDs are permanent compatibility keys. Existing IDs must never be reused or reordered semantically after a link has shipped.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

```bash
npm ci
npm run dev
```

The game uses React, vinext, Tailwind CSS, and the OpenAI Sites Vite plugin. It builds to a Cloudflare Worker compatible bundle.

## Verification

```bash
npm run lint
npm run typecheck
npm test
```

The test suite covers binary codec round trips, corruption rejection, URL budgets, stable prompt data, daily prompt and streak rules, localization completeness, server rendering, metadata, and removal of starter-only assets.

GitHub Actions runs the same checks on every push and pull request.

## Project structure

- `app/page.tsx`: game flow, drawing input, replay, sharing, and daily mode
- `app/game-data.ts`: localized UI, prompt packs, stable IDs, and daily helpers
- `app/codec.ts`: bounded binary encoder and decoder
- `app/globals.css`: responsive visual system and interaction states
- `worker/index.ts`: Worker entry point and response security headers
- `tests/`: codec, localization, and rendered output checks

## Product constraints

The first release intentionally has no public gallery, free-text prompts, leaderboard, analytics, account system, or database. Recognition times and streaks are friendly device-local signals, not verified competitive records.

Drawing is currently a pointer or touch interaction. Keyboard and switch-input drawing are not yet implemented.

## Launch copy

> I made a tiny game for exposing the gap between "I can draw" and reality. You get 10 seconds, your friend gets one guess, and the drawing replays stroke by stroke. No account, no upload, just a link.

For developer communities:

> Show HN: Draw Me Wrong, a 10-second bad-drawing challenge that lives entirely in a link
