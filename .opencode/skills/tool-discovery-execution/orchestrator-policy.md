---
description: Orchestrator-only policy for the `tool-discovery-execution` skill — when to reach for the tool gateway, confirmation rules for side-effecting actions, and how to handle unconnected providers in conversation. Loaded by `load_skills` only when SKILL.md's `agent_policies.orchestrator` points here.
---

# tool-discovery-execution — orchestrator policy

The `kite-integrations` recipes live in `SKILL.md`, with per-vendor recipes and
the raw-endpoint fallback in its `references/` files (fetch them with the
`read_skill_file` tool, e.g. `read_skill_file(skill="tool-discovery-execution",
path="references/raw-endpoint-fallback.md")`); these rules shape when and how the
orchestrator uses them in conversation.

## When to use

- Use this skill when the user asks to act on a third-party integration (send a
  Slack message, read Notion pages, add a sheet row) or asks what integrations
  are available.
- Image generation, editing, and background removal belong to the `images`
  skill — use its recipes even when integration search returns image-capable
  tools.

## Choosing the source

- Understand the whole task first — it may need tools from several
  integrations, each covering only part of it.
- Apply SKILL.md's canonical material-intent gate before preflight. After an
  answer, continue in that turn. Apply SKILL.md's operation-preservation rule
  to the search and delegated brief.
- For delegated data work, use `search` only to find the matching integration
  row and verify its connection status. A matching `status: connected` row
  completes orchestrator preflight when it serves the resolved outcome: stop
  and delegate. If broad results expose distinct user-facing destinations,
  data domains, or accounts, return to the intent boundary before selecting or
  connecting one. Multiple implementation-equivalent connected rows remain an
  implementation choice, not a provider question. Do not inspect the
  integration or a provider tool, execute a provider read or action, or put
  provider-returned data in the task brief.
- Put only the connected integration and requested resource or capability in
  the task brief. The assigned task agent follows SKILL.md's complete selection,
  inspection, schema, execution, polling, and fallback workflow.
- When no suitable connected row exists, follow SKILL.md's connection flow and
  batch every missing connection into one offer. Explicit orchestrator
  exceptions defined by the system prompt, such as repository-import
  verification, keep their own deeper preflight.

## Confirmation boundary

- Confirmation establishes user intent; it does not transfer delegated
  provider execution back to the orchestrator.
- Read-only actions that the system prompt assigns to the orchestrator may run
  as soon as they are useful; delegated data preflight remains search-only.
- Side-effecting actions (sending messages, creating or updating records)
  require explicit user intent for that specific action. When the user's
  request implies a write but leaves the target or content open ("let the
  team know"), state what you are about to send and where, and get
  confirmation first.
- A succeeded write is final — report it; never re-run it to verify.

## Handling outcomes

- `provider_not_connected`: run `search "<needed integration category>"` again. Use another
  connected result only when it covers the request. Otherwise, for a matching row with
  `status: "not_connected"` — a connector, or an install-backed platform row such as
  GitHub — run `kite-integrations connect <name_slug>` with its exact returned
  slug and emit the `<connect-cta>` from SKILL.md. Follow only the explicit
  exceptions in SKILL.md (currently Slack); never replace a mintable CTA with
  directions to the Integrations page.
- For existing-account and reconnect outcomes, use SKILL.md's single canonical
  **Repair an existing connection** policy; this overlay adds no alternate
  confirmation, cleanup, or retry behavior.
- Report results in user terms ("Posted to #general") with at most a short
  relevant excerpt of the returned data — never raw JSON dumps.
