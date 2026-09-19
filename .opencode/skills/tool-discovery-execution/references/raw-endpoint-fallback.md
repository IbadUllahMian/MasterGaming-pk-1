# Raw-endpoint fallback (no `kite-integrations` on PATH)

The CLI wraps four POST endpoints under
`$BACKEND_API_URL/api/v1/internal/tool-gateway/tools/` — `search`,
`inspect-integration`, `inspect-tool`, and `execute` — authed with
`Authorization: Bearer $INTERNAL_API_TOKEN`. Bodies
mirror the CLI args, plus the scope field the CLI fills in for you: exactly one
of `"team_id": "$TEAM_ID"` or `"application_id": "$APPLICATION_ID"` (whichever
is set — both is rejected). On the `team_id` path also send
`-H "X-Sandbox-Session-Token: $KITE_SANDBOX_TOKEN"` — the gateway binds the call
to your session's own team and returns 403 for a `team_id` that isn't yours; the
`application_id` path omits this header:

```bash
curl -sS -X POST "$BACKEND_API_URL/api/v1/internal/tool-gateway/tools/execute" \
  -H "Authorization: Bearer $INTERNAL_API_TOKEN" \
  -H "X-Sandbox-Session-Token: $KITE_SANDBOX_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "team_id": "$TEAM_ID",
  "tool_name": "<tool name copied from integration inspection>",
  "params": { "<parameter from inspected schema>": "<value>" }
}
EOF
```

`search` requires `"query"` and rejects integration-name filters or other extra
fields; `inspect-integration` takes `"integration_id"`; `inspect-tool` takes
`"tool_name"`.
`inspect-integration` returns the complete tool catalog in one `tools` array;
it has no cursor or page parameter.
Connection-link minting is a hidden control-plane capability rather than a
catalog tool. If the CLI itself is unavailable, do not guess its internal tool
identifier or send a raw `execute` request with `replace_existing`; that could
bypass the confirmation and duplicate-account safeguards in SKILL.md. Tell the
user this fallback cannot safely mint a connect or reconnect CTA and direct them
to Integrations instead.
Use `<<EOF` so scope variables expand in the JSON body; a quoted terminator
would send the literal string `"$TEAM_ID"` and cause a 422 UUID-parse error.

Response: `{ "tool_name": "…", "status": "success", "result": {…}, "latency_ms": 1843, "warnings": [] }`. A non-empty `warnings` list is the gateway telling you the successful `result` is not what it looks like (for example a provider placeholder standing in for a real value); read it before using the result. The stable gateway wrapping rules are: `composio:*` places the provider value in `result.data`, `pipedream:*` in `result.ret`, while `native:*` and `mcp:*` expose the selected tool's own result shape inside `result`. Save and inspect the actual response before using fields; the namespace tells you only where the tool-owned value begins, not that value's schema. Slack delivery is owned by `slack-messaging`; GitHub uses the stable `kite-github` CLI (`references/github.md`).
