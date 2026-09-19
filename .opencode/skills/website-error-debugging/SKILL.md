---
name: website-error-debugging
description: >
  Use this skill when a generated website fails to build, deploy, start, or
  render — for example "check the logs", "the site is blank", "the page returns
  500", "restart the server", "the verifier timed out", or "fix the deploy".
  Diagnose from service logs before changing code; use
  `website-change-verification` after the underlying failure is repaired.
mode: sandbox
---

# Website Error Debugging

The Kite sandbox exposes only agent-owned website processes through PM2. Platform-private processes are intentionally in a separate daemon and are not visible from the coding agent account.

Valid process names:

- `frontend` — the Vite dev server, **HTML-template apps only**. Next.js apps have no `frontend` entry; their dev server is `nextjs-main` (after design selection) or `nextjs-iter{1,2,3}` (before). Run `pm2 list` if you are unsure which kind this app is.
- `backend` — the Fastify app server
- `nextjs-*` — inspect logs only when diagnosing iter dev servers. The platform manages the `nextjs-*` dev servers (HMR + bounded autorestart); do not restart them.

Caddy is user-owned platform plumbing in a separate PM2 daemon and is not visible from the coding agent account.

Use raw `pm2` commands directly — no wrapper needed. If `pm2 list` does not show a platform process such as `metadata-proxy`, that is expected; do not try to switch users or override `PM2_HOME`.

## Fetch recent logs

```bash
pm2 logs frontend --lines 100 --nostream --raw
pm2 logs backend --lines 100 --nostream --raw
```

Flags:

- `--lines N` — how many recent lines (default 100; max you should ask for is ~2000 to avoid flooding context)
- `--nostream` — return a snapshot and exit instead of tailing
- `--raw` — skip PM2's framing so output is the raw app log
- `--err` — stderr only (use when hunting errors)

Output is plain text to stdout. An empty response means the process has not yet produced output.

## Restart a process

```bash
pm2 restart frontend
pm2 restart backend
```

Use after:

- editing a config that the process reads at startup
- recovering from an obvious error state you just fixed
- the process has died and needs to come back up

Do not restart repeatedly without reading logs between attempts — that hides the underlying cause.

**Next.js apps:** there is no `frontend` to restart (`pm2 restart frontend` will error). The `nextjs-main` / `nextjs-iter*` dev servers pick up code changes via HMR and a Next.js config change auto-restarts the server; the platform owns their lifecycle with bounded autorestart. Inspect their logs to diagnose, but do not `pm2 restart` them. `pm2 restart backend` still applies.

## When to reach for this skill

- QA or runtime verification fails and you need the tail of `backend` logs to see the error.
- A verifier returns `unsure` (readiness-gate timeout) or reports console errors or a `runtime error:` miss — read the dev-server logs (`nextjs-*` for Next.js apps) to find the exception before re-dispatching.
- A file change should have been hot-reloaded but isn't reflected — restart `frontend`.
- The agent is uncertain whether a process is alive; run `pm2 logs frontend --lines 5 --nostream --raw` (or backend) and check for recent output.

## What NOT to do

- Do not run `pm2 logs` without `--nostream` — it tails forever and hangs the agent turn.
- Do not invent process names; only the agent-owned processes listed above are in scope.

## Forbidden pm2 operations

Limit pm2 use to the two operations above (`pm2 logs --nostream` and `pm2 restart` of `frontend`/`backend`). The following operations are out of scope for the agent — they manage platform-owned processes or rewrite PM2 daemon state, and the platform restarts those itself when needed. If a task appears to require one of these, stop and report the request as out of scope.

- `pm2 start`, `pm2 stop`, `pm2 delete`, `pm2 restart` of any process other than `frontend`/`backend` — including `metadata-proxy`, `or-metadata-proxy`, `opencode-metadata-proxy`, `codex-metadata-proxy`
- `pm2 kill`, `pm2 resurrect`, `pm2 reload`, `pm2 reset`
- `pm2 save`, `pm2 set`, `pm2 unset`, `pm2 startup`, `pm2 unstartup`
- Any indirect form of the above (`pm2 list | xargs pm2 delete`, etc.)

## Imported repo deploy/build failures

