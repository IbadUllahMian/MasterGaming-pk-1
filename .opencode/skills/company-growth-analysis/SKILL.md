---
name: company-growth-analysis
description: >
  Use this skill when a task hands you a company's growth dossier and asks
  for the Growth Grader checklist analysis on it — "grade acme.com's growth
  from this dossier", "answer the growth checklist for this company", "how
  does acme.com stack up against its rivals on the checklist". It qualifies
  the supplied evidence against the checklist behind the Growth Grader
  report: one evidence record per question for the company and each rival,
  weighed into a verdict. It analyzes evidence the task supplies and gathers
  none; one target company per run. For a new growth evaluation report use
  company-growth-evaluation. For a site's own traffic and conversion data
  use analytics-interpretation; for tracked AI-answer visibility use
  ai-search-visibility; for an open research question with no
  checklist use web-research.
mode: sandbox
---

# Company growth analysis

You are the growth analyst on this task: you decide only from the evidence
in front of you, in the plain, direct voice the verdict asks for. The
analysis is a fixed contract: 138 verbatim questions, one record each,
decided only from captured evidence, weighted by six profile facts, and
written as a verdict a founder reads. Two runs over the same evidence must
agree; an improvised question, paraphrase, or guessed fact breaks that, so
follow the contract below exactly. The stage rules copy the platform's own
analysis prompts (`growth_grader/analysis/system-prompt-*.md`) so both
surfaces decide alike; `ownership`, the seventh profile field, exists only
here.

## Inputs

- **The dossier** — the evidence for the target plus its rivals, one
  status-carrying slice per source, in whichever of two forms the task names:
  the Growth Grader pipeline's JSON file, supplied as a path, or the Research
  agent's dossier pages — one wiki page per company,
  `growth/dossier-<yyyy-mm-dd>.md` for the team's own company and
  `companies/<slug>/dossier-<yyyy-mm-dd>.md` for an external one. This skill
  analyzes evidence and never gathers it. Read the dossier as the task hands
  it to you — the file's slices, or the pages' sections, one per source, each
  carrying its status — and confirm before any analysis that it opens where
  the task says and carries its as-of date; a missing dossier or one that
  does not open follows "Failure handling". The dossier is the source system for this
  analysis, read by you: every record cites the slice paths or page sections
  it read, and the wiki page and the task result name the dossier and its
  as-of date as the evidence source and date — that is how each claim stays
  grounded in data you retrieved.
- **The target.** The dossier's `target_domain`, or the domain in the target
  page's title. Read `company/identity.md`
  per `wiki-management` to tell whether it is the team's own company or an
  external one; the recorded identity stands whatever domain the task names.
- **The rivals.** The dossier's `competitors`, or the rival pages the task
  names beside the target's, as captured; add none and drop none.
- **The checklist** — `references/checklist.md`. Load it before the first
  question batch and work from it batch by batch.
- **The weights** — `references/weights.md`. Load it only at the verdict
  stage.

## Evidence semantics

Every dossier slice carries a `status`. Only two statuses let you conclude
anything about the company:

- `ok` — the source ran; the data is under `value`.
- `not_found` — the source was reachable and the subject was not there. This
  describes the company ("no Trustpilot profile exists for this domain").

Every other status describes our coverage, never the company, and supports no
finding either way: `source_unavailable`, `timeout`, `error` (blocked or
failed), `too_thin` (returned too little to use), `not_licensed` (we chose not
to query), `not_attempted` (never queried). A rival with a typed absence and a
rival that was never checked are different situations.

Long strings and lists are truncated with an explicit marker. A truncated
value is a sample: report the counts you can see and say the sample was
partial. Small samples are counts, never percentages — "3 of 11 reviews", not
"27%".

Missing evidence is missing, never a negative finding: "no case studies were
captured" is not "the company has no customer proof". Whenever a record rests
on absent data, name which kind of absence it was, because the verdict treats
them differently and sees only what you write.

## Stage 1 — profile each company

Six facts key the weighting, so a wrong fact tilts the whole verdict and a
guessed one tilts it on nothing; the seventh, `ownership`, moves no weight.
`unknown` is a first-class answer that moves no weight; prefer it to a thin
call. Decide from the evidence in the slices
`page_capture`, `crawl`, `company_series`, `public_records`, `community`,
`trustpilot`, `sitemap_history`, `seo` — not from what you know about the
company — so a second run returns the same values. Each fact carries a
plain-sentence `reason` naming the deciding evidence and the `evidence_paths`
you read.

Load `references/profile-facts.md` before profiling: it holds the seven
facts' vocabularies and decision rules, including `ownership`, the unweighted
seventh field whose confirmed change must lead the verdict.

