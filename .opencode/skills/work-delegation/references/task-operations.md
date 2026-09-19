# Task Operations

## Conversation context (`THREAD_ID`)

A user follow-up is not automatically forwarded. Reply directly for questions
or status requests. For website changes, select the destination under Website
draft ownership below before choosing a task or comment. For other changes to
delegated work, identify the task with
`kite-tasks list` or `kite-tasks status "<task_id>"`, then interrupt it with
`kite-comments create "<task_id>" "<markdown>"`. Create a new task for a
separate outcome.

For a new task:

1. Run `kite-tasks agents` and choose the agent whose description claims the
   task's requested final artifact (your routing rules). Pass its exact `name`.
2. Resolve a website the task targets or serves through the parent skill.
3. Create the task through the file transport below.
4. Add `--initiative-id "<initiative_id>"` when the work advances that
   initiative. Every task for it carries the id returned by
   `kite-initiatives create` or `list`.
5. Add `--retry-of "<original_task_id>"` when replacing or correcting a
   finished, failed, or dead attempt.
6. Add tags when applicable.

Use `list`, `status`, and comments only for tasks created from this
conversation. Other conversations continue their own work.

### Website draft ownership

Each task delivers one requested outcome. Its draft groups that work for review
and publication; a conversation can have several such tasks.

**Routing evidence.** Before mutation, read `kite-tasks list` and
`kite-websites list-drafts "<website_id>"`; use task status for missing scope or
state. Failed listings or truncated draft output leave ownership uncertain:
report that and stop.

**Choose a destination.** Apply the first matching rule.

1. Explicit independence or separate review starts a new task from Main.
2. Additions outside existing task briefs, including new pages, features, campaigns,
   or content blocks, start new tasks from Main unless the user explicitly asks to
   put that work in a particular task or draft. Viewing a draft or naming it as a
   source, comparison, or inspiration supplies context, not that exception.
3. A request to continue or edit a named task or draft selects it over the viewed
   draft. For a named draft, match its title in the listing and use `owner_task_id`
   from that same row. A conflicting viewed draft supplies only the edit location;
   it does not make the explicit destination ambiguous.
4. With no explicit destination or such addition, a point-and-edit refinement
   selects the viewed draft. Point-and-edit on Main identifies only the edit location.
5. A refinement of one earlier task's requested outcome selects that task.

Task descriptions establish scope; a shared website, generic title, or permission
to continue establishes no intent to reuse its draft.

If the user refers to existing work without identifying one destination, ask
which task or draft they mean before any mutation. When several tasks fit, ask
rather than choosing the closest match. If it is unclear whether the request
refines existing work or starts a new outcome, ask that distinction. Otherwise,
create a task for the new outcome. When you ask instead of mutating, end the
reply with the line `DEPENDENT_TASKS: none — asked <which task or draft>`; the
platform removes it before delivery and reads it as the destination settled.
Every other outcome that mutates nothing records the same way (below); without
the line, the platform reads a change request that created and continued
nothing as unsettled and reopens it.

**Continuation.** Follow the selected draft's `continuation_action`:
`comment_on_owner_task` permits `kite-comments create "<owner_task_id>" "<markdown>"`
only when `can_continue_in_this_chat` is true. For `open_origin_conversation`,
return `origin_conversation_url`; for retry or unavailable work, relay `reason`
and the required user action. These alternatives create no task or comment, so
end the reply with `DEPENDENT_TASKS: none — <sent to origin conversation |
owner needs retry | owner unavailable>`.
Explicit continuation before a local task produces its first draft also comments
that task. A completed task without a live draft is finished work; new changes
start a new task.

**Independent work.** Give each new task a self-contained brief explicitly
starting from Main in its own draft, without another task's unpublished changes
or dependencies on another conversation's work.

## Task context (`TASK_ID`)

Create a bounded subtask when specialization, progressive discovery,
parallelism, context size, or failure isolation materially helps. A piece one
tool call or one step resolves stays inline unless a mandated fan-out rule says
otherwise.

Use an assignee named by the task instructions. Otherwise choose the agent
whose description claims the subtask's requested final artifact (your routing
rules). Pass its exact name. Every create requires an explicit assignee;
omission is invalid.

Resolve a website the subtask targets or serves through the parent skill before
creation.

After creating children, continue only work that does not depend on them;
otherwise checkpoint the result and end the turn. The platform wakes the parent
when a child changes, so yield instead of sleeping or polling. A mandated
fan-out remains a child-task requirement; yielding does not convert it to
inline work.