When a repo imported or connected from GitHub fails to build or deploy, make the
smallest possible set of changes that produces a clean production build while
preserving the repo's framework, directory structure, and application code. Do
not restructure an import into the generated-app layout; that is an editability
migration. Do not use this path for ordinary edits to Kite-generated sites; use
the relevant website editing skills instead.

1. Read the host prompt's **Protected files** list before choosing any fix. Every
   host that loads this skill provides that canonical, exhaustive boundary; do
   not substitute or restate a partial list. You may read protected files, but
   you must not edit them.
   - **Deliberately unprotected lockfiles:**
     - `package-lock.json`, `yarn.lock`.

   These two lockfiles are intentionally outside the host deny set; they are
   not a partial protected-file list. The platform owns dependency installation.
   Delete one of these editable lockfiles only under the `pnpm-lock.yaml`
   precondition in **Gotchas**; otherwise keep it. Do not run package-manager
   install commands. Platform provisioning supplies the declared dependencies
   to the repair surface. If `node_modules` is absent,
   first inspect any provisioning error already surfaced in the run context or
   the applicable `nextjs-*` PM2 log. Report that concrete error when it is
   available. If no install diagnostic is exposed, say that the cause cannot be
   determined from this surface and report the missing dependency tree as a
   plain blocker. Do not attribute the failure to application code or to the
   platform without evidence, and do not install dependencies yourself. This
   branch is terminal: stop this skill here without running the production
   build or attempting an application-code fix. Give the requester an
   actionable recovery: include the concrete provisioning diagnostic when one
   exists and ask them to retry the repository sync or re-import so the
   platform-owned install runs again; never replace that action with an install
   command.
2. Run the production build the framework uses (`next build` for Next.js;
   otherwise the `build` script in `package.json`). Treat the build output as
   the source of truth for what is broken.
3. For each build blocker, check the proposed target against the host prompt's
   **Protected files** list. Apply the smallest fix only to an editable path:
   prefer an editable framework-config fix, then a narrow application-code fix
   when the correct change is unambiguous. When the correct fix belongs in a
   protected path, do not edit it; report the exact platform change needed. For
   a dependency or version change, include the exact `manage_dependencies`
   payload (`add=[...]` and/or `remove=[...]`). Have a team owner or admin apply
   it from the owner/admin main-site chat surface, then start a new repair run.
   The mediated tool is unavailable to task agents, non-owner main threads, and
   draft threads.
4. Check the framework is auto-detectable by the host: a `build` script in
   `package.json`, plus the framework's config file and/or its dependency
   declared in `package.json`. `manage_dependencies` can add or remove packages
   but cannot edit scripts or other manifest metadata. If the dependency is the
   missing piece, use the Step 3 handoff. If a script or other metadata in the
   locked `package.json` is missing or wrong, give the requester the exact JSON
   change and tell them to apply it in the source GitHub repository, sync or
   re-import that revision, and start a new repair run. This surface cannot
   apply or delegate that manifest edit; do not call it a platform change.
5. Surface required build-time env vars (for example `NEXT_PUBLIC_*`) as empty
   placeholders in the app's env settings rather than hardcoding values.
6. Re-run the build after each change set. Finish as repaired only when the
   build succeeds. If a protected-file change is the only remaining blocker,
   record that blocker and the exact change required, leave the build acceptance
   criterion unsatisfied, and do not describe the site as repaired or deployed.
   Report every file you changed and why; before finishing, confirm the report
   covers each changed file and each platform change you requested.
7. Stop and report when a blocker needs an application-logic decision, a missing
   secret, or a structural change beyond config.

Gotchas:

- Repo-level hosting config is platform-denied and is not a fix vehicle. The
  deploy pipeline also replaces repo `vercel.json` / `vercel.ts` at deploy time.
  Put compatibility fixes in editable framework config or application code;
  report any required protected-file change through the Step 3 handoff.
- The platform installs and deploys imported repositories with pnpm. When
  `pnpm-lock.yaml` exists, keep it and delete any stray `package-lock.json` or
  `yarn.lock` directly; those two files are not protected. When no pnpm lockfile
  exists, do not delete an npm or Yarn lockfile merely to choose a package
  manager: the platform owns pnpm compatibility and lockfile regeneration.
- `output: 'export'`, `basePath`, `assetPrefix`, and `output: 'standalone'`
  change routing/output. Keep them only if the build needs them and they match
  how the site is served.
