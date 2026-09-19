# Findings Delivery

Evidence tasks file durable findings in the wiki and return concise results
with caveats, full source URLs, and exact wiki paths. They do not choose or
build the user-facing findings page.

## Select the owner from delivery context

- `conversation` or `subtask`: return evidence only. The CMO or parent owns the
  dependent delivery decision.
- Top-level `standalone`: honor an explicit format or request to avoid a hosted
  page. Otherwise, after verified findings return, create a findings-page
  subtask when the result is a report — one the reader will read again,
  forward, or compare: several findings, entities, or comparisons; a recurring
  review; a decision the evidence supports. A request for "HTML" means a
  hosted page unless the task names a file.
  A lookup or one single-use answer remains concise.
  Wait for all source children, then create exactly one dependent subtask
  assigned to the description that claims hosted findings pages and dashboards
  assembled from other agents' results. Reuse a matching child named on a later
  wake. Finish only after it returns a verified full `http(s)` page URL or an
  explicit publish failure.

In a conversation, the CMO waits for required sources, loads
`work-delivery`, and chooses the delivery format from the actual result. An
explicit format preselects that form. When it selects a hosted findings page,
use the task listing and status commands from `task-operations.md` before
creating one so a matching findings-page task is reused.

## Brief the findings-page task

Give the findings-page builder:

- all source-task results and exact wiki paths as internal context;
- the page purpose — reference, monitor, decision, or tool — and the question it
  must answer;
- the inferred primary reader and, when evident, the person or group they will
  forward it to; the decision each reader needs to make; and the reach of a
  mistake or recommendation (individual, team, company, or external);
- whether the report is one-off or recurring; for a recurring report, the
  stable labels readers use for orientation and what changed since the prior
  edition;
- the required facts, findings, comparisons, and actions, without prescribing
  a fixed number of sections;
- every original source URL and each meaning-changing qualification, caveat,
  and known gap;
- the register: who **we** and **you** are on this page. Unless the task says
  otherwise, **we** is the team publishing the page and **you** is its reader;
  the subject company is named (Kite's Communication rules own this default);
- the team's recorded identity as the default visual brand. Scope another
  company's recorded brand to this page only when the user explicitly asks for
  it; never commission brand extraction as part of report building;
- a stable route or identifier derived from the user request or existing page;
- any named page kind and companion reference the source result identifies;
  for a Brand Gap page, require the builder to read
  `dashboard-building/references/brand-gap-report.md` before building;
- acceptance criteria to use the supplied findings without re-research or
  invented gaps, exclude knowledge/wiki files as sources and process
  narration, publish once, and return the full `http(s)` URL. Omit
  verification instructions; the builder's `dashboard-building` contract owns
  that check.

The same delivery reuses one findings-page task and stable route across
completion wakes, retries, and corrections. On publish failure, deliver the
best concise findings, name the failure, and request correction on the same
task and route, without duplicating the task, suppressing findings, inventing
a URL, or substituting a task page or wiki path for the page URL.

If no findings page was planned, relay the supported result through
`work-delivery`.

## Request website verification

After a user-visible delegated website change, create an audit-only
verification task only when its result lacks verification. Give the website
builder the draft preview URL plus each full page URL and expected state. The
auditor checks the preview in the browser; it cannot clone an unmerged draft.

A hosted findings page is verified by its builder and earns no audit task. Whether
that evidence proves a named change live belongs to the CMO's named-change
condition, with one in-turn fetch as the only fallback; this section decides
whether to create a task, never the sufficiency of the evidence. The delegator
does not add verification criteria, request verification evidence, or re-check
the page.
