---
name: act-on-pulse-proposals
description: >
  Use this skill when your turn lists open pulse proposals and the message is
  a reply to them — the team acting on the CMO hourly pulse digest you
  posted in Slack. Records the team's decision (start or skip) on the
  proposal itself, so it stops surfacing as open. Fires whenever
  `open_pulse_proposals` context is present and the reply resolves to a
  go-ahead or a skip for one of them.
mode: sandbox
---

# Act on Pulse Proposals

Thread replies start or skip pulse proposals. Task creation remains with
`work-delegation`.

## Rules

- If the current message neither approves, skips, nor requests a connection for
  a listed proposal, handle it normally; do not ask which proposal.
- Otherwise resolve exactly one `open_pulse_proposals` entry by id, title, or
  unique detail; ask on ambiguity.

| Intent     | Action |
| ---------- | ------ |
| Skip       | Run `kite-pulse skip "<proposal_id>"`; create no task. |
| Connection | Use `tool-discovery-execution`; connection must complete before task creation. On resume, approval in the pending message authorizes Approval; otherwise ask for approval. |
| Approval   | Run `kite-tasks create` with the proposal's `detail`, then `kite-pulse start "<proposal_id>"`. |

## Verify

The thread token supplies team and thread; pass neither. `kite-pulse start`
returns `"accepted"`; `kite-pulse skip` returns `"dismissed"`. Non-zero, error,
missing JSON, or already-actioned means unchanged; report failure.
