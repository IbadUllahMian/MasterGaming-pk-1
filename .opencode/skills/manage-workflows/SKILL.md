---
name: manage-workflows
description: >
  Use this skill when the user wants recurring work, scheduled edits,
  automation, or periodic checks, such as "update my site every Monday",
  "send me a weekly report", "schedule this task", or "show my scheduled
  automations". Skip this skill for one-time edits the user wants done now.
mode: both
agent_policies:
  orchestrator: orchestrator-policy.md
---

# Manage Workflows

Manage the current team's recurring workflows.

## Hard requirements

These requirements take precedence over supporting rules below.

- Before creating, list team workflows and verify every required third-party
  app is connected. Do not create until both checks pass.
- When recurring work signs in to a website through a browser rather than a
  connectable app, complete “Workflows that need a browser login” before the
  workflow can fire.
- Change an existing workflow in place when the request refers to its purpose
  or cadence. Preserve its id, history, and every unspecified field. Never
  create a second workflow to override or replace it.
- Verify the returned id, prompt, timing, and enabled state before
  reporting success.

## Rules

- Preserve supplied timing. Resolve timezone from the request, then the current
  sender's valid IANA profile zone, then an explicit conversation or team
  preference. Convert common names to IANA; use the profile to disambiguate,
  otherwise use the common meaning (for example, IST is `Asia/Kolkata`).
- For reversible internal work, choose and explain when the result is useful
  within the user's named window, such as morning or next business day.
- In live chat, ask one focused question for missing, conflicting, or unsupported
  timing, or before inferring timing for external sends, publishing, spend,
  deletion, or other external state. In tasks, create nothing and report those
  blockers through the task-result protocol.
- Confirm every create or update from its returned record in plain language and
  offer to change, pause, or remove it. For active schedules, give cadence and
  next local occurrence; without a local value, label the next fire UTC. Name a
  timezone interpretation and source only when resolved this turn, using IANA
  only to distinguish alternatives. For webhook-only workflows, report its
  trigger and idle-until-called state.
- If the workflow list is empty, say none are active and offer to create one.

## Writing the prompt

The prompt is the instruction one fired run executes, not a description of the
recurring arrangement. The schedule has already fired, so write an imperative
for work due now. Omit cadence and `delivery`; both are settings the run applies.

For example: `Go to Slack, list the workspace's members and channels, and write
a summary of both.` Cadence and delivery stay outside the stored prompt.