A task cannot schedule future work. Put later sends, measurements, or re-checks
in the result for the delegator to schedule.

## Create transport

Write title and description files with single-quoted heredocs, then run:

```sh
cat > /tmp/task-title.txt << 'EOF'
Approve launch budget
EOF
cat > /tmp/task-description.md << 'EOF'
# Budget

Approve $2,500.
EOF
kite-tasks create --content-files /tmp/task-title.txt /tmp/task-description.md "<assignee_agent>"
```

This form is required for user text, Markdown, dollar amounts, backslashes, or
newlines. Do not put task content directly in command arguments. If creation
fails with `valid_agents`, retry once with an exact name: conversation agents
refresh `kite-tasks agents`; task agents use the names and descriptions in the
error.

Confirm the create output contains a non-empty task identifier. Without one,
report that the task was not created. With one, the reply announcing the
delegation brings back your read of the work in the business's own facts —
what it will settle, what you are assuming, what would change the answer —
not the delegation itself. Example (placeholder facts): "What I want out of
this is whether Countwell actually beats us on price for restaurant clients,
or just looks cheaper before the add-ons. That decides whether we lead with
price or with the specialization. I'm assuming Austin stays the market; flag
it if you're thinking wider." "I've created a research task" describes your
process, not their business. Name the assignee only when the user asks; the
Tasks page already shows assignments.

For a comment, write Markdown to a file before passing
`"$(cat notes.md)"`.

### Website-draft correction payload

When relaying a user's correction to an existing website draft, put this JSON
block in the task comment. It is the shared handoff for conversation and task
agents; draft ownership above still decides whether a comment is permitted.

```json
{
  "user_message": "<complete user message, verbatim>",
  "draft_id": "<selected draft id>",
  "preview_url": "<observed preview URL for that draft>",
  "page_route": "<affected page route>",
  "selected_element_context": null
}
```

Each value is a string or `null`; `user_message` is a required string. Encode
valid JSON: escape quotes, backslashes, and line breaks inside strings. Verbatim
means the decoded message equals the source text, including its quotes and
line breaks. When selection
context exists, copy it into `selected_element_context` verbatim, including
any **Current Page:**, **Tag:**, **Text:**, **Parent Tag:**, and **Parent Text:**
markers. Source draft details from the selected draft's listing, task result,
and page context; use `null` for unavailable values instead of guessing. A
different viewed draft's preview is not the selected draft's preview.

Keep prior approved scope constraints outside the block. Any interpretation
follows it under **Delegator reading (inference)**; it cannot replace the quote,
establish a visual defect, or authorize changes the user did not request.
Before sending, check that the JSON contains all five fields with the stated
types, compare their decoded values with their sources, and confirm the comment
targets the selected draft's owning task.

## Tags

1. Tag marketing deliverables with the one or two best keys; omit tags when no
   key fits.
2. Use only these curated keys: `content`, `seo`, `paid-ads`, `social`, `email`,
   `creative-design`, `web-landing`, `analytics-reporting`, `pr-comms`,
   `experiment`.
3. Pass comma-separated keys as `--tags "<keys>"`, for example:
   `kite-tasks create --content-files <title_path> <description_path>
   "<assignee_agent>" --tags "content,seo"`. Optional flags may appear in any
   order.

## Read status (`THREAD_ID` only)

Only `kite-tasks status` provides meaningful `seconds_since_last_activity`;
the field is always null in `list`. A live run refreshes it every 5 minutes.

For an explicit task-link request, `kite-tasks status "<task_id>"` returns the
canonical platform URL in `details_url`. The field is always null in `list`.
A null `details_url` from `status` means no canonical task link is available;
do not construct one.

- Under `900`, or null with `updated_at` less than 15 minutes old: report the
  task as underway.
- `900` or more, or null with an older `updated_at`: report the inactivity and
  possible stall. With user approval, send one status-check comment, then read
  status again about 5 minutes later. If activity did not resume, offer a fresh
  task linked with `--retry-of`.

A task already marked `failed` and requiring manual retry restarts only on the
user's explicit request; never retry unasked. When the user asks you to retry
it in this conversation, run
`kite-comments create --retry "<task_id>" "<markdown>"` yourself, and claim a
restart only when the response has `"retry_authorized": true`. A comment
without `--retry` is queued but does not restart the task, and cron or system
turns cannot retry it. If the `--retry` command fails, the retry did not start:
say so, and ask the user to post a comment on the task themselves (open Tasks
and select it by title) — that is the fallback, not the first step.
