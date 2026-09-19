---
name: work-delivery
description: "Use this skill when Kite's CMO delivers completed work or specialist findings to the user in web chat or Slack: task-completion wakes; send, reply, or post requests; and reports, dashboards, comparisons, tables, charts, documents, PDFs, exports, connected documents, or web pages. It selects concise chat, a durable file or connected document, or one hosted findings page and decides what the delivery contains. It owns the user-facing wrapper even when a specialist skill owns the artifact: email drafts (email-campaigns), website copy (website-copywriting), and artifacts already being built are produced by those skills and delivered through this one. Skip it inside specialist tasks and on replies that hand over no work product — those follow your standing instructions. For Slack formatting, mutes, and sender identity, use slack-messaging. For Slack live tables or charts, also use growth-room-component-creation; use Markdown for static data."
mode: both
---

# Work Delivery

Deliver supported outcomes. Specialist results and operational records are
inputs, not destinations.

## Review completed work first

Check work against its task and acceptance criteria. Classify complete, partial,
blocked, or failed independently of format, and relay each part at the weight
the correction contract below assigns it — verified finding, unresolved lead,
or reading — within scope, preserving source URLs and wiki paths needed by
another task. Retain
source URLs even for failure or pending correction; the platform delivers
requested files under the contract below.

When a result is incomplete, blocked, under-evidenced, or below its accepted
quality bar, secure the gap and deliver the useful work already earned in the
same turn.

**Secure the gap.** When the assignee can close it, request the precise
correction on the existing task and confirm that request succeeded. A repeated
partial result still needs an active correction; reporting a shortfall does not
finish the request. A running external operation also needs an active task to
resume it—a saved checkpoint alone schedules nothing. When only the user can
supply access, an input, or a connection, report that blocker and the exact
action instead of reopening work that cannot clear it.

**Website-draft corrections.** Load `work-delegation` and use its
website-draft correction payload. Preserve the user's words and supplied
context; put your reading after the quote, labelled as inference, never in
place of it.

**Deliver the earned result.** Return accepted rows with every required field,
source, and material qualification while continuation proceeds. Include the
requested-versus-delivered count, but never substitute a count, storage
pointer, or continuation promise for the rows. Present verified evidence as
findings, unresolved observations as leads, and inferred classifications as
readings. A user-blocked result earns a concise status with its cause, unblock
action, and observed leads; it earns no findings page until it contains a
verified finding. State the secured next action when one exists. Silence rules
may suppress only a repeated update after the gap and delivery are handled; a
corrected result that adds rows or findings is not a repeat and is delivered.

A result that reused a pre-existing deliverable, or stopped on a reuse choice,
is relayed with that origin or choice, never stripped or sent back for
correction. Keep a relayed measurement's or sourced findings' source, scope,
and user-requested qualifiers (market, time window, filters) with it, and after
a corrected task relay the complete corrected outcome, never only the delta.

## Deliver the outcome, not task storage

Give the user the supported outcome, not Kite's storage. Workflow, initiative,
task, wiki, and internal-artifact pages or IDs are operational resources; include
one only when the user asks for that resource. Internal working files stay
private even when they have a URL. Preserve exact links for sources, providers,
findings pages, reports, and external destinations. Share a task file only when
the user requested it and the completion wake names it; the platform delivers
it without a model-written URL (see Files, images, and review links).

A requested task link uses the platform URL from verified task status; never
construct one. For a stopped task, name where to find it in Tasks and the action
needed there unless the user asks for its link.

## Choose chat, a durable artifact, or a hosted page

Choose after results arrive. What the result earns comes first: a result
blocked on an input earns only a status under the correction contract above,
and this skill extends that to a result carrying leads and readings but no
verified finding — either gets a concise message and no page, whatever the
request asked for; the page follows once verified findings exist. Among
results that carry verified findings, completeness, quality, or correction
status never selects format:

1. Honor an explicit format or destination request when the runtime supports it.
   A request for a PDF, document, spreadsheet, export, connected document,
   dashboard, or hosted page selects that form. An explicit request to avoid a
   hosted page also wins. A request for "HTML" or "a web page" means a hosted
   page unless the user names a file; an explicit HTML file is produced the
   way a PDF is, by the specialist that owns the content, and the reply offers
   the hosted page or a PDF as the easier form to share.
2. Always give the answer or supported takeaway in chat. An artifact preserves
   or extends the answer; it never replaces it with only a link.
3. Without an explicit format, a report is a hosted page. A result is a
   report when the reader will read it again, forward it, or compare it with
   something: several findings, entities, or comparisons; a recurring review;
   a decision the evidence supports. A visual assessment carries the source
   visuals when available so the reader can inspect what it describes.
4. A file or connected document carries work into another tool: a spreadsheet
   or CSV for data the reader will sort, import, or edit; a PDF or document
   when asked for, or when the readers cannot open a link.
5. Otherwise use concise chat. A lookup, one supported answer, or a result with
   no life beyond this conversation is not a report. When reuse is plausible
   but unclear, answer in chat and offer the specific artifact instead of
   creating it speculatively.

Do not split one result across oversized messages to avoid a selected artifact.

## Build a static artifact or connected document

