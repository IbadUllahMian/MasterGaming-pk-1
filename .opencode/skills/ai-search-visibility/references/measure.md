# Measure lane — mechanics

Read this file when executing the Measure lane (a tracked measurement or an
ad-hoc benchmark). Measure how a brand stands in AI answer engines and search,
and persist one snapshot per tracked run. All provider calls go through the
`kite-aeo` CLI — vendor keys stay on the platform.

Before selecting additional questions or running the answer-engine measurement,
read `references/answer-engine-measurement.md`. That Measure-only companion owns
question selection, the answer-engine command and input, failure behavior, and
snapshot payload construction. Diagnose and Recommend do not load it.

Platform mirror: `backend/app/llm/platform/aeo_dispatch/measurement-task-prompt.md`
and `wake-comment-prompt.md` are the platform-authored dispatch and wake texts
for this lane. They deliberately mirror the stages-never-spawn rule and the four
analytics report kinds — a change to either side of that contract must be
checked against the other.

## Subject and mode

The task description states what to measure, in one of the shared rules' three
modes:

- **Tracked** (the default): the team's own site, identified by the task's
  `application_id` and domain. Runs the full lifecycle below — inputs, provider
  loop, readiness and SEO pulls, snapshot submit, digest — and ends there.
- **Ad-hoc benchmark**: any other domain the task names — a competitor, a
  prospect, a market neighbor. Same provider loop and the same task lifecycle
  below, no persistence: register the domain (registration is team-scoped, so
  this run never shares state with another workspace measuring the same
  domain), submit prompts, park, collect the analytics on the data-ready wake,
  start the answer-engine run and park, read it on the measurement wake, and
  put the result in the task result. Run the SEO pull for the named domain too
  — search evidence needs no application. An ad-hoc result carries three
  parts: the **standings** (leaderboard, share of voice, citation domains, and
  the per-question answers the read call writes to its answers file), the
  **search standing** (the `seo-state` ranked keywords with rank and monthly
  searches, which of them show an AI Overview, estimated monthly visitors, and
  the snapshot date), and the **mechanism comparison** — for each brand ranked
  above the subject, what the citation evidence shows it is present in that
  the subject is not (the specific cited pages, roundups, and communities from
  `citation_domains`/`citation_urls`), with that competitor's own search
  evidence appended when `kite-aeo competitor-seo <competitor domain>` returns
  it. Standings without the comparison are an incomplete result. Skip the
  readiness check, the snapshot submit, and the later stages: ad-hoc results
  live in the task result and the conversation, deliberately never in the wiki
  series or on a hosted report. Compose the topic set for the measured brand's
  category using the same rules below, and say in the result that the series
  is unsaved (a future re-benchmark starts fresh).
- **Focused SEO standing**: the task asks only how a domain ranks in search.
  Run `kite-aeo seo-state <domain>`, plus `kite-aeo competitor-seo <competitor
  domain>` for each competitor the task names. Nothing else — no registration,
  no prompts, no answer-engine run, no readiness check, no snapshot, no later
  stages. Report the ranked keywords with rank and monthly searches, which of
  them show an AI Overview, the estimated monthly visitors, and the snapshot
  date, then finish in the same turn: it makes no call that arms a wake, so
  this mode never parks. Report each field only as the command returned it — a
  rank, a search volume, an AI Overview flag, or a traffic estimate the
  response omits stays unavailable and is named as unavailable, never
  estimated. A focused run has no second source to fall back on, so the
  degradation rule below does not apply to it, and `seo-state` failing leaves
  nothing to report: a transient failure that persists after the one retry
  records `Blocked: platform-unreachable`, and a terminal one — payment,
  authorization, or invalid input, none of which a retry can change — records
  `Blocked: search-source-unavailable`. Never report an empty search standing
  as a measurement.

No mode needs a separate industry view: every measured run's leaderboard and
share-of-voice already rank all brands the engines surface for the measured
topics. Everything below is written for tracked mode; an ad-hoc run uses the
provider workflow, the SEO pull, and the topic rules, and a focused SEO
standing uses only the two search commands named above. "The brand" means the
measured subject.

## Task lifecycle

