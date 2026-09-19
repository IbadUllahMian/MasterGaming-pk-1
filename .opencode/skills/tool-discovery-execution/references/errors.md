# Gateway error recovery

Choose exactly one recovery path in this precedence order:

1. `runTerminal: true` means the run is terminal regardless of `code` or
   `retryable`; never resume that run ID. Use the code only to choose a
   correction, fallback, or fresh run.
2. A resume returning `status: "ERROR"` with `resumeError` means that run
   reference is dead; correct the tool or run ID, never retry that reference.
3. A retryable failure after submitting a state-changing execution can leave
   its outcome unknown. Before applying a retry row, reuse the same idempotency
   value when the inspected schema exposes one. Otherwise use an inspected
   read, list, or status tool to verify the target, and retry only when that
   read-back proves the write absent. If no read-back can settle it, stop and
   report the outcome as uncertain; a blind retry can duplicate a durable
   action.
4. Otherwise apply the matching code row below, choosing HTTP 404 by the exact
   `detail.code`. A retry that preserves a run ID means resume that ID, never
   resubmit the original params.

| HTTP    | code                                       | Action                                                                                                        |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 401/403 | —                                          | Scope or auth is invalid. Check the environment and stop.                                                     |
| 402     | `payment_required`                         | Stop; do not retry this provider in the current run. Use another valid source when one exists, otherwise report that the requested provider result is unavailable. |
| 404     | `application_not_found` / `team_not_found` | The environment scope is stale or invalid. Stop.                                                              |
| 404     | `integration_not_found`                    | Search again and copy a returned integration id.                                                              |
| 404     | `tool_not_found`                           | Inspect the selected integration again and copy a returned tool name.                                         |
| 404     | `missing_creator`                          | The website's ownership record is missing or invalid, so no scope can satisfy the call. Report that state and stop; never retry or re-inspect. |
| 404     | `no_iteration_selected` / `design_spec_not_found` | The tool and the integration are healthy; the website has not written that state yet. Do not re-inspect or retry the same call. What happens next belongs to the requesting domain skill (for website imagery, the `images` skill); with no such skill loaded, report that the website has not written that state and stop. |
| 409     | `provider_not_connected`                   | Search again; connect the matching connector or install-backed platform row (e.g. GitHub) by its returned `name_slug`. |
| 409     | `already_connected`                        | Follow SKILL.md's repair flow only if a later action proves the authorization unusable.                       |
| 409     | `reconnect_required`                       | Follow SKILL.md's repair flow; do not mint a normal connect CTA.                                              |
| 409     | `reconnect_cleanup_required`               | Follow `references/reconnect.md` for legacy-duplicate handling.                                               |
| 422     | `invalid_params`                           | Inspect again; treat a named missing field or shape as authoritative, fix the payload once, and retry once.   |
| 429     | `rate_limited`                             | Back off and retry once.                                                                                      |
| 429     | `gateway_busy`                             | Kite's own execution bound was full; nothing reached the provider. `kite-integrations execute` retries this itself for up to four minutes, so one it still returns means that budget ended: leave the record pending and send it again later. A raw `/tools/execute` request has no such retry: retry it yourself with backoff for up to four minutes before leaving the record pending. |
| 502     | `provider_error`                           | Retry once only when `retryable` is true; preserve any returned run ID.                                       |
| 503     | `provider_unavailable`                     | Do not retry this provider in the current batch; use the next suitable integration.                           |
| 503     | `gateway_not_configured`                   | Use the next suitable search result or fallback; if none exists, explain that the integration is unavailable. |
