---
name: tool-discovery-execution
description: >
  Use this skill before acting or delegating when the requested outcome leaves
  a material source, target, audience, scope, authority, public effect, spend,
  or success measure unresolved. Also use it when the user needs information or
  an action from a named platform or app, a connected account, structured
  provider-backed data, a question only team data can answer, or an exhaustive
  list or ranking behind a public interface. For generic narrative web research
  with a resolved outcome, use web-research; for a public website supplied as a
  design reference, use website-brand-content-extraction.
mode: sandbox
notification_title: "Using integrations"
agent_policies:
  orchestrator: orchestrator-policy.md
---

# Tool discovery and execution

**Role:** Discover and execute integration capabilities from the current runtime catalog without relying on remembered provider or tool metadata.

**Context:**

Use `kite-integrations` through `bash` to resolve the current team or
application scope and platform credentials from the environment. If the command
is unavailable, read `references/raw-endpoint-fallback.md` for the equivalent
requests.
Success means the requested data was retrieved, the requested action completed,
or every unavailable step has one clear connection or fallback handoff.

## Agent-role boundary

Check the runtime role:

Canonical material-intent gate: before catalog search, connection, or delegation, resolve the user-visible outcome
from this message, prior turns, and stored context. Infer low-cost reversible
details; ask a focused question for an unresolved source, target, data domain,
account, audience, scope, authority, public effect, spend, or success measure.
Destinations, domains, and accounts are intent; outcome-equivalent providers and
tools are implementation choices. Catalog results, connection status, and tool
availability cannot choose or enumerate unresolved user-visible outcomes.
Hold dependent gateway/delegated work when
clarification is needed. Ask first for core outcome or authority; otherwise do
work valid across answers and name what waits. Refinement need not block an
acceptable first version; context/wiki reads and explicit future-oriented promises
remain allowed. A pending answer grants no permission; preserve an answer through
that turn's search and delegation without re-asking.

A named organization selects that organization's account presence for a named
destination; introduce a personal account only if named or conflicting context
requires it. An omitted read window/count is reversible: use at most 8 recent
representative items (fewer when sufficient), unless population coverage was
requested, and record that bound in a delegated brief.

- **`THREAD_ID` (conversational orchestrator):** apply the gate, then `search`
  in that turn with target and operation in query/brief. A matching `connected`
  row ends preflight: stop `kite-integrations`, load `work-delegation`, and pass
  only integration plus requested resource/capability. Do **not** inspect or
  execute, or put provider data in the brief. The numbered workflow is not this
  role's workflow; system-prompt exceptions retain deeper preflight. Before an
  external-service delegation, read `references/delegation-preconditions.md` and
  settle reachability.
- **`TASK_ID` (assigned task agent):** follow the complete workflow; own catalog
  and schema inspection, execution, polling, and fallback. Report a missing
  material user-visible choice to the delegator rather than guessing, broadening,
  or changing data domains. A named integration is a connected route to try
  first, not proof of capability or the only route; apply the selection rules,
  including rule 4's unconnected candidates, if it lacks the capability.

## Workflow

For each platform-specific external need:

1. `search <query>` — identify the relevant integration or integration category.
   Search returns integrations only.
2. Choose an integration from its `type` and `status`.
3. `inspect-integration <integration_id>` — list that integration's tool names
   and descriptions.
4. Choose a tool whose description covers the requested operation.
5. `inspect-tool <tool_name> [<tool_name> ...]` — read every chosen tool's
   input schema in one call.
6. `execute <tool_name> '<params-json>'` — run it.

Search is one natural-language query; the CLI supplies scope. Preserve resolved
target and operation (a read/review/ideation request gains no write intent).
Query the brand when named, otherwise its needed category—not a guessed tool or
integration—and copy IDs, tool names, and parameter names from responses.

## Search and choose

```bash
kite-integrations search "<capability or user-named brand>"
```

The response is one flat list:

```json
{
  "team_id": "…",
  "integrations": [
    {
      "id": "<platform integration id>",
      "name_slug": "<name slug>",
      "name": "<display name>",
      "type": "platform",
      "status": "connected"
    },
    {
      "id": "<connector integration id>",
      "name_slug": "<name slug>",
      "name": "<display name>",
      "type": "connector",
      "status": "connected"
    }
  ]
}
```

`id` is the exact `inspect-integration` value. `platform` is Kite-supplied
(usually managed/connected, but install-backed GitHub/Slack report real status);
`connector` is an account integration, whose `connected` status means current
team authorization. Connect or repair a `not_connected` row—connector or
install-backed platform—before executing its tools. A brand can have platform
and connector rows; one connector
combines its provider and MCP backends. Search covers all of these but rank is
only a hint. Prefer a named brand; otherwise compare type, status, and inspected
descriptions, rejecting loose matches. Retry an empty result once with a broader
category or omitted named brand; then use rule 5.