Your task runs across up to three turns, each ended by a platform wake — a
focused SEO standing runs in one, because it makes no call that arms a wake:

1. **Measurement turn**: validate inputs, register, submit prompts, run the
   SEO pull, and run the readiness check on a tracked run. **The prompts response decides whether you park.**
   It carries `platform_wake_armed`:
   - `true` — a platform wait is scheduled and will comment on this task when
     the provider's analysis is `data_ready` (or timed out / failed /
     unreachable). **End the turn without `set-task-result`, with a final
     message that begins exactly `WAITING-FOR-PLATFORM-WAKE:`.** Never sit in
     the run polling for it.
   - `false` — nothing is coming. The analysis was already complete, so
     continue straight to collection in this same turn, even if the analytics
     reports come back empty: an empty report from a finished analysis is a
     measurement of nothing, not a reason to wait. Parking here would sit in
     `waiting` with no wake scheduled, and the platform now fails the task
     rather than letting it hang.

   Do not infer the wake from empty analytics — a completed analysis can
   legitimately return them, and that inference is what stranded tasks before.
   The flag is the platform's promise; the sentinel is only ever valid against
   it.
2. **Collection turn** (the platform's data-ready comment wake, or the same
   turn when no wake was armed): collect the analytics reports, then start the
   answer-engine run per the companion. The run measures platform-side and
   returns `status: running` with a wake armed: end the turn parked, exactly as
   in the measurement turn. Every path submits only in the result turn — the
   platform refuses a snapshot while the measurement is missing or still
   running.
