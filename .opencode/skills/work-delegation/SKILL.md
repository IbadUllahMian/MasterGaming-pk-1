---
name: work-delegation
description: >
  Use this skill to decide whether to execute, delegate, or decompose work, and
  then to: create, update, track, decompose,
  or complete a task or subtask; resolve the website a task targets or serves;
  package
  findings for delivery; or write a task result. Decomposition includes work
  that fans out across a population ("for every X, find Y" or "find N qualified
  Xs matching these criteria"). Agent descriptions and routing rules decide
  whether to delegate and which agent receives the work. For an unmatched or
  brand-new website, use website-setup in a conversation and the task-execution
  instructions in a task.
mode: sandbox
---

# Work Delegation

Delegation succeeds when the platform records a bounded, executable task and
its result reaches the caller. This skill owns those mechanics after routing
has selected an assignee.

## Context contract

- `THREAD_ID` means conversation context. `kite-tasks agents`, `create`,
  `list`, and `status`, plus `kite-comments create`, are available.
- `TASK_ID` means task context. Task agents may create subtasks and use
  `kite-comments create` under the task-execution protocol. They cannot use
  `kite-tasks agents`, `kite-tasks list`, or `kite-tasks status`.
- Task agents have `TASK_DELIVERY_CONTEXT`: `conversation`, `subtask`, or
  `standalone`, based on who receives the result. They also have
  `set-task-result`; use it whenever their result changes.

If neither id is present, do not improvise a task workflow. Report that the
delegation context is unavailable.

## Source missing context; do not stall

A fact the work needs but the requester did not supply is itself work, never a
reason to stop. Resolve it in this order:

1. For any information the requester did not supply, read the team wiki before
   consulting another source or asking anyone.
2. If the wiki does not resolve a fact the work can establish (which events
   qualify, which companies match), make it the first task — an enumeration or
   definition task — or a parameterized brief item per
   [`references/task-brief.md`](references/task-brief.md).
3. Ask the requester only for a consequential preference or approval no source
   can supply, under `tool-discovery-execution`'s material-intent gate — with
   `THREAD_ID` directly; with `TASK_ID`, through the task result.

When the outcome is resolved, create the tasks without asking for confirmation
of ordinary implementation choices. A repeat request for context covered by
1 or 2 is a delegation failure, not diligence.

## Load only the applicable contract

- Before creating, commenting on, updating, or checking a task, read
  [`references/task-operations.md`](references/task-operations.md): use your
  context's section and the shared transport. Its conversation section owns
  website-draft selection before delegation.
- Before splitting work — and, when an applicable domain skill defines a task
  graph for this work, before gathering any evidence for it — read
  [`references/decomposition.md`](references/decomposition.md). Its population
  and research rules apply only when those shapes occur.
  It also owns the keyed comparator fan-out section: the graph for researching
  a fixed roster of companies or events one member at a time and integrating
  the results.
- Before writing a task title or description, read
  [`references/task-brief.md`](references/task-brief.md).
- Before handing off findings, commissioning a findings page, or requesting a website
  verification pass, read
  [`references/findings-delivery.md`](references/findings-delivery.md).

Do not load an unrelated reference merely because it exists.

## Resolve the target website

For work aimed at one website—including copy or content for it—run
`kite-websites list`.

- For the requested destination, an explicit site name, URL, or description
  wins: match its name, the URL's bare hostname, or description against each site's `name`,
  `tracked_domain`, `connected_domain`, `canonical_domain`, and `deployment_url` host.
- With no explicit destination, match the page-context `website_id`.

A deictic source reference keeps the viewed page or selection as source even
when its site differs from the destination. Unreferenced conflicting page
context is neither target nor source. The listing—not the wiki—decides
ownership; cross-check even external-looking URLs.

- One match → name its `website_id`, listing name, and domain in the task.
- Several matches → with `THREAD_ID`, ask which site; with `TASK_ID`, report
  matches and stop.
- Listing errors or times out → with `THREAD_ID`, ask for the URL; with
  `TASK_ID`, report and stop. Unresolved ownership is not external ownership.
- None → inspect the requested artifact; route read-only work normally. For an
  import, change, empty listing, or new site, load `website-setup` with
  `THREAD_ID`; task execution owns `TASK_ID`.

## Record a task result

Task results use file transport because shell arguments can reinterpret user or
generated text. Write both files under `/tmp` with single-quoted heredocs, then
run:

```sh
cat > /tmp/task-summary.txt << 'EOF'
Approved the $2,500 launch budget.
EOF
cat > /tmp/task-result.md << 'EOF'
# Budget

Approved $2,500.
EOF
set-task-result --summary-file /tmp/task-summary.txt < /tmp/task-result.md
```

The summary is one required past-tense sentence. The Markdown body is the full
result. Do not put these scratch files in `$TASK_ARTIFACTS_DIR`;
`set-task-result` copies their contents into the canonical result files.

## Completion

Before returning, verify the applicable observable outcome:

- Every create output contains a non-empty task id. Without one, the task was
  not created; report the failure instead of describing it as underway.
- Every task brief is self-contained, and every create command passes an exact
  assignee.
- Every parent accounts for each required child result or names the blocked
  slice.
- Every changed task result was recorded through `set-task-result`.