Connection is last resort, inspection is not. Apply rules 1–4 in order: request
scope, same-brand duplicates, cross-brand access mode, unavailable routes.
Inspect matching `connected` rows first and execute if capable; otherwise inspect
matching `not_connected` rows before reporting a shortfall. Inspect at most each
subset's three highest-ranked rows (not the search-list head); rule 4 settles
the result. This is task-agent work: the orchestrator does not inspect; it
offers from the matching search row.
1. For a resolved outcome with no named technical provider, select among
   `connected` integrations without asking the user when they are
   implementation-equivalent under the material-intent gate above. An
   assigned task agent inspects those integrations and chooses the tool catalog
   that best covers the need; if they are equally suitable, it uses the
   highest-ranked result. A conversational orchestrator applies the preflight
   boundary above and leaves tool suitability to the task agent. Returned rows
   for distinct destinations, data domains, or accounts are not equivalent;
   resolve that intent before connecting or delegating. Ask which returned
   provider to connect only when no implementation-equivalent connected route
   is available.
2. When the same brand has multiple rows, choose a `connected` row over a
   `not_connected` row. If both are `connected`, choose the `connector`: the
   team explicitly connected that account. Inspect the preferred integration
   first; use the other row only when its inspected catalog has the suitable
   tool and the preferred integration does not.
3. When comparing different brands, use a matching connected connector for the
   team's private data or account actions—publishing, replying, creating
   records, or reading private analytics. Use a matching platform integration
   for public data, research, enrichment, or another Kite-managed operation.
   For research or enrichment a routed row (picks the provider per call and
   reports who answered) ranks first; use a provider-specific catalog when the
   user names it or after a routed miss.
   For a supplied video or social-media URL, prefer a matching media-evidence
   capability for transcripts, metadata, or structured extraction. Use social
   listening or ad discovery to find posts or creatives, and generic web
   research for page extraction or crawling. Try an equivalent provider only
   under the typed fallback conditions in **Execute**.
4. If no matching `connected` catalog covers the need, inspect matching
   `not_connected` connectors/install-backed platforms before concluding;
   inspection needs no authorization. `provider_not_connected` is an
   authorization-gated catalog and remains a candidate; other outcomes use
   **Inspect an integration**. Settle exclusively in this order: capable readable
   connected catalog → execute; more connected rows past bound → name/ask,
   without offering; capable readable unconnected catalog → connection recipe;
   remaining connection candidate (including `provider_not_connected`) → offer;
   more unconnected rows past bound → name/ask; plausible schema-uninspected
   tools past schema bound → report incomplete inspection/ask; else unavailable.
   This ladder alone permits an unavailable/inaccessible/limited result, caveat,
   wiki note, or brief fallback. A task agent names row, tool, and schema-shown
   capability. A task agent cannot mint a connect link; its delegator mints the
   CTA. For Slack, direct installation of
   Kite's bot from Integrations/Team settings; reserve `connect` for other rows.
5. With no suitable integration, use `web-research` for public information.
   For named-platform communities/posts/profiles, `kite-research search` naming
   its domain is indexed—not platform—evidence: label it unverified, name the
   first-party integration, and wait for that integration to verify claims.
   Never read that platform through `extract`, `scrape`, `deep`, `webfetch`,
   `curl`/`wget`, or browser navigation. `browser-session`'s three accepted
   cases are the only browser route; load and follow that skill.

The current search response is the only integration inventory. Derive every
choice from it. An MCP-backed result is an ordinary connector row, not a
separate route.

For multi-step work, search each external-system need before execution. Inspect
each selection, map needs to returned tools, run ready steps, and combine
missing connections into one handoff. Retry an unhelpful category query once
with a more specific category or named brand.

## Tool-specific recipes

`inspect-integration` is the current source of truth for tools, replacing any
separate platform-tool inventory. Choose among inspected descriptions, then
inspect the selected schema. The two following cases have dedicated recipes;
otherwise use this standard flow.

Gateway tools are arguments to `kite-integrations`, not executable programs or
provider-specific binaries in the sandbox. Pass returned integration and tool
names only as arguments to `kite-integrations`.

- Slack delivery is owned by `slack-messaging`. Load that skill before a
  Slack send, channel check, or reply-mode change; if it is unavailable to the
  current agent, do not send directly.
- Read `references/github.md` for GitHub API calls and first-party App setup.

## Inspect an integration

```bash
kite-integrations inspect-integration '<integration id copied from search>'
```

