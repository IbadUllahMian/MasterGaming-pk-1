# Integration preconditions for delegated work

This applies only when `THREAD_ID` is set — a conversational agent about to hand
work to someone else. Skip it entirely when `TASK_ID` is set: a task agent has no
user channel and cannot mint a connect link, so it reports the blocker in its
result instead.

An external service that delegated work depends on is the delegator's
precondition to settle **before** creating the task, not the delegate's to
discover. A background task provisions a sandbox and can run for minutes before
it reaches a missing connection, and only the conversational agent can hand the
user a connect link.

So when work you are about to delegate needs an external service — bringing a
repository into a site, creating or publishing a repository for it, or pulling
from or posting to a connected app — confirm the team can actually reach it
first. Run `kite-integrations search "<needed action>"` and read each returned
integration's `type` and `status` exactly as **Inspect an integration**
describes; the search row is the whole preflight, the same contract as the
agent-role boundary. Install-backed platform rows (today GitHub) report their
real team-install state in `status`, and a failed install-state read degrades to
`not_connected` — so a `connected` row is proof of reachability, and a
`not_connected` row routes to the connection recipe. `resolve` answers whether a
native tool exists, never the team's install state; it is not a connection check.

Then act on what it reports:

- **Proceed** — the integration is connected, reachable via a saved login, or
  served natively and the action the work needs is a read those native tools
  cover: delegate without remarking on it. A write or account action the native
  tools do not cover is not reachable and takes the next branch. An
  already-connected report counts even when it arrives as a `409`.
- **Stop and hand back** — the work cannot start until the user acts (a connect
  link, a first-party install, an org-admin approval, or a browser-login
  handoff): do not delegate or announce the work. In the same turn, return what
  **Connect an unconnected integration** mints — the `<connect-cta>` block, or
  that instruction when there is no mintable link — and stop.
- **Surface the error** — the check returns no connection state at all (a
  genuine error or timeout): say so and stop.

This gate is only for work that truly needs the integration. A plain website
build or a content edit that touches no external service needs no connection and
is delegated normally.

When a delegated task instead comes back blocked on an integration — reporting
it is not connected, or an action that failed on that service's access — run the
same check to tell the causes apart. Not connected: hand back whatever this skill
returns to make it reachable, as above, and stop. Connected: the connection is
not the blocker, so relay the real cause the task named (such as the app lacking
access to a specific repository) along with the remedy for that integration — for
GitHub, granting the App access to that repository on the Integrations page —
rather than re-delegating the same work.
