# Writing the Task

The assignee receives the title and description, not the conversation.

## Turn the request into useful work

Users describe what they want in ordinary language, not a complete
specification. Build an executable brief around their intended outcome:
resolve shorthand, infer reasonable details, and strengthen the work with
supporting material that helps them judge or use it. Acceptance criteria
describe a successful, useful result; they need not each repeat something the
user explicitly said. Supporting material belongs when it helps evaluate or use
this outcome within its explicit constraints and authority. Independent follow-on
projects are proposed separately. For task agents creating subtasks, the parent
assignment supplies that outcome and authority; a child cannot expand either.

Preserve explicit constraints and distinguish confirmed facts, inferred intent,
and assumptions. An assumption can guide work without becoming a claimed user
preference or an invented fact. `tool-discovery-execution` owns which unresolved
choices need clarification and which work can proceed while an answer is pending.
Carry consequential open questions and the work they affect into the brief.

For qualitative requests such as `top`, `best`, or `most relevant`, explain
what makes the result useful and let the specialist determine appropriate
depth. Add a bound when it serves a real constraint, not to make the brief
look precise. Agent and skill descriptions select the owner; the specialist's
own skills supply the production method. Use verified context to tailor the
outcome and its supporting material to this person's situation.

Make the brief executable in isolation:

1. State one outcome and its purpose, in the user's own terms.
2. Inline every user-supplied input and prior result: the user's own words,
   source data, URLs, names, prior task results, and the constraints and
   exclusions they stated. Never refer to "the list from earlier." An assignee
   able to re-find something is not a reason to omit it — what it finds may not
   be what the user supplied. Shared context the assignee reads for itself, the
   team wiki above all, is summarized or pointed to instead of copied.
   For website work, carry destination `website_id`, listing name, and domain.
   Carry a destination `draft_id` only when selected under `task-operations.md`.
   For a deictic source, also carry its full page context as source context:
   `website_id`, `draft_id`, route, and any selection.
   For external sites, carry the no-match verdict. Resolve before naming any
   site or URL.
3. Give observable acceptance criteria for the intended outcome and its useful
   supporting material. Preserve quantifiers such as `all`, `top`, or `highest` as written and name the
   population evaluated. Never weaken exact scope to "up to," "available," or a
   sample; require the result to report an unmet criterion.
4. Preserve the delivery intent selected under `work-delivery`. Name a
   file, artifact, download, attachment, export, or task page only when the user
   requested that format, the conversation selected it under that policy, or a
   platform contract requires it. A bare request for findings, copy, comments,
   a table, analysis, recommendations, or structured data does not itself
   request a storage format. A selected static file or connected document stays
   with the specialist whose function owns its content; name its format,
   audience, destination, and intended reuse. For a task file, require only the
   selected user-facing deliverable to be marked for delivery under the task
   protocol.
   Website changes return a reviewable draft and its preview link, not a live
   URL; publishing is a separate, explicitly requested step. Findings follow
   `findings-delivery.md`.
5. Preserve user-provided numbers, schedules, names, and identifiers verbatim.
   Mark unknown dependencies as unknown and require parameterization or a
   question through the task result; never guess identifiers.
6. For implementation work — code, scripts, configuration, or another
   executable artifact — applied outside Kite, name who applies it and what
   they can run. A non-technical consumer needs the finished implementation and
   plain-language apply steps, not only a CLI runbook. This does not turn
   findings, copy, comments, or tables into file requests.
7. Results return only through `set-task-result`. Do not instruct delivery by
   chat or email. This does not prohibit an outbound send that is itself the
   explicitly authorized work.
8. Anticipate the people evidence that makes company deep dives, competitor
   research, and event research directly actionable. Unless the user excludes
   people, carry the supporting people outcome defined by the owning research
   skill: company and competitor leadership, or relevant event speakers and
   sponsor-company contacts. This supporting evidence does not expand the
   requested company or event population, change the delivery format, or
   prescribe the specialist's method. A narrow company question does not
   become a deep dive merely to add people.
9. When the outcome includes people, require one row per person with name,
   current title, company, LinkedIn or profile URL, source URL, and professional
   email when found. Preserve every returned provider qualification that affects
   use, including verification or deliverability status and independent
   catch-all, risky, or conflicting flags. A missing address stays in the row
   with the enrichment capability's outcome — a public-source miss is not one;
   a company contact page is supporting context, not a substitute. Exclude
   personal data, not qualified professional results.

For a partially completed list, carry the complete accepted rows and their
required fields, rejected candidates and reasons, and the remaining target.
Names and counts alone lose the work already done. Require the continuation
to return the combined, deduplicated result, preserving accepted rows unless
new evidence disqualifies them.

For an unspecified Report structure, preserve the requested content and let the
builder choose the smallest structure that communicates it. Apply the supporting-
material boundary under "Turn the request into useful work" above.

## Route moves

For a move or rename of a website route, carry an old-URL decision. Default to
redirecting the old URL to the new route (the builder writes `redirects.csv`);
otherwise carry the requester's explicit choice that the old URL stops
resolving, or that a separate new route is created while the old one remains.

For a route created earlier in the same request, state that no redirect is
required. With `THREAD_ID`, ask only when the request is ambiguous about
whether the old URL should keep working. With `TASK_ID`, apply the default
unless the task states another decision.

## Preserve method ownership

State the outcome and domain context, then leave method selection to the
assignee: their available skill descriptions route the method, and a pinned
method overrides that routing — a brief that pins the wrong skill sends the
specialist down the wrong lane with no way to recover (observed: an audit brief
pinning generic research kept the assignee off its audit method entirely).

Name a method skill only when an applicable domain contract explicitly requires
it. Carry that requirement in the smallest child that needs it; do not copy it
to every child.
Company-profile and split-onboarding routes belong to the assignee's platform
prompt. Multi-company comparison routing belongs to `competitor-research`.
Point the assignee to the owning contract instead of copying its procedure into
the brief.

For integration-backed work, limit integration-specific brief content to the
connected integration and requested resource or capability; omit provider
tools, schemas, parameters, preflight data from catalog or connection checks,
and eligibility claims. Prior task results still follow the inlining rule
above. The assignee owns tool selection, resource-access checks, and
live-versus-static eligibility. Name the integration as the first route to
try because it is connected, not because its capability is verified, and do
not make it exclusive. An exclusive route or pre-accepted limitation bypasses
`tool-discovery-execution`'s unconnected-candidate handling and prevents a
connection offer.

## Tagging the Task

Tagging mechanics live in `task-operations.md`; do not invent keys in the
brief.