A company with no evaluable slice at all (nothing `ok` or `not_found`) gets
an all-`unknown` profile; `ownership`, whose vocabulary has no `unknown`,
gets `no_signal`. Every record for that company is not assessed, with
the reason "No evidence was captured for this company, so the evaluator was
not asked." When the company has no domain, insert " (no domain was
available, and every source is domain-keyed)" before that reason's comma.

## Stage 2 — answer the checklist, one batch per company

Every company — the target and each rival — gets the full question set: a
wrongly skipped question fails silently, while a needless one costs one
visible "not applicable" record. Take the checklist batch by batch (13
batches, one contract subsection each). Before answering a batch, split it:

1. A question the reference marks **Decided: not assessed** is recorded with
   that reason, verbatim. It is never put to the evidence.
2. For a rival, a question whose slices are all **target only** is recorded
   as not assessed: "This evidence is captured for the target company only,
   so it cannot be answered for a rival."
3. A question whose cited slices are all absent for this company with no
   `ok` or `not_found` among them is recorded as not assessed: "Every
   evidence slice this question cites is absent from this company's capture
   with nothing to conclude from (`<slice>=<status>`, …), so the evaluator
   was not asked." Asking anyway could only restate the absence in a
   plausible sentence — the exact failure this split exists to prevent.
4. Everything else is answered against the batch's slices only.

The per-record rules — grounding, `evidence_type`, `limit`, applicability,
`direction`, confidence caps, and the estimate and tool-detection caveats —
live in `references/record-rules.md`; load it with the checklist before the
first batch and apply it to every answered record.

Write `finding`, `limit`, and every reason in plain sentences a growth
marketer reads. Before moving on, check the batch: one record per question,
required fields populated, `evidence_paths` drawn from the paths supplied. A
record marked `not_applicable` without a reason gets "The evaluator marked
this question not applicable but gave no reason for it"; a record with no
finding and no reason gets `not_assessed_reason` "The evaluator returned no
finding for this question and gave no reason for that" — the record is kept
and the lapse made visible, never dropped. Each record is an entry in the
analysis page's appendix, carrying every field of the record contract the
Output section lists.

## Stage 3 — the comparative questions, once

The ⚖ questions (listed at the top of the checklist reference) keep their
per-company records and are answered once more, over the target and every
rival together, reading only the dossier — never the per-company records.
Split them as in Stage 2 first: a ⚖ question the reference marks **Decided:
not assessed** gets one comparative record carrying that reason verbatim and
no `comparison_set`. The answered ones follow the same record rules, plus:

- Name the domains compared in `comparison_set`; a comparative record
  without one is incomplete.
- Coverage windows differ per company and per source. State the window each
  comparison covers in `sources[].window`; when windows do not overlap
  cleanly, say so in `finding` and `limit`. Comparing a full window against a
  partial one without saying so produces a confident wrong answer — the
  specific failure this stage exists to avoid.
- Compare only what was captured for every company in the set. When a rival
  lacks the evidence a question needs, narrow the set to the companies that
  hold it and say you narrowed it — as long as the target and at least one
  rival remain; when no rival holds it, record the question as not assessed
  with the reason "No rival holds the evidence this question compares
  (<slice>)." A rival with no captured reviews is not a rival with no
  reviews.
- When a question needs a target-only slice the rivals do not have, say so
  rather than comparing against nothing.
- `direction` is the target's trajectory relative to the set, only when the
  series supports it.

## Stage 4 — the verdict

Compute the emphasis of each of the 28 groups from the **target's** profile
using `references/weights.md`; it is arithmetic, not judgment, and the verdict
never changes it. Then group the target's records plus the comparative
records by emphasis group and write the report. Four rules outrank every
emphasis level:

- **A weight never buries a fact.** A directly observed failure — a broken
  signup, the site blocking crawlers, collapsing headcount — belongs in the
  verdict however little its group counts.
- **A "not applicable" call wins.** A reasoned not-applicable record beats
  the emphasis; it is not a gap.
- **Missing evidence is never failure.** A heavily counted group with thin
  evidence reads "we could not see much here", never "this is bad".
- **A gap in coverage cannot become advice.** Recommend only from what was
  observed; what could not be reviewed gets one sentence and a line in
  `not_assessed`.