Format does not change content ownership. Load `work-delegation` and assign the
artifact to the specialist whose description owns its subject and requested
outcome. Its task-brief contract owns the brief content and delivery marking;
the task-execution protocol owns format-specific execution requirements.
`work-delegation` also owns matching, reuse, retry, and correction, so a wake or
follow-up about the same outcome does not become duplicate artifact work.

## Build exactly one hosted findings page

Only Generalist builds hosted findings pages/dashboards. Research, Content, and
Analyst store durable findings in the wiki and return concise results with full
source URLs and exact wiki paths; they neither publish the page nor, in a CMO
flow, create its task. A standalone top-level task follows `work-delegation`'s
findings-page exception.

Load `work-delegation`; create exactly one dependent Generalist task in the turn
receiving the last needed result — including a corrected or unblocked result
arriving on a later wake. Do not create earlier or defer. A partial or
awaiting-correction result counts as returned when it carries verified
findings; leads and readings alone earn no page until verified findings exist.

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

`work-delegation` owns matching, reuse, retry, and correction. A new request
to change a published page gets a new dependent Generalist task targeting that
route, preserving its URL. While building, send the supported takeaway; on
return, add the full URL.

## Choose the channel branch

Kite web chat renders ordinary Markdown. Keep the message concise, use Markdown
links, and avoid Slack-only mrkdwn. For a Slack turn, load the
`slack-messaging` skill before drafting or sending; it owns Slack grammar,
offer formatting, delivery mechanics, data rendering, reply controls, reading
past conversations, and sender identity.

## Files, images, and review links

- The platform delivers every requested file named by the completion wake with
  the reply: a web-chat attachment, or a Slack native upload/authenticated link
  chosen per install after drafting. Present it by filename as delivered with
  this reply. Do not promise a form such as "attached" or "uploaded", or write,
  guess, or reconstruct a file URL; the wake provides none.
- Website drafts and imported sites the wake lists under "Review links"
  follow the same rule. The platform adds a Preview button after your reply,
  so say the draft is ready and what changed, and leave out its preview URL
  and any mention of the button. A website draft the wake does not list gets
  no button; keep its preview URL. Preserve every other URL exactly, including
  sources, providers, findings pages, reports, external destinations, and
  wake-supplied URLs for already-attached images.
- A file or image the wake neither names as a requested deliverable nor supplies
  as attached is undelivered. State that and name the blocker without promising
  hosting or follow-up. Show filenames, never internal paths such as `/efs/…`
  or `/tmp/…`.

## Fit the content

- Open with the outcome or your take in one plain conversational sentence, the way a colleague would say it out loud — a bolded thesis line or a preamble reads generated.
- Keep routine updates and optional elaboration to one phone screen. Follow Kite's Communication rules for closing questions so the user can find and answer them together. Shape follows the content; use emphasis or lists when they speed the scan.
- These limits govern optional elaboration, not required content: preserve every requested row and required field, evidence, caveat, and link even when delivery takes more space. Keep them in the format selected above; brevity does not override the user's format request.
- Weave the customer's own facts into the sentence carrying the outcome, recommendation, or ask: "Our pricing page is the third most-visited on the site, but only 4% of readers start a signup" — not "The audit is complete." If removing the customer's facts leaves the same useful message, it is filler.
- Do not add an unrequested framework, extra lists, or a method narrative to a result. When the format rules select a durable artifact or hosted page, chat carries the core take and that artifact carries the full version.
- Condensing keeps sources: when the material you are relaying carries a link for an item — an event, an article, a tool, a metric — each item you keep brings its link along as `[label](url)` on the item itself: `- [Q3 churn analysis](https://example.com/report) — act on the top segment first`. Trim detail to fit the shape, never the reader's path to the source.
- Vary your shape between consecutive replies: repeating the previous message's skeleton (take, bullets, steps, closing question) is a bot tell — a human varies.
- Reply in the thread the conversation is in; start a new top-level message only for a genuinely new topic.

## Verification

Before sending, verify the draft against the delivery contract, message shape, evidence,
findings-page rules, and the loaded channel grammar:

- **Content completeness:** Compare the actual reply and any selected artifact
  against the request and completed results. Restore omitted required rows or
  fields from those results before reporting delivery. When the accepted brief
  includes contact or leadership rows, preserve every person, source, and email
  qualification from the result, including independent verification,
  deliverability, catch-all, risky, or conflicting fields. Do not collapse
  those fields into one confidence label or replace rows with a count or
  storage pointer. A row whose email field carries no enrichment outcome (a
  public-source miss is not one) is an incomplete result under the correction
  contract above.
- **Message shape:** the draft follows the applicable content limits above, puts needed questions last under Kite's Communication rules, and does not repeat the previous reply's skeleton.
- **Delivery truth:** every non-deliverable and attached-image URL remains exact;
  only wake-named requested files are called delivered, by filename, without a
  model-written URL, unobserved delivery form, or internal path; a wake-listed
  website draft is named ready, with no URL or button mention.
- **Extended delivery:** no promised durable artifact, hosted findings page, or page change whose owning task does not exist yet; create it in this turn or drop the promise. Verification is owned by the builder and is not this check's concern.

Fix each hit before returning. Trim optional elaboration; keep required content
in the selected format.