The response is the complete unpaginated `tools` catalog, without schemas:

```json
{
  "integration": {
    "id": "<integration id>",
    "name_slug": "<name slug>",
    "name": "<display name>",
    "type": "platform",
    "status": "connected"
  },
  "tools": [
    {
      "name": "<tool name>",
      "description": "<capability and operation description>"
    }
  ]
}
```

Copy search `id` as `integration_id`, then a returned `tool.name`; inspect the
integration before choosing its tool. Prefixes (`native:*`, `platform:*`,
`composio:*`, `pipedream:*`, `mcp:*`) are invocation details, not types; there
is no tool cursor. An inspection error is a complete catalog-read failure:
retry/reselect, except `provider_not_connected` on a `not_connected` row stays
a connection candidate. A successful empty `tools` is unavailable, not a
candidate. Descriptions can omit parameter capabilities: decide absence from
schemas, inspecting up to two generic but plausible tools. Remaining plausible
uninspected tools are incomplete inspection under rule 4, never absence.

A large connector can return hundreds of tools. Save the response to a file,
shortlist by name, then emit the selected descriptions with their inspected
integration ID in one provenance wrapper, which keeps runtime lineage
verifiable when the complete catalog is too large to capture:

```bash
kite-integrations inspect-integration '<integration id copied from search>' > /tmp/integration-tools.json
jq -r '.tools[].name' /tmp/integration-tools.json
jq --arg integration_id '<integration id copied from search>' \
  '{integration_id: $integration_id, tools: [.tools[] | select(.description | test("<needed operation>"; "i"))]}' \
  /tmp/integration-tools.json
```

## Inspect a tool

```bash
kite-integrations inspect-tool '<tool name copied from inspection>' '<second tool name>'
```

Copy `tool_name` exactly from inspected `tools[].name`. Use only keys from the
returned `input_schema`, or an alternate parameter collection actually returned,
including its name, optionality, and defaults.

For a write field described as Markdown or parsing Markdown, use its named syntax for the customer draft;
preserve its links and inline code without flattening or adding formatting.

Inspect before the first execution of each selected tool. After an
`invalid_params` error, always re-inspect the tool schema and correct the
payload once. If the validation error names a required field or shape absent
from the inspected schema, the runtime error is authoritative for that retry;
build the one corrected payload from that error. If the corrected retry returns
the same validation error, treat the selected tool as unavailable and use the
next suitable search result or fallback.

Direct operation names are the complete live catalog: inspect the selected one
and pass its provider fields directly. Use a catalog-listing/companion layer
only when current inspected descriptions expose it.

### Catalog-backed tools

When inspected descriptions expose a catalog-listing plus companion execution
tool instead of one tool per operation:

1. Copy and inspect both returned tool names. Execute the catalog-listing tool
   with a focused 2–4 word capability query using only its inspected schema.
2. Choose an exact returned operation whose current input schema covers the
   request, and copy its operation name and fields from that response. An absent
   or empty schema means that operation is unavailable.
3. Execute the companion tool copied from integration inspection. Pass the
   chosen operation name and arguments using only the companion's inspected
   schema:

```bash
kite-integrations execute '<companion tool name from inspection>' \
  '{"<operation-name field from schema>": "<name from catalog listing>", "<arguments field from schema>": {}}'
```

Use the operation-name and arguments fields in that shape only when the
companion's inspected schema exposes them. If its current contract uses another
field name or shape, copy that contract instead. When no inspected schema can
express the returned operation and its arguments, treat the operation as
unavailable and use the next search result or fallback.

Catalog listing is discovery, not task completion. If it has no suitable endpoint,
refine once with a broader/more-specific 2–4 word term; only if the refinement
also lacks a suitable endpoint, use another result or fallback. For timeout/gateway error use **Errors** retryability, then that
fallback. Omit Kite-internal provider pricing, per-call charges, and spend.

## Execute

```bash
kite-integrations execute '<tool name copied from inspection>' \
  '{"<parameter from inspected schema>": "<value>"}'
```

Params are one JSON object string, single-quoted against shell expansion; above
about 100 KB write it to a file and pass `@/path/to/params.json`.

Execution can have side effects: treat a successful write as final/durable and
verify it from its result or durable identifier.

For an active gateway run, the CLI checkpoints its exact resume call under
`/tmp/kite-integrations-runs/` and polls briefly. If still active/interrupted,
execute that tool with only the saved resume ID. Never resubmit original params
after an ID exists; a terminal failure is not resumable, and a fresh run needs
an error warrant. Never pass a gateway run ID to another tool.

For provider active state, inspect the current catalog's result capability and
copy its ID/fields. Its ID makes polling the only continuation: retry a
transient poll, never start; if budget ends, report active with ID/capability.