Put cadence in the user reply (“every Monday I'll…”) and, when natural, the
title (`Weekly Slack Summary`)—not in the stored prompt.

## Cron grammar

- Five fields: `minute hour day_of_month month day_of_week`, with an explicit
  IANA timezone (including `UTC`). Non-UTC schedules retain local wall time
  across DST; UTC follows cron literally.
- Each field is `*`, a number, a list (`1,15`), a range (`1-5`), or a step (`*/15`).
- `day_of_week` is `0`–`6` with `0` = Sunday.
- Examples: `0 9 * * 1` = Monday 09:00; `*/30 * * * *` = every 30
  minutes; `0 0 1 * *` = month start 00:00, all in the workflow timezone.

## Where each run reports (`delivery`)

Every run reports somewhere. Set `delivery` from the user's request, separate
from the prompt:

- **`default_channel` (default):** post to the team's main Slack channel. Use
  when the user does not specify a destination.
- **`thread`:** reply in this conversation when the user says “here,” “this
  thread,” or “this chat.” Creation requires a conversational source; task
  agents must use `default_channel` or `none`.
- **`none`:** no Slack message; the run's result stays in the conversation it
  opened, visible in the team's conversations. Use only when the user asks to
  keep results off Slack. Once set, it holds: no rollout reopens a workflow
  the user asked to keep quiet.

Readback `unset` means nobody chose a destination and behaves as `none`; it is
not settable. Listed `delivery` is the effective destination and may differ from
the stored value for rollout-managed workflows. To change delivery, update the
workflow in place rather than recreating it.

## Workflows that need a browser login

Some recurring work signs in to a website the run drives through a browser
rather than a connectable app—for example, “every morning, log in and export the
report.” Each run is unattended, so save the login to the workflow's browser
profile before the first fire or every run stalls at an unwatched login wall.

Resolve the login up front, in this conversation, while the user is present.
Use this flow only when no connected app covers the site login:

1. **Create disabled:** `kite-workflows create "<cron>" "<prompt>" "<title>" --timezone "<IANA_zone>" --disabled`. Read `id` and `browser_profile`.
2. **Delegate login setup:** using `work-delegation`, `kite-tasks create` a
   one-off task that opens the login page with
   `kite-browser create --profile "<browser_profile>" "<login-url>"`, runs
   `kite-browser handoff`, puts the handoff URL in its result, and stops without
   waiting. Pass the exact profile so the captured login persists for later
   runs; `browser-session` “Human handoff” owns the mechanics.
3. **Relay the link:** give the user the expiring handoff URL and deadline; ask
   them to log in and confirm when done.
4. **Save the login:** on confirmation, resume the setup task with
   `kite-comments create "<task_id>" "logged in — verify the page and close the session"`
   so it resumes in the same session, verifies login, and closes to write the
   login back to the profile.
5. **Enable:** `kite-workflows update "<id>" --enable`. Later triggers reuse the
   saved login automatically.

Keep the workflow disabled until login is confirmed saved. If the session
expires first, delegate a fresh setup task from step 2; the saved profile is
unaffected.

## Sandbox — `kite-workflows` CLI

The session token resolves the team; pass no team id.

- Create: `kite-workflows create "<cron_expression>" "<prompt>" "<title>" --timezone "<IANA_zone>" [--delivery thread|default_channel|none] [--disabled] [--webhook]`. A cron schedule requires the user's IANA timezone and preserves local time across DST. A webhook-only workflow uses cron `none` with `--webhook` and needs no timezone. Title is required, UI-facing, and at most six words (`Daily Pokemon Poem`). Omitted delivery defaults to `default_channel`. Use `--disabled` only for browser-login setup, then `update --enable`. Success JSON includes `id`, `browser_profile`, `next_fire_at`, `next_fire_at_local`, and detail-page `url`; use `url` only when the user explicitly requests the workflow link.
- List: `kite-workflows list` — prints all team workflows, including paused ones, as JSON. A `schedule_type` of `on_demand` means nothing is scheduled, whatever `cron_expression` shows: the workflow runs only when fired by hand or by webhook. `pitched_cadence` is the rhythm its /start card pitched (null when none); `cadence_offer_declined_at` set means the team already turned down a schedule for it.
- Update: `kite-workflows update "<workflow_id>" [--cron "<cron_expression>"] [--timezone "<IANA_zone>"] [--prompt "<prompt>"] [--title "<title>"] [--delivery thread|default_channel|none] [--enable|--disable] [--cadence-declined]`. It changes supplied fields only and returns JSON. Use a listed id. A first `--cron` — on a webhook-only workflow or an `on_demand` one — requires same-update `--timezone`, and puts an `on_demand` workflow on that schedule: verify `schedule_type` reads `scheduled`, and `next_fire_at` is set when the workflow is enabled (a paused one stays `null` until `--enable`). `--cadence-declined` records that the team said no to a schedule for an `on_demand` workflow; a later manual run is told so and does not offer again.
- Monitoring offer, conversational CMO only: `kite-workflows monitoring-offer "<website_id>"` reads state; `kite-workflows monitoring-offer-set "<website_id>" <asked|accepted|declined> [workflow_id]` advances it. Read first; states move strictly `unasked` → `asked` → `accepted` or `declined`, and same-state writes are retry-safe.
  - `unasked`: offer recurring monitoring in the same completion reply and record `asked` before sending — an offer withheld once costs nothing, while an `asked` recorded against an offer the user never saw is unrecoverable.
  - Any other state — `asked`, the terminal `accepted` or `declined`, or the `null` that means no successful CMO-led publish yet — means say nothing about monitoring.
  - Record `accepted` or `declined` only from the user's later explicit answer; `accepted` requires the confirmed-cadence workflow id, and the terminal states are final.
  - When the website id cannot be resolved or the state read fails, send the completion reply without the offer and leave the state untouched: the next publish reads it again.
  - Task sandboxes lack these subcommands and cannot advance state; a task agent with `analytics-interpretation` may read via `kite-analytics monitoring-offer`, otherwise report that the conversational CMO owns it.
- Delete: `kite-workflows delete "<workflow_id>"` — removes one workflow (exit 0 on success).
- Webhook: `kite-workflows webhook "<workflow_id>" --enable | --disable [--dedup-header "<Header-Name>"]` — turns the workflow's webhook trigger on or off and prints the workflow as JSON. Enabling returns a `webhook_url`; disabling clears it. `--dedup-header` names the header the source puts its event id in, so repeat deliveries of one event are dropped for 24h instead of only while identical bodies arrive within ~5 minutes — see "Stop one event firing the work twice".

Create/update verification is the hard requirement above; for delete, verify
exit 0. On failure, use the shared single retry and report no change without
proof.

## Run work when something happens (webhook triggers)

Use an event trigger when the user describes an occurrence rather than a time:
“when a lead comes in” or “whenever someone submits the form.” A webhook is the
only event trigger: the workflow gets a URL, and an HTTP POST fires a run. It
works whether the site was built here or elsewhere and whether the caller is the
site, a backend, or a third-party tool.

Create a webhook-only workflow with cron `none`:

```
kite-workflows create none "<prompt>" "<title>" --webhook
```

To add event firing alongside an existing schedule, so either trigger fires it:

```
kite-workflows webhook "<workflow_id>" --enable
```

- Read `webhook_url` from the response and give it to whoever will call it.
  Until something POSTs, the workflow is idle, not live; say so plainly.
- The POST body is appended under the stored prompt as data between two
  per-run `<<<token>>>` markers, capped at 64 KB. Store invariant work—apps and
  output—in the prompt; let the payload carry per-event data, naming fields the
  work depends on.
- The URL is a credential. Report it once to the user; never post it in a shared
  channel.
- `--disable` removes event firing; any cron schedule keeps running.

### Stop one event firing the work twice

Sources retry, and every fire spends a run. Deduplication depends on the source:

- With an event id in a header, repeats of that event are dropped for 24 hours.
- Without an identifier, only identical bodies within about five minutes are
  dropped; genuinely distinct events with identical bodies in that window also
  collapse.

When the source sends a delivery or event id, configure its header:

```
kite-workflows webhook "<workflow_id>" --enable --dedup-header "X-Dedupe-Key"
```

Read the real header from the source's documentation or delivery inspector; do
not guess. `Idempotency-Key` and `X-Idempotency-Key` need no flag. If the source
allows a custom event-id header, use `Idempotency-Key`. Without an identifier,
promise only brief identical-payload deduplication.

### Who calls the URL

The user or an agent working on their site must connect a caller. Identify which
one will POST:

- Their site's form handler or backend POSTs to the URL on submit.
- Their form tool (Typeform, HubSpot, Tally, a Google Apps Script, …) sends a
  webhook to the URL.
- Their analytics or automation tool (PostHog destinations, Segment, Zapier)
  forwards a chosen event to the URL.

Without a caller, creation is allowed, but say the workflow will remain idle
until the URL is called.
