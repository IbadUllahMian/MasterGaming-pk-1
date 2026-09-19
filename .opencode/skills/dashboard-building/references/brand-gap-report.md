# Brand Gap Findings Page Contract

Use this companion only when the task identifies the page kind as `Brand Gap`
and supplies an application id plus exact wiki paths from the completed
visibility pipeline. Use those files as internal data inputs; do not cite, link,
or name them on the published pages. Preserve the original external source URLs
from the supplied records for reader-facing citations. Do not re-run
measurement, research missing fields, or infer values that are absent from the
supplied data.

## Routes and ownership

Build four App Router pages under stable slugs. Update these same routes on a
refresh, add their registry entries in one change, and link them with their
deterministic portal-relative paths:

| Page | Route slug | Carries |
| --- | --- | --- |
| Main — executive summary + actions | `brand-gap-<application_id>` | The verdict, subpage views, and recommendations |
| Agent readiness | `brand-gap-<application_id>-agent-readiness` | The readiness scan, check by check |
| Rankings | `brand-gap-<application_id>-rankings` | Placement per engine and topic, versus competitors |
| Competitor playbook | `brand-gap-<application_id>-competitors` | What competitors do and why it works for them |

Publish all four routes in this one Generalist task. Follow the owning skill's
verification contract for the current live content and canonical main-page URL.
Correct a publish failure on this same task and route; never create a
replacement page task or alternate URL.

Every number traces to the snapshot, report JSON, or readiness file supplied in
the task. State an empty required dataset plainly instead of padding it.

## Main page

Include the one-sentence verdict, a short absolute-statement summary, and the
run's defining numbers: brand mentions versus active prompts, main-category
presence, the most differentiating leader statistic, and readiness score.
Include each subpage's sharpest finding and link plus all recommendations.

Every recommendation carries its channel, execution lane, priority, competitor
evidence with traffic numbers, content brief and key elements, and expected
impact. Keep a material qualification beside a recommendation when it changes
how the recommendation should be interpreted. Include the measurement window,
engines measured, positioning basis, and `what_changed` when a prior run exists.
State when no prior run exists. Keep history in the internal source records,
not on the hosted page.

## Agent-readiness page

Headline the `score`/100 with `earned`/`weight` points, then the scan date
(`checked_at`; when `cached` is true add "scanner result from <`scanned_at`>") and scanned domain, and these categories in order: crawl access, content,
structured data, AI guidance, brand. For each category include its
`earned`/`weight` and `passed`/`total`, then every check's `name`, `status`,
`weight`, `earned`, and `evidence` string from the newest
`readiness/<date>.json`. A check with `scored: false` (brand presence, or a
`not_applicable` status) has an `INFO` verdict and is excluded from the score.
Render each `warning`/`fail` check's `recommendation` (summary, with
`skill_url` as a link when present) beside it; when such a check has none,
state that remediation guidance was unavailable. Render a **Top fixes** block
from `top_fixes` in order (name, points to gain out of weight, summary, link)
when non-empty; otherwise state that every scored check passed. Mention
`scanner_score` only as "public scanner headline" with the
`scanner_report_url` link — it counts developer-platform checks this report
leaves out. Never recommend fabricating capability files.
When the newest file predates this scoring (a `level` field, or snake_case
check ids with no `weight`), headline whatever score it holds and render only
the categories and checks the file holds; never invent weights or fixes. When
no readiness file exists, state exactly:
`No agent-readiness probe recorded for this run`.

Escaping is mandatory because the probed site controls parts of this data.
Nothing from the file may be inserted as markup. These fields arrive
pre-escaped — `name`, `evidence`, `recommendation.summary`, and each
top-fix `name` and `summary` — insert them as element text, never into
attributes or script, and do not escape them again. `skill_url` and
`scanner_report_url` are already validated http(s) links. Escape every other value
yourself.

## Rankings page

For every engine present in `engine_share` or `query_runs`, include
`category_presence`, leaderboard/share-of-voice standings, and the brand's own
value, including zero when absent. When a provider metric is identical across
rows, call it non-differentiating and emphasize the metric that differs.

Include `seo_summary` ranked keywords with rank, volume, and AI Overview
presence plus the `search_findings` joins. Name every engine not measured and
never invent its number. Include every `query_runs` row with query text
verbatim, engine, category, topic, and whether the brand appeared;
`brand_mentioned: null` means `unavailable`. Never paraphrase, deduplicate, or
truncate the measured queries.

## Competitor-playbook page

For every measured competitor, include observed advantages from
`competitor_comparison`, citation reports, and the diagnosis's `competitor-seo`
evidence: listicles and citation sources, ranking keyword pages, cited formats
and engines, comparative estimated visits, and citation counts. Pair every
observed pattern with the mechanism reasoning required by
`competitor_evidence`, engine-specific where the evidence is. Include only
measured competitors and observed patterns.
