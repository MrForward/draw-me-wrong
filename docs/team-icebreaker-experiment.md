# Experiment plan: five-minute team icebreaker

- Date: 2026-08-30
- Status: Ready for controlled exposure after production approval
- Owner: Founder
- Review point: 200 qualified landing views or 14 days

## Hypothesis

If a remote-team facilitator sees a specific five-minute icebreaker promise and can create one private room without an account, then enough rooms will form and complete to justify keeping this acquisition wedge.

We will believe the wedge deserves another iteration when at least 30% of created rooms gain a second player and at least 60% of started games complete. A 20% rematch or new-room rate after completion is the first signal of retention or host conversion.

## Audience and entry conditions

- People who run a remote stand-up, workshop, sprint retrospective, team social, or small group call.
- Groups of 2-6 who are already in the same call or chat.
- Traffic sent to `/play/team-icebreaker`, not the generic homepage.
- No paid traffic during the first learning window.

## Treatment

- Situation-specific landing page with a direct five-minute promise.
- Interactive drawing preview.
- One CTA into `/live?p=team`.
- Tailored private-room entry and invite copy.
- Same URL and group for rematch.
- No Quick Match option on the team path.

## Seeding plan

1. Recruit 15-25 facilitators from the founder’s real network, remote-work communities, design or engineering teams, and workshop hosts.
2. Ask each person to use it at one real meeting moment, not merely open the page.
3. Send the exact team-icebreaker URL. Do not over-explain the game outside the page.
4. Collect one short qualitative answer after use: “What made you hesitate or stop?”
5. Review aggregate funnel counts daily, but make product decisions only at the learning window unless a reliability guardrail fails.

## Measurement

The authoritative stages and events are defined in `docs/product-decision.md`. Review stage-to-stage conversion, not raw page views alone.

Qualitative tags:

- Did not understand the activity
- Did not want to interrupt the meeting
- Could not get a second person to join
- Lobby or host confusion
- Drawing or timer failure
- Guessing confusion
- Fun once, no reason to repeat
- Asked to use it again

## Guardrails and stop conditions

Pause exposure if any of these happen:

- A participant sees the answer before the reveal.
- A private room link exposes a session token.
- A host departure strands the lobby.
- A completed group cannot rematch together.
- More than 10% of observed formed rooms hit a blocking technical failure.
- Abuse reports indicate the fixed prompt and alias model is insufficient.

## Follow-up decisions

- Strong landing clicks, weak creation: reduce entry friction.
- Strong creation, weak second join: improve invite copy and facilitator instructions.
- Strong formation, weak completion: repair or shorten the play loop.
- Strong completion, weak continuation: improve the result reveal and next-host path.
- Healthy full funnel: interview repeat users, then test one second situation page with a genuinely different job.
- Weak full funnel after one focused repair cycle: keep the asynchronous friend challenge, stop expanding the team wedge, and revisit the target situation.
