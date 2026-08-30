# Lightweight PRD - Live Rooms

- Date: 2026-08-30
- Product owner: Founder
- Decision reference: User-approved multiplayer build and production launch
- Status: implementation complete; verification in progress

## Problem and outcome

- Target user and situation: A facilitator with 2-6 people already together on a remote call who wants a five-minute shared laugh without an install or account. Friend-group rooms remain a secondary use.
- Current problem or alternative: Shared drawing challenges are asynchronous; recipients cannot join one shared event or compete on one score.
- Desired customer outcome: One link starts a live, understandable game for 2-6 friends; a lone player can also find one online opponent.
- Desired business outcome: More invite redemptions, completed games, rematches, and repeat visits.
- Supporting evidence: The existing product already has timed drawing, replay, localized four-choice guessing, and share links. Actual multiplayer demand and queue liquidity are unknown.

## Hypothesis

If we turn the existing drawing dare into an unfinished live event for small groups, then more recipients will open, join, and return because their arrival changes the sender’s experience. We will believe this when invite rooms reliably form and completed games create rematches or another invite.

## Scope

### In scope

- Private invite rooms for 2-6 anonymous players.
- Experimental two-player Quick Match using the same room engine, hidden from the team-acquisition path and equipped with a 15-second fallback.
- Generated safe aliases, rotating drawer, ten-second drawing, simultaneous four-choice guessing, scores, replay, results, and rematch.
- Eight UI languages across the acquisition page, room UI, and per-player prompts and choices.
- Same-room rematch, host handoff, timed-drawing auto-submit, explicit blank-round skip, and safe replacement seats.
- Two-hour expiry, presence, reporting, bounded payloads, aggregate analytics, and no account requirement.

### Non-goals

- Chat, voice, free-form names or prompts, public gallery, permanent profiles, verified rankings, live stroke streaming, spectators, payments, or bots presented as humans.

## Scenarios and behavior

| Scenario | User intent | Expected behavior | Failure or edge behavior |
|---|---|---|---|
| Create private room | Play with friends | Receive a short `/live/<code>` invite; host starts at 2-6 players | Room remains a lobby until another player joins |
| Join invite | Enter without an account | Receive a generated alias and appear in the lobby | Full, started, invalid, and expired rooms fail clearly |
| Quick Match | Find a human online | Join the single waiting public lobby or create it | Waiting player can share the same live invite; no fake bots |
| Play round | Draw or guess | One drawer sees the secret; others only receive answer-free strokes and localized choices | Deadlines advance the room; late/duplicate submissions fail safely |
| Finish | See winner and continue | Scoreboard names a winner and offers a fresh room | Rooms expire and personal session tokens never enter URLs or analytics |

## Requirements and acceptance

| ID | Requirement | Acceptance criteria | Priority |
|---|---|---|---|
| R-001 | Private rooms | Two browsers can join one link, start, complete rounds, and finish | must |
| R-002 | Quick Match | Two simultaneous entrants converge on one public room and start automatically | must |
| R-003 | Prompt secrecy | Non-drawer responses and drawing payloads contain no prompt ID or correct answer before results | must |
| R-004 | Multilingual | UI and prompt choices work in English, Hindi, Spanish, French, Portuguese, German, Japanese, and Korean | must |
| R-005 | Safety | No free text/chat; public players can report and leave | must |
| R-006 | Sharing | Lobby invite is short and works at `/live/<12-character-code>` | must |
| R-007 | Measurement | Aggregate create, join, start, round, share, and completion events are counted | must |
| R-008 | Acquisition wedge | `/play/team-icebreaker` explains the situation and enters `/live?p=team` | must |
| R-009 | Group continuity | A finished group rematches at the same room URL with reset scores | must |
| R-010 | Lobby recovery | A departing or stale host hands control to the next player | must |
| R-011 | Honest empty queue | A lone Quick Match player receives wait, invite, and solo options after 15 seconds | must |

## Quality and risk

- Accessibility: Controls use native buttons/labels; canvas drawing remains pointer/touch dependent, a known limitation.
- Privacy and security: Room codes are roughly 60-bit unlisted capabilities; player secrets are 256-bit values stored only as SHA-256 hashes; same-origin JSON and bounded drawing payloads are enforced.
- Safety or abuse: Generated aliases, fixed prompt packs, no chat/free-form text, ephemeral drawings, and report-and-leave for public play.
- Reliability and performance: Static entry pages, compact completed drawings, 1.8-second polling, bounded rooms, optimistic state conditions, and opportunistic expiry cleanup.
- Operational support: Aggregate reports and room funnel events live in D1; Quick Match remains labeled experimental while liquidity is unknown.

## Measurement

- Primary outcome metric: Completed human live games per active day.
- Leading indicators: room created → second player joined → game started → game completed → rematch/invite.
- Guardrails: no prompt leakage, low forced-abandon rate, bounded transition latency, and public reports monitored.
- Instrumentation and owner: Aggregate `live_*` events in D1; founder reviews daily during launch week.
- Baseline and target: Baseline unknown. Initial learning gates: 30% of private rooms gain a second player, 60% of started games finish, and 20% of completed games lead to a rematch or another room after 200 qualified team-landing views or 14 exposed days.

## Dependencies and open questions

- Dependencies: Sites Worker, D1 migrations, static `/live` route, existing prompt packs.
- Assumptions still being tested: Small-group demand, public queue liquidity, 12-prompt replay depth, and whether a score improves sharing.
- Open questions and owners: Founder decides whether to promote Quick Match broadly after launch data; expand prompt packs before sustained paid promotion.

## Rollout

- Cohort and sequence: Seed the team-icebreaker path with real remote-team facilitators. Keep Quick Match experimental and outside that path.
- Feature flag or controls: Public matchmaking is isolated by room kind and can be removed from the entry UI without affecting private rooms.
- Monitoring: Daily live funnel counts, active public queue behavior, errors, and reports.
- Support and communication: Invite copy clearly says live, anonymous, and link-accessible.
- Rollback or mitigation: Revert the production version or remove Quick Match CTA while preserving private rooms.
- Learning review date: Seven days after launch or after 100 rooms, whichever provides a useful sample first.
