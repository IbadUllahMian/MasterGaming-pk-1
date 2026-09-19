# Recommend lane — mechanics

Read this file when executing the Recommend lane. Turn the diagnosis into
ranked, executable recommendations; submit the validated page source package;
return a findings-page handoff and digest. Do not publish hosted pages. Create
the single Generalist task only under `work-delegation`'s explicit
standalone-page exception.

Pre-flight: read the diagnosis from `aeo/<application_id>/diagnosis/`, taking
the newest file — the Diagnose stage writes it there for exactly this handoff.
No such directory, no file in it, or a file carrying no gap findings →
`Blocked: missing-comparison` and stop; recommendations are never produced from
the snapshot alone. Read the snapshot files too — the diagnosis is your
judgment source, the snapshot is your number source.

**Three sources, three strictly separate jobs.** The **diagnosis** supplies
every judgment and finding. The **newest snapshot** supplies every number. The
**previous report** (`gap-report.json`) supplies exactly one thing: the
`rec_id`s of past recommendations, for the continuity rule below. Nothing else
from the previous report enters this run — its `competitor_comparison`,
`scorecard`, `gap_findings`, and figures describe a measurement that is now
superseded, and copying any of them ships last run's standings as though they
were current. When the previous report and the current diagnosis disagree about
a competitor's rank, mentions, or share, the diagnosis is right and the
previous report is history.

## Recommendations

- Produce **10 primary recommendations** (`is_alternate: false`, ranks 1-10)
  plus **3-5 alternates** (`is_alternate: true`) held in reserve for swaps.
- Each closes a named gap from the diagnosis. Recommendations span beyond the
  website: content to create, publications to pitch for listicle inclusion,
  own-site listicles, formats to add (e.g. video).
- `rec_id` is a stable kebab-case slug derived from the action (e.g.
  `write-comparison-listicle`). The continuity rule, in order: same action on
  the same surface as a previous recommendation → reuse its `rec_id`; a
  genuinely different action or surface → mint a new id; unsure which applies →
  reuse (user statuses key on `rec_id`, and a dismissed recommendation silently
  resurfacing under a fresh id is the worse failure).