For repeated reads/enrichment, call one suitable provider at a time; never send
one record to equivalent providers in parallel. Use the primary usable result;
fallback only for no result, missing required field, unavailable, or error.
After three consecutive `provider_error`/`rate_limited` results, stop that
integration for the batch, mark its remaining attempts `provider unavailable`,
and continue. In a team task, persist submitted run/task IDs in its provider
checkpoint before polling so retries resume rather than resubmit.

For non-terminal async work, poll one submitted job at inspected cadence and
stop at its budget. After three consecutive jobs exhaust it without terminal
result, suspend new batch records for that integration. Retain IDs for later
resume, create no replacements, and do not let it block usable primary results.

Validate required fields and action success. For truncated output with a saved
path, parse that file first. If missing/unparseable, never reconstruct visible
fragments: make one narrower inspected-field read for read-only work, never
resubmit a write; use parsed evidence or report the limitation. Reduce large
reads with `jq`, page small, and for `all`/`top`/population-wide asks cover the
full population before ranking, or state observed and total counts as incomplete.

For a bounded batch, keep one manifest keyed by every requested item; each
entry records `pending`, `succeeded`, or `failed`, plus any error and returned
record count. Publish only manifest-derived counts, identical in the task
summary, report, and outbound message — never counts reconciled from memory.
A completed request with zero records is `succeeded`, not `failed`.
`Unresolved` means exactly the entries still `pending`.

## Connect an unconnected integration

Connect a search row with `status: "not_connected"` (connector or install-backed
platform) only when it matches resolved target and capability, not a loose category.

An already-connected same-brand row changes offer framing, not whether to offer.
Before its CTA retain three short sentences: the brand is already connected but
its inspected catalog cannot do this; this is separate authorization of that
account, not a new service; and any
no-authorization alternative (for example, user export). Concision never trims
them; a non-minting agent carries them in its returned offer.

Pass the row's exact `name_slug` value:

```bash
kite-integrations connect notion
```

The command prints `{ "app", "provider", "connect_url", "connect_ref" }`.
Use display `name` for `app` and end with one `<connect-cta>` using `connect_ref`:

```text
Notion needs to be connected. Connect it below and I'll resume automatically.

<connect-cta>
{"app": "Notion", "ref": "<connect_ref>"}
</connect-cta>
```

For one connector use that object; for two or more use an array: one command per
slug, at most five entries, each with a short `reason`:

```text
Connect these accounts below and I'll resume the workflow automatically.

<connect-cta>
[{"app": "PostHog", "ref": "<connect_ref>", "reason": "to read traffic data"}, {"app": "Notion", "ref": "<connect_ref>", "reason": "to create the report"}]
</connect-cta>
```

Rules:

- Mint every required link before the final reply.
- A CTA is exclusive per team/app during its safety window: if connect/reconnect
  is in progress, mint none; finish/cancel that provider session, or wait only
  after its browser flow was abandoned/closed, and tell the user not to finish it.
- If `connect_ref` is null, use `"url": "<connect_url>"` as a fallback.
- Emit at most one valid-JSON final `<connect-cta>`; keep URLs only in its JSON.
- End the turn after emitting the block; the platform resumes after connection.
- If the user names a job but not the app, apply the equivalent-provider rule
  above only after the target and operation are resolved; ask which returned
  system to connect only when search finds no matching connected integration.
- Slack's Kite bot is installed from Integrations or Team settings and has no
  connect CTA. GitHub's first-party App uses `kite-integrations connect github`.

## Repair an existing connection

Reconnect only for an attempted action showing broken/missing permission, or
`connect` returning `reconnect_required`; rate limit, bad params, generic outage,
and `already_connected` are not evidence. Before it, read `references/reconnect.md`.

## Browser fallback

Browser is an agent-selected post-search fallback, not a gateway recommendation.
If no inspected integration fits site interaction, load `browser-session`, check
saved profiles, and follow login rules; delegated browser-login setup prevails.

## Raw endpoint fallback
When `kite-integrations` is unavailable, read
`references/raw-endpoint-fallback.md` for the equivalent requests and preserve
the same progressive-disclosure workflow.

## Errors

Every gateway error has `detail: { code, message, retryable }`. Before recovery,
read `references/errors.md` and apply its single precedence order and code table.
Never resubmit original params when an existing run can be resumed.

## Before returning
Confirm each read's fields/action success; name integration/tool, durable write
ID, and multi-step handoff. Report failed code/fallback. A shortfall/blocker is
complete only after rule 4 settlement (matching unconnected rows inspected and
offer named), never connected rows alone. If connection is needed, state the
remainder, emit one CTA, and end.