3. **Result turn** (the platform's measurement comment wake): read the run's
   result with the same command, submit the snapshot, and record the digest
   with `set-task-result` — the task completes here and the user gets the
   standings immediately, before the comparison runs.

If the **data-ready** wake comment says the analysis timed out, failed, or
could not be checked, you have **no provider standings** — still start the
answer-engine run (its evidence does not depend on the provider's analysis),
and in the result turn submit the snapshot with what exists so the run is on
the record, name every missing report in `synthesis_md`, and open the digest
with `analysis pending`/`analysis failed` and what is still unknown. A
**measurement** wake that reports the run failed follows the companion's
failure contract instead: no snapshot, `Blocked: answer-engine-unavailable`. A
submit carrying no standings is filed under
`attempts/<date>.md` rather than as the day's snapshot when that date already
holds a measured one, so re-running after a timeout can never cost the site
numbers it already earned; the response's `written_files` tells you where it
landed. Do not present a run with no visibility standings as a measurement, and
do not tell the conversation the comparison is ready to run: a snapshot with no
standings cannot be synthesized into a Brand Gap report, and the platform
refuses one built on it. Say plainly that the measurement needs a re-run.

A tracked run is complete when the snapshot submit succeeded and the digest
was recorded; an ad-hoc run is complete when the result turn's
`set-task-result` carries the standings, the mechanism comparison, and the
search standing the SEO source returned (a degraded SEO source is excluded per
the rule below, never a reason to withhold the standings); a focused SEO
standing is complete when its `set-task-result` carries the search evidence
with its snapshot date.

**Degraded inputs are internal, never user-facing.** When a supporting data
source fails for account, credit, or availability reasons (a
`payment_required` error, or repeated upstream errors from the SEO source or
readiness probe), exclude that input and continue the measurement — the
platform alerts the team internally. User-facing output (digest,
`synthesis_md`) states at most which measurements the run covers; it never
mentions providers, credits, billing, or internal service names. A visibility
measurement that produces no durable AI-answer data blocks the run.

## Inputs to gather first

1. **Tracked topics** (the authoritative topic source): read
   `aeo/<application_id>/tracked-topics.md` — one topic phrase per bullet, each
   with the one-line rationale it was registered with. Its entries are
   user-curated and agent-appended — measure ALL of them, even one that breaks
   the composition rules below (the user's choice is sovereign; note the rule
   conflict in `synthesis_md` instead of dropping it). The composition rules
   govern only topics YOU compose — do that solely for categories the tracked
   list leaves uncovered, and register every topic you compose with
   `kite-aeo track <application_id> topic "<topic>" "<one-line why>"` so the
   set is durable and user-visible.
2. **Tracked questions** (the authoritative user-question source): read
   `aeo/<application_id>/tracked-questions.md` when present. Every unindented
   bullet is exact wording the user chose; include all of them verbatim as
   `source: "user"`. Questions remain separate from topics because the
   topic-based research source derives questions from topics while the
   multi-engine run executes tracked wording directly.
3. **Prior state** (cross-run memory): read `current.md` and the newest
   snapshot if they exist. Your snapshot must be comparable to the last one —
   reuse its topic strings and its distinct `prompt_source: "agent"` questions,
   unless positioning or demand materially changed, a prior item breaks the
   composition rules, or the tracked list dropped its subject. The prior agent
   questions are the stable core, not suggestions to rewrite cosmetically. A
   changed topic or question resets that slice of the series; name the reset in
   `synthesis_md`.
4. **Positioning**: read `desired-associations.md` when present — the
   positioning statements the user confirmed in conversation, and the
   highest-priority source: it outranks every other positioning signal.
   Otherwise infer the brand's positioning from the task description first,
   then the wiki (`positioning.md`, `brand/`, `website/state.md`). **The
   provider registration description regenerates from this current positioning
   every run** — when the provider's stored category for the site contradicts
   it (e.g. a stale registration describing a previous product), record the
   mismatch as measured evidence in `synthesis_md` for the diagnosis to pick
   up; never silently adopt the stale category.
5. **SEO picture**: `kite-aeo seo-state <application_id>` on a tracked run,
   `kite-aeo seo-state <domain>` for any other subject — the search-side
   evidence, freshness-ensured (the platform refetches the ranked-keywords
   snapshot when it is older than 24h; `refreshed` in the response says which
   happened). A tracked run carries its `summary` into the snapshot payload as
   `seo_summary` verbatim; a run with no snapshot reports the same fields in
   its result. Report each field only as the command returned it — a rank, a
   search volume, an AI Overview flag, or a traffic estimate the response omits
   stays unavailable and is named as unavailable. When the command reports the
   site has no tracked domain, proceed without SEO data and omit `seo_summary`
   — never fabricate it.
6. **Competitors**: `kite-aeo competitors <application_id>` — the confirmed set
   from the SEO stack. Fall back to the provider's researched competitors when
   it returns none: take them in the provider's order, cap at 5, and skip any
   that plainly sell to a different market. Register any provider-researched
   competitor you actually measure against with
   `kite-aeo track <application_id> competitor "<domain>" "surfaced by the visibility provider"`
   so the SEO stack sees it too.

## The query categories

The topic set spans the buyer's funnel: **2-4 `generic` demand topics** (the
top-of-funnel problems a buyer types before they know the category exists) plus
**one topic per brand-surface category**. Omit a brand-surface category only
when the wiki and task contain no mention of that surface at all (no sub-brand
line, no named product, no founder); sparse-but-present content still gets a
topic. `generic` is never omitted. On a first run with no prior snapshot,
compose fresh topics and note in `synthesis_md` that this is the baseline.

**Topics are what a buyer types, not what the brand is called.** The provider
embeds your topic string verbatim into the generated queries and then measures
which brands appear in the engines' *answers*. A topic that contains the brand
name produces unnatural, brand-stuffed searches nobody types ("what's a cheap
kite ai website builder") and biases the measurement — presence is detected
from answers, so the question must stay unbranded. The table below is the
authoritative category schema — categories in snapshots and reports must use
exactly these names. Each category names a funnel stage or brand surface; its
topic is the phrase a prospect would use when that surface should win:

| Category | What it probes | Topic = the unbranded phrase a buyer types | Example (for an AI website builder) |
| --- | --- | --- | --- |
| `generic` | Top-of-funnel problem demand (2-4 topics) | The problem, as the buyer says it | `checking if my website is optimized for SEO`, `how to audit a website` |
| `main_brand` | The core category the brand wants to own | The category itself | `AI website builder` |
| `sub_brand` | A sub-brand or product line | That line's category | `website builder for startups` |
| `product_name` | A specific named product | The product's category / job | `website audit tool` |
| `proprietary_feature` | A capability the brand uniquely names | What the capability does | `AI agents that keep a website updated` |
| `proprietary_metric` | A measurement/score the brand coined | The metric's generic concept | `website growth score` |
| `personal_brand` | A founder or public figure tied to the brand | The person's name — the one category where a name IS the topic | `<founder's full name>` |

The set should read as a funnel: generic problem ("how to audit a website") →
category ("website audit tool") → proprietary surface ("website growth score").
A buyer who asks the generic question today asks the category question next
week — measuring both shows where in the funnel the brand drops out.

Two hard rules:

- Never embed the brand, product, or feature *name* into a topic for any
  category except `personal_brand`. If the answers for `website growth score`
  name a competitor's metric instead of the brand's, that IS the finding (a
  `brand_vs_category` gap) — a branded topic would have hidden it.
- Brand-surface topics are short noun phrases (2-6 words); `generic` topics are
  problem phrases and may run longer (up to ~8 words). No question marks, no
  marketing adjectives — the provider composes the question phrasing itself.

Good vs. bad, for a brand "Kite" whose product is a website audit tool called
"Growth Grader":

- `generic`: `checking if my website is optimized for SEO` — not `best SEO tools` (that's a category topic, not a problem)
- `main_brand`: `AI website builder` — not `Kite AI website builder` (brand-stuffed; generates searches nobody types)
- `product_name`: `website audit tool` — not `Kite Growth Grader website audit tool`
- `proprietary_metric`: `website growth score` — not `Kite Growth Grader score`
- Phrasing: `website audit tool` — not `what is the best website audit tool?` (a question) or `powerful all-in-one website audit tool` (marketing adjectives)

## Provider workflow (kite-aeo)

1. `kite-aeo siftly-register "<domain>" "<one-paragraph business description>"`
   — write the description from the current positioning gathered above, never
   from the provider's stored copy. Registration runs brand research inline
   (~30s) and is cached per domain; a repeat run returns the existing site.
   Record `external_site_id` from the response.
2. `kite-aeo siftly-status <external_site_id>` — proceed when
   `ready_for_prompts` (usually immediate after register). **Every call in this
   sequence uses the exact `external_site_id` step 1 returned** — never an id
   from the wiki, a previous run, a company-intelligence brand-profile
   response, or your own
   reconstruction of the format. A wrong id fails with `invalid_params`
   ("Unknown AEO visibility site id"): re-run step 1 and use what it returns.
   That is a caller mistake, never a platform outage — do not record
   `Blocked: platform-unreachable` for it.
3. Write an overrides JSON file — exact shape:
   `{"topics": ["<topic string>", …], "competitors": [{"name": "…", "domain": "…"}, …], "personas": ["<buyer persona>", …]}`
   (topics is a flat list of your composed strings; 1-3 personas) — then
   `kite-aeo siftly-prompts <external_site_id> overrides.json`. The platform
   caches the prompt set per topic set: repeating the same topics returns the
   cached set (no re-triggered paid analysis), while changed topics regenerate
   the prompts and restart the analysis — so change topics only deliberately
   (positioning change, or correcting a rule-breaking topic), never
   cosmetically.
4. Known provider behavior (probed 2026-07-03): prompts echo your topic strings
   verbatim in their `topic` field — attribute each prompt to its category by
   exact topic match. A generation may not cover every topic; record uncovered
   categories as `prompts_total: 0` rather than inventing coverage. When a
   `generic` topic went uncovered, reword it once (same demand, different
   phrasing) and regenerate; if it is still uncovered, accept the gap and say
   so in `synthesis_md` — the funnel measurement is incomplete without it, and
   a second reword isn't worth another paid regeneration.
5. Check `kite-aeo siftly-analytics <external_site_id> <kind>` once for
   `leaderboard`, `share_of_voice`, `citation_domains`, `citation_urls`. Items
   present → continue to step 6 in this turn. Items empty → what you do depends
   on step 3's `platform_wake_armed`, not on the emptiness: `true` → finish the
   readiness check below, then **end the turn per the task lifecycle, final
   message starting `WAITING-FOR-PLATFORM-WAKE:`** and the platform's
   data-ready comment resumes you (waiting is its job, not yours). `false` →
   the analysis is already finished and these empty reports are its answer;
   continue to step 6 in this turn, and in the result turn submit the snapshot
   and record an `analysis pending`/`analysis failed` digest. Empty analytics
   alone never justify parking — nothing would be coming.
6. Start the answer-engine run per the companion and park; in the result turn,
   read it and submit the snapshot per the companion's contract.

## Agent readiness check

Once per run — the measurement turn is the natural moment — run
`kite-aeo agent-readiness <application_id>`. The platform scans the site's
domain (its tracked domain, or the published URL when none is tracked) through
the public readiness scanner and keeps the 24 checks a marketing site
controls: a weighted score (0–100), each check's status, weight, and points
earned, and `top_fixes` ranked by the points each would recover, each with the
scanner's fix recommendation and a reference link when one exists. Because
this call carries
trusted application context, the platform persists the exact output to
`aeo/<application_id>/readiness/<date>.json` in the wiki (Recommend includes it
in the findings-page handoff from there) and records it in its observability
stores. `website-agent-readiness` owns the persistence distinction between
current-site and arbitrary-domain scans. Never paste the full JSON anywhere;
reference the score, the top fixes, and failing check ids.

- Fold a short **Agent readiness** section into `synthesis_md`: the score with
  points earned out of available (dated from `scanned_at` when the scanner
  served a `cached` result), then the `top_fixes` in order with each check's
  one-line evidence and the scanner's recommendation summary. Checks with
  `scored: false` (brand presence, not-applicable rows) are context, not
  findings — mention a brand check only as a fact about the market, never as a
  site fix. Never recommend fabricating a capability file for a
  service the site does not have; report the failing check with its
  recommendation instead.
- Failing checks are findings for the diagnosis, not chores for this task:
  never edit the website from a measurement run. Site fixes happen in the
  website-editing flow, which has its own agent-readiness rules.
- When the command reports the site has no tracked domain and no published URL
  (an unpublished site), skip the check and say so in `synthesis_md` — same
  convention as missing SEO data.

## Delta + handoff

1. Compare this snapshot's numbers to the previous snapshot JSON (when one
   exists): share-of-voice movement, leaderboard rank change, new/lost
   citations, category presence changes. A delta is material when a rank
   changed, share of voice moved by a full point or more, or a category
   gained/lost brand presence. Put the 2-4 most material deltas in your digest
   with exact numbers ("appears in 4 of 12 tracked answers for X, up from 1").
   Name the wins too: every topic where the brand DID appear
   (`prompts_with_brand > 0`) is a query the brand ranks for — call those out
   alongside the gaps.
2. **Feed the flywheel**: derive at most 2-3 new topic candidates from the SEO
   picture — high-volume keywords where the site ranks or holds a target pick,
   preferring ones with `has_ai_overview: true` (those queries demonstrably
   produce AI answers, so they are measurable surface). Register each with
   `kite-aeo track <application_id> topic "<keyword-as-buyer-phrase>" "<rank/volume evidence, e.g. 'ranks #3, 2400/mo, AI Overview present'>"`
   after deduping against the tracked list. The cap is deliberate: new topics
   regenerate the provider's paid query set on the next run, so additions must
   stay considered, never bulk.
3. Your digest: measurement date, the measured subject, headline standings with
   exact numbers (rank, share of voice, who is above), material deltas, the
   agent-readiness score with points earned out of available (compare scores
   only when the previous report also carries a `weight` field; when it does
   not, say the scoring
   baseline was reset — never describe that numeric difference as site
   movement — and note when a scored check newly fails), categories still
   uncovered or reports still pending, full source URLs, and the exact
   snapshot/wiki paths. End it with the ready-to-dispatch pointer the
   conversation side needs for stage two: "Comparison ready to run for
   application <application_id>, snapshot <date>." **Only when the run produced
   standings.** A digest opening `analysis pending` or `analysis failed` ends
   by saying the measurement needs a re-run instead — there is nothing for
   stage two to compare, and the platform refuses a report built on that
   snapshot.