- Prioritize by feasibility × expected visibility impact — impact dominates,
  feasibility breaks ties; `priority` is `high`/`medium`/`low`. Impact is
  grounded in combined evidence when `seo_summary` exists: search volume × AI
  Overview presence × current rank × the AEO gap — a recommendation targeting a
  2,400/mo keyword with an AI Overview the brand is absent from outranks one
  with no measurable demand. Rationale cites the snapshot numbers from BOTH
  surfaces where they exist; `expected_impact` states the observable leading
  indicator, not vague growth ("appears in the 2 AI answers for X within two
  sweeps"), so the next measurement can verify it.

**Every recommendation declares its execution lane** — who does the work,
structurally:

- `kind: "on_site"` + `execution_lane: "platform"` — a Kite function agent
  executes it against the website (pages, schema, internal links, FAQ blocks,
  metadata). The brief must be complete enough to delegate.
- `kind: "off_site"` + `execution_lane: "platform_assisted"` — the work happens
  off the website but the platform does the legwork: researching pitch targets,
  drafting the pitch or post ready-to-send, preparing directory submissions.
  `key_elements` names the deliverables the platform prepares; the user
  supplies the account or relationship.
- `kind: "off_site"` + `execution_lane: "user_only"` — genuinely requires the
  user (partnerships, podcast appearances, customer reviews). The
  recommendation still ships concrete guidance: who, where, what to say, and
  which leading indicator will move.

**Ground recommendations in the diagnosis's competitor evidence.** Fill
`competitor_evidence` with the diagnosis's verified finding in one sentence
with names and numbers — the cited pages a competitor is featured on and the
brand is not, the topics it wins, its mention counts ("ToolJet is named on all
three editorial pages the engines cited — AppsRhino, Zite, Reflex — and the
brand appears on one"). Append estimated traffic only when the diagnosis
recorded it; a mechanism finding without traffic numbers is complete evidence
on its own, never a reason to leave the field null. The rationale must then say
**why the mechanism works** — not "competitors do it" but what makes it
effective (listicle presence works for AEO because engines assemble comparison
answers from third-party roundups they already trust; comparison-keyword pages
work for SEO because the demand is proven and the SERP shape rewards them).
`competitor_evidence` stays `null` only when the diagnosis established no
relevant finding for any competitor the recommendation touches — never invent
one, never state a number the diagnosis didn't record. A report where most
recommendations carry null evidence while the diagnosis holds verified findings
is a failed handoff — re-read the diagnosis before submitting one.

**Every recommendation clears the insight bar.** Each rationale must state at
least one conclusion a reader could not get from the cited source alone — a
judgment licensed by the evidence, not a restatement of it. "Competitor X has a
listicle" fails; "every brand above us in the leaderboard is cited via roundups
we're absent from, so roundup inclusion is the entry ticket to these answers"
passes. Do not invent firsthand experience or unsupported claims to clear the
bar; when the evidence licenses no judgment, the recommendation doesn't make
the cut.

**Every recommendation declares its `channel`** — `aeo`, `seo`, or `both` —
and the title states a channel-specific action, never generic advice. The
surfaces reward different things, and the wording must reflect the split:

- `aeo` — tactics that win *citations in AI answers*: presence in the
  third-party listicles and roundups engines cite, comparison/FAQ content
  phrased as direct answers, entity-first copy engines can quote. Example:
  "Pitch inclusion in the 3 listicles engines cite for 'best AI website
  builders' to improve AI-answer visibility."
- `seo` — tactics that win *rankings*: target keyword pages, internal linking,
  difficulty-appropriate keyword picks from `seo_summary`. Example: "Publish a
  comparison page targeting 'website builder for small business' (2,400/mo,
  rank —) to improve Google visibility."
- `both` — only when one action genuinely moves both surfaces (a comparison
  page that ranks AND is quotable), and the rationale must state the mechanism
  for each surface separately.

**Per-engine guidance belongs on the recommendations it changes.** The answer
engines weigh sources differently — one leans on community threads and review
roundups, another follows the search index it is built on, another favors
sources its own crawler can read cheaply. When a recommendation's mechanism is
engine-specific, say which engines it targets and why in the rationale, and
reflect the split on the hosted competitor-playbook page. Derive engine claims
from the snapshot's `engine_share` / `query_runs` evidence — which engines were
measured and where the brand appeared — never from folklore.

**Every content recommendation is an executable brief, not a topic.** "Create a
post about X" is a rejected shape. The `title` names the asset; `content_brief`
carries the exact working headline and the core claims the asset must state;
`key_elements` lists the concrete on-page elements it must include — the
conversion device (for a travel brand: a Book Now button linking to checkout),
the comparison table with the named competitors, the FAQ block, the schema
markup. The bar: a Content or Web Developer agent (or the user) can build the
asset from the brief alone, without a follow-up question. `content_brief` stays
`null` only for recommendations that produce no asset (a config change, a
listing submission — and even a pitch names the publication and the angle in
`key_elements`).

- Default copy guidance: lead with the entity name in headlines; answer the
  buyer's literal question in the first paragraph; prefer formats engines
  already cite for the topic (check `format` gap evidence).

## Report structure (Ahrefs-shaped)

The report JSON mirrors the Brand Gap page. The `report` fields **carry the
diagnosis assembled by the Diagnose stage — copy its content into them; never
regenerate them from the snapshot** (regeneration discards the verified
mechanisms and reduces `competitor_comparison` to restated scoreboard numbers —
the exact failure this stage exists to prevent). Each `competitor_comparison`
entry's strengths state what the diagnosis verified the competitor has or does,
not its rank and share. This stage adds `recommendations` and submits the whole
payload. Exact payload for `kite-aeo submit-report payload.json`:

```json
{
  "application_id": "<uuid from the task>",
  "report": {
    "generated_on": "YYYY-MM-DD",
    "positioning_basis": "confirmed" | "inferred",
    "executive_summary": {"key_insights": [], "opportunities": [], "threats": [], "next_steps": []},
    "scorecard": [{"metric": "...", "unit": "percent"|"rating"|"text", "self_value": "...", "competitor_values": [{"name": "...", "value": "..."}]}],
    "gap_findings": [{"dimension": "<one of the six>", "measured": "...", "gap": "...", "severity": "high"|"medium"|"low", "suggested_action": "..."}],
    "search_findings": [{"keyword": "...", "search_rank": 3, "monthly_searches": 2400, "has_ai_overview": true, "ai_presence": "0 of 2 answers", "finding": "...", "severity": "high"|"medium"|"low"}],
    "query_type_findings": [{"query_type": "...", "example": "...", "responses_with_brand": 0, "responses_total": 0, "note": "..."}],
    "external_citations": {"top_domains": [], "insights": []},
    "competitor_comparison": [{"name": "...", "strengths": [], "weaknesses": [], "opportunities": []}],
    "what_changed": ["<cross-run delta with exact numbers>", "..."]
  },
  "recommendations": [{"rec_id": "kebab-slug", "rank": 1, "kind": "on_site"|"off_site", "execution_lane": "platform"|"platform_assisted"|"user_only", "channel": "aeo"|"seo"|"both", "title": "...", "rationale": "...", "competitor_evidence": "<observed competitor pattern with names, numbers, and est. traffic — or null>", "content_brief": "<exact working headline + the claims the asset must state — or null>", "key_elements": ["<must-include element, e.g. 'Book Now button linking to checkout'>"], "expected_impact": "<the observable leading indicator>", "caveat": "<the honest limit or dependency — or null>", "priority": "high"|"medium"|"low", "is_alternate": false}],
  "report_md": "<the full human-readable report — synthesis citing snapshot numbers; archived in the wiki, not the hosted action sheet>"
}
```

Before submitting, verify the payload: every recommendation carries a valid
`rec_id`, `kind`/`execution_lane` pairing, `channel`, and a leading-indicator
`expected_impact`; ranks 1-10 are exactly the primaries; every number traces to
the diagnosis. **Then run the freshness check** — a cross-check against the
newest snapshot, not a second source: take each figure in `scorecard` and
`competitor_comparison` (every brand's rank, visibility, mentions, share) and
confirm the snapshot contains that exact value. A figure the snapshot does not
contain was copied from the superseded previous report rather than the
diagnosis; go back to the diagnosis for the correct one. A
`competitor_comparison` that still names last run's leader, or shows a
percentage this run did not measure, is a failed submit — fix it before calling
`submit-report`, not after. Sections with no evidence stay empty lists — the
page hides empty sections; never pad them. A rejected submit (HTTP 422) means a
shape violation — fix and resubmit. A 409 means no measurement snapshot
exists — that should have blocked in the Diagnose stage's pre-flight; record
`Blocked: missing-snapshot` with `set-task-result` and stop rather than
retrying.

**The report is self-sufficient.** A first-time reader sees this report with no
prior one to compare against, so every section states absolute, current
findings ("Kite appears in 1 of 2 AI-website-builder answers"), never relative
ones ("up from before", "improved since last run", "as previously noted").
Cross-run comparisons live in exactly one place: the `what_changed` list (and
its counterpart section in `report_md` and the hosted page), each entry with
exact numbers from both runs ("share of voice 0% → 6.4%"). On the first report,
`what_changed` stays empty. Before submitting, scan every report field and
`report_md` for relative wording ("improved", "up from", "previously", "since
last") and rewrite any hit outside `what_changed` as an absolute statement.

**Write for the team's readers.** Read `/efs/knowledge/preferences/` and honor
any writing preferences recorded there (plain-language rules, formats the team
asked for). Default register: plain language, "you"-focused, no internal
workflow jargon — a stretched founder should act on the report without a
glossary.

**Track what you discover.** When synthesis surfaces a durable candidate the
workspace should keep measuring — a topic the answers keep circling that the
tracked list misses, a keyword worth ranking for, a competitor the leaderboard
names that the SEO stack has not confirmed — register it with the shared
tracking grammar: `kite-aeo track <application_id> <topic|keyword|competitor> "<value>" "<one-line evidence>"`.
One call per candidate, only for durable candidates with snapshot evidence —
never bulk-import a leaderboard.

The submit response returns `report_url`, the stable route Generalist must
preserve if the CMO selects a findings page. It is a handoff value, not
evidence that this task published or verified a hosted page.

## Findings-page handoff

After a successful submit, keep the task result bounded. Identify the page kind
as `Brand Gap`; give the exact paths to `current.md`, the newest snapshot and
readiness file, the diagnosis, `gap-report.json`, and `gap-report.md`; then
include the full source URLs, material qualifications, and `report_url` route
hint. This is the complete source handoff for the CMO to pass to one Generalist
task without re-running measurement or inventing missing data.

The Generalist loads `dashboard-building` and reads its
`references/brand-gap-report.md` companion for the complete four-page content,
data, route, and escaping contract. Do not squeeze that specification into the
1500-character digest. This source task never runs `kite-projects submit`.

## Digest

Your digest: positioning basis, the 2-3 sharpest gap findings with numbers,
where the brand already ranks (one line), the top 3 recommendations by rank
with their `rec_id`s, channel labels ("[AEO]"/"[SEO]"/"[both]"), execution
lanes, one line on what changed since the previous package when one existed,
full source URLs, exact wiki paths, every material qualification, and the
stable route hint. Label the route as unverified until Generalist publishes it.
The CMO applies `work-delivery` to this digest and never treats the source
task as the findings-page builder.
