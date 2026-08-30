# Product decision: own the five-minute shared laugh

- Date: 2026-08-30
- Owner: Founder
- Decision: Proceed as a focused beta, not as a broad drawing-game launch
- Primary wedge: A five-minute drawing icebreaker for small remote teams already together on a call

## Executive decision

Draw Me Wrong is technically credible enough to keep and improve. It is not yet proven enough to accept as a mass-market product. The product should not compete head-on as another generic online drawing game. It should own a specific moment: a small group is already together, has five minutes, and needs a quick shared laugh without an install or account.

The first acquisition path is `/play/team-icebreaker`. It covers remote-meeting arrivals, pre-workshop warm-ups, and pre-retro energy on one substantive page. Party, classroom, date-night, and family-call pages remain deferred until behavior proves that their workflow is meaningfully different.

## What is fact, inference, and unknown

### Facts

- The product supports private 2-6 player live rooms, one short invite URL, generated aliases, eight interface languages, ten-second drawing rounds, localized guesses, scores, and no account.
- The asynchronous one-friend drawing challenge also works through expiring short URLs.
- The previous live loop stranded a room when the host left, created a rematch for only one person, could discard a timed drawing, and offered indefinite Quick Match waiting.
- Mature generic competitors already cover public and private draw-and-guess play: [skribbl.io](https://skribbl.io/), [Drawasaurus](https://www.drawasaurus.org/), and [Gartic Phone](https://garticphone.com/).
- Team-practice publishers place icebreakers at the start of meetings, workshops, and group events. Atlassian explicitly describes icebreakers for those moments in its [Icebreaker Activities play](https://www.atlassian.com/team-playbook/plays/icebreaker-activities), and Miro maintains a large [icebreaker template collection](https://miro.com/templates/icebreakers/).

### Inferences

- The defensible wedge is not “online drawing game.” It is “the fastest shared laugh to launch inside a call or group chat.”
- A facilitator has a reason to initiate now, and every invite exposes another person to the product. That gives this situation a stronger distribution loop than anonymous matchmaking.
- Search intent should land on a situation-specific promise and then enter a tailored private-room flow. It should not land on a generic homepage and ask the user to interpret two products.

### Unknowns

- The current production traffic and live-room baseline. A one-time internal inspection looked low and test-heavy, but no dated query export was saved, so it is not decision evidence.
- Whether qualified facilitators create and share a room at a useful rate.
- Whether invite recipients join quickly enough to form a game.
- Whether the game feels worth repeating after one complete group round.
- Whether teams prefer a five-minute format over a shorter two-player round.
- Whether any second use case deserves its own workflow and page.

## Priority users and situations

| Priority | User | Situation | Job to be done | Product response |
|---|---|---|---|---|
| 1 | Meeting facilitator | Two to six people are joining a remote call | Get everyone participating and laughing before the agenda | Tailored team landing, private room, one clean invite, explicit five-minute promise |
| 2 | Invite recipient | A trusted colleague posts a room link in call chat | Join instantly without setup and understand what happens next | Generated name, no sign-in, localized join screen, visible room state |
| 3 | Post-game player | The reveal just created a shared laugh | Play again with the same people or become the next host | Same-room rematch, preserved URL, honest “new room” path |
| 4 | Friend challenger | One person wants an asynchronous joke with one friend | Draw now and get a reaction later | Existing short challenge link and draw-back loop |
| 5 | Anonymous player | A lone visitor wants an online opponent | Find a real human without being deceived | Experimental Quick Match with a 15-second honest fallback; do not promote broadly yet |

## Funnel direction

```text
Situation search or trusted share
        ↓
Team icebreaker landing view
        ↓
Start a team room
        ↓
Tailored live entry
        ↓
Private room created
        ↓
Invite copied or shared
        ↓
Second human joins
        ↓
Host starts the game
        ↓
2+ humans complete the shared laugh
        ↓
Same group rematches or a player starts another room
```

The primary product outcome is a completed live game with at least two humans. The growth outcome is a completed game that produces a same-group rematch or a new host.

### Event contract

| Funnel stage | Aggregate event | Variant |
|---|---|---|
| Qualified landing view | `use_case_view` | `team` |
| Landing CTA | `use_case_cta` | `team` |
| Tailored room entry | `use_case_live_entry` | `team` |
| Team room created | `use_case_room_created` | `team` |
| Invite delivery | `live_invite_shared` | room source plus `native` or `copy` |
| Room gains its second human | `live_room_formed` | room source: `team`, `home`, or `quick` |
| Game begins | `live_game_started` | room source |
| Game completes | `live_game_finished` | room source |
| Same group continues | `live_rematch_started` | room source |
| Quick Match queue entered | `live_queue_entered` | `quick` |
| Quick Match queue paused | `live_queue_timed_out` | `quick` |
| Result distributed | `live_result_shared` | room source plus `native` or `copy` |

Room-formed, game-start, game-finish, and rematch events are emitted from successful server state transitions. Reloads, multiple players polling, and host changes therefore do not multiply the primary funnel counters.

## Product changes accepted now

### Acquisition

- One indexable `/play/team-icebreaker` page with a direct situation promise.
- Remote-call arrival, workshop, and sprint-retro moments on the same page.
- Eight-language landing copy and an interactive drawing surface that demonstrates the real input.
- `/live?p=team` with tailored entry and invite copy; created room URLs remain clean, while an allowlisted room source preserves the team framing for invitees.
- Homepage promise widened from “for two” to one shared-laugh product with live and asynchronous modes.
- Sitemap and canonical metadata for the acquisition page; functional room URLs are noindex.

### Activation and retention

- Same-room rematch keeps the people, code, and URL.
- Host control moves to the next active player when the lobby host explicitly leaves or is away long enough, without invalidating the original player's session.
- Timed drawings present ten usable seconds, retry a failed auto-submit, and let the drawer explicitly skip a blank round.
- Quick Match pauses its server queue after 15 seconds and offers a real queue renewal, invite, or solo choice.
- Replacement players receive a new seat safely after a prior player leaves.
- Finished games retain the last drawing and add a shareable result plus a challenge-another-group path.

### Deferred

- Additional SEO pages for party, classroom, date-night, family calls, or generic retrospectives.
- Public profiles, chat, custom prompts, global leaderboard, payments, bots presented as humans, or paid acquisition.
- Broad promotion of Quick Match before concurrent traffic can support it.

## Decision gates

Evaluate after 200 qualified team-landing views or 14 exposed days, whichever produces a useful sample.

| Stage | Learning threshold | Interpretation |
|---|---:|---|
| Landing view to CTA | 25% | The situation and promise are understandable |
| CTA to room created | 70% | Entry friction is acceptable |
| Room created to invite shared | 60% | The facilitator can launch the activity |
| Room created to second join | 30% | The invite and timing can form a group |
| Formed room to game started | 70% | Lobby instructions and host control work |
| Started game to completed game | 60% | Core play is reliable and worth finishing |
| Completed game to rematch or another room | 20% | The experience has an early retention or host-conversion signal |

These are decision thresholds, not claimed results. If fewer than 30% of created rooms gain a second player, fix invitation and facilitation before adding new use cases. If formed rooms start but do not complete, fix the game loop before doing more distribution. If completion is healthy but continuation is weak, improve the reveal and post-game host handoff.

## Launch decision

Accepted as a controlled-beta release candidate: the production build, rendered-route suite, localization checks, and multiplayer integration suite pass. Publishing remains a separate founder approval because it applies a database migration and changes the live product. Do not claim product-market fit, user counts, or virality. Seed the first traffic manually with facilitators who can actually run it in a meeting, then let measured behavior decide the second use case.

Before a broad public campaign, add an edge rate-limit rule for room creation and Quick Match. Same-origin enforcement and probabilistic cleanup reduce abuse pressure, but they are not a substitute for an IP-based operational limit at scale.
