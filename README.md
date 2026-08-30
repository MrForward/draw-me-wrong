# Draw Me Wrong

Draw Me Wrong is a tiny multilingual shared-laugh game: open a live room for 2-6 people, or draw it wrong and make one friend guess.

You get a secret prompt and 10 seconds to make it recognizable, not pretty. The finished stroke replay becomes a short share link. A friend opens it, gets one guess, then can draw one back.

No account. No public gallery. Short links expire after 30 days.

## Play

The public game is hosted at [drawmewrong.fun](https://drawmewrong.fun).

Four entry paths are included:

- Private live room: 2-6 people draw and guess together without an account.
- Team icebreaker: a tailored five-minute flow for remote meetings, workshops, and retrospectives.
- Random challenge: make a new prompt for a friend.
- Today's Disaster: everyone gets the same daily prompt, with a device-local streak and a group-friendly share.

The interface supports English, Hindi, Spanish, French, Brazilian Portuguese, German, Japanese, and Korean.

## How links work

Every challenge is first encoded as a versioned binary payload containing a stable prompt ID, locale ID, drawing duration, and compacted stroke coordinates. A CRC rejects corrupted or truncated payloads.

The normal share URL uses a random 96-bit code under `/c/` and stores only that code, the encoded drawing, an optional daily key, and expiry timestamps. The record stops resolving after 30 days and expired records are removed opportunistically. If storage is unavailable, sharing falls back to the original self-contained `#d=` fragment link so a completed drawing is never lost. Existing fragment links remain compatible.

Anyone with either kind of link can replay its drawing, so players should not draw private information. The app does not store accounts, raw IP addresses, referrers, user agents, or user identifiers.

Separately, the server stores private daily aggregate counters for product events such as visits, completed challenges, guesses, shares, and broad discovery source categories such as ChatGPT or Google. Raw referring URLs are never transmitted. First-visit and daily-active counts are deduplicated in device-local storage without transmitting an ID, so the metrics are intentionally approximate.

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

The test suite covers binary codec round trips, corruption rejection, URL budgets, stable prompt data, daily prompt and streak rules, localization completeness, analytics event validation, server rendering, metadata, and removal of starter-only assets.

GitHub Actions runs the same checks on every push and pull request.

## Project structure

- `app/page.tsx`: static route wrapper
- `app/play/team-icebreaker/`: indexable team-use-case acquisition route
- `app/home-positioning.ts` and `app/play/team-icebreaker-copy.ts`: route-specific multilingual positioning copy
- `app/game-client.tsx`: game flow, drawing input, replay, sharing, and daily mode
- `app/live/`: private rooms, matchmaking fallback, same-group rematch, and tailored entry
- `app/challenge-links.ts`: short-link validation, retention, and secure code generation
- `app/game-data.ts`: localized UI, prompt packs, stable IDs, and daily helpers
- `app/codec.ts`: bounded binary encoder and decoder
- `app/api/events/route.ts`: same-origin aggregate analytics endpoint
- `app/globals.css`: responsive visual system and interaction states
- `db/`: aggregate analytics and expiring short-challenge storage
- `worker/index.ts`: Worker entry point and response security headers
- `tests/`: codec, localization, rendered output, and in-memory multiplayer integration checks

## Product constraints

The first release intentionally has no public gallery, free-text prompts, leaderboard, account system, raw event log, or tracking profiles. Recognition times and streaks are friendly device-local signals, not verified competitive records. Aggregate counts can be inflated by automated traffic and are directional product signals rather than billing-grade measurements.

Drawing is currently a pointer or touch interaction. Keyboard and switch-input drawing are not yet implemented.

## Launch copy

> Draw it wrong. Laugh together. Start a private live room for your group, or send one ten-second drawing dare to a friend. No app, no account, just a short link.

For developer communities:

> Show HN: Draw Me Wrong, a no-account 10-second drawing dare for friends