Match the strength of every claim to its source. Factual claims come from
surfaces read directly (the company's pages, archived copies, review pages).
Directional claims may rest on third-party keyword and ranking data. Trend
claims may rest on vendor estimates of traffic, headcount, and spending —
stated as direction and scale ("roughly ten times the January level"), never
as the estimated counts: vendor traffic models are routinely off by ten or
twenty times for small companies, so the reader's own analytics is the only
real source, and the report says so.

- One verdict per group, engaging with what its records found: a
  `counts_heavily` group references specific findings; a `counts_little`
  group gets one honest sentence. Include every group, with its computed
  emphasis, and cite the record ids behind it.
- `overall_read` is exactly one of `strong`, `promising`, `mixed`,
  `concerning`, `weak`, chosen from the heavily counted groups and any
  direct-observation failures — not an average of everything.
- `summary`: plain sentences for a founder deciding where next quarter's
  effort goes. Lead with what matters most, name the specific evidence (a
  number, a page, a trend), and say what you cannot tell them and why in the
  same voice. No scores that were not computed, no percentages the records
  did not report, no funnel math, no internal jargon or question ids in prose.
- `not_assessed` is mandatory and never softened: one plain line per thing
  not assessed, with what it would take to assess it. When it would otherwise
  be empty, list every record carrying a `not_assessed_reason` as
  "<question> — <reason>". Use different language for the four kinds of
  absence: not applicable (say
  nothing beyond the group verdict); looked and found nothing (can be a real
  finding); blocked or errored (our coverage — never phrased as something the
  company lacks); chose not to look or too thin (a coverage note, never a
  finding).

## Output

Two artifacts, in this order:

1. **The analysis page** — `$TASK_ARTIFACTS_DIR/growth-analysis.md`, markdown,
   appended to after every batch so a deadline or a failure never loses
   finished work. It carries the overall read, the summary, the group
   verdicts with emphasis, the not-assessed list, each company's profile
   facts with reasons, the contract gaps, the evidence capture date, and an
   appendix of every record. The record contract is this field list, and
   every record carries all of it: id, the question verbatim, applicability
   with its reason when not applicable, the finding or the not-assessed
   reason, evidence type, evidence paths, sources (URL, date, window, sample
   size), comparison set, direction, confidence, limit, and significance
   hypothesis. A later agent reuses the records and cites their sources from
   that appendix without re-running the analysis. The contract gaps are
   copied from the checklist reference's closing section. A verdict that
   could not be written leaves the verdict section saying so, and the result
   says so too; the records are the durable output and are never discarded
   for it. Once the verification pass below succeeds, file the page per
   `wiki-management`: for the team's own company
   `growth/growth-analysis-<yyyy-mm-dd>.md`, for an external company the
   same filename in its `companies/<slug>/` folder. The platform's
   `growth/growth-report.md` mirror is never edited.

2. **The task result**: the overall read, the summary, the not-assessed list,
   the wiki path, and each company's source coverage (which slices were
   `ok`, which absent and why). Open it with `Report kind: Growth` and the
   wiki path, so the CMO can hand the analysis to the Generalist, who builds
   the hosted report through `dashboard-building` from that page, without
   re-running anything; the hosted report is that task's to write, not this
   one's.

## Working inside one context

The whole run is one task: never delegate a company's passes to a subtask.
A full run — a profile for the target and every supplied rival, thirteen
batches per company, a comparative pass, a verdict — carries more evidence
than one context holds, but the accumulating analysis page belongs to this
task's `$TASK_ARTIFACTS_DIR` and is filed to the wiki by this task alone,
so records a subtask writes in its own sandbox can never be assembled into
the one page this task must file. Read only the slices — or page
sections — a batch cites, the same way every run so two runs read the same
evidence, append the batch's records to the analysis page, and let the
evidence leave context before the next batch. When a batch's cited slices
still exceed the context, split the batch by question in checklist order,
each sub-batch carrying only the slices its questions cite, and append
records after each. A question whose cited slices alone exceed the context is
recorded not assessed with the reason "The evidence this question cites
exceeded the analysis context, so it was not put to the evaluator
(<slice>=<size>)." A deadline that arrives first
follows the checkpoint rule under "Failure handling".

## Verification

One pass over the finished analysis page — exactly one; repeating it produces
no new evidence. It passes when:

- every company holds 138 records in checklist order with the question text
  verbatim;
- every record carries a `limit` and either a `finding` or a reason, and
  every `not_applicable` record has its reason;
- every answered comparative record names its `comparison_set` and windows,
  and every not-assessed one carries its reason;
- every group appears in `group_verdicts` with the computed emphasis;
- every claim in the summary and the verdicts traces to a record id — an
  ownership claim to the profile's `ownership` field and its `evidence_paths`;
- `not_assessed` lists every not-assessed record, `contract_gaps` is
  complete, and the appendix holds every record with every field of the
  contract.

Fix what fails; a record that still will not validate becomes a
not-assessed record with the reason "The evaluator's answer for this question
did not match the evidence-record contract, so it was discarded rather than
reported unchecked (<what failed>)". Then file the wiki page and write the
result.

## Failure handling

- No dossier, or one that does not open where the task says or carries no
  as-of date: stop and report the exact failure; nothing is filed.
- The deadline arriving mid-run follows the task protocol's checkpoint rule:
  the batches finished so far, with the exact gaps, are the result.
- A target with no evaluable evidence is still a run: file the records,
  write the "could not see" verdict or say the verdict could not be written,
  and say what it would take to assess the company.
