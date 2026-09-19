# Diagnose lane — mechanics

Read this file when executing the Diagnose lane. Turn measured snapshots into
judged findings: where the brand stands versus where it wants to stand, and
why. This stage completes with the comparison as its result — the user reads it
before recommendations exist.

Pre-flight, in order:

1. Confirm the newest snapshot actually carries standings — a non-empty
   `leaderboard` or `share_of_voice`. None present, or no snapshot at all →
   `Blocked: missing-snapshot` and stop. A snapshot file is not evidence of a
   measurement: a run whose provider analysis timed out or failed still submits
   one, with every visibility array empty. The platform refuses report submits
   whose latest snapshot has no standings, so proceeding past this cannot
   succeed — it only spends a diagnosis run and a recommendations run to arrive
   at that refusal. The only numbers you may cite are the snapshot's and those
   returned by the `kite-aeo` evidence commands this stage names; a diagnosis
   is never built from web research.
2. Check for a previous report; if one exists, reading it is required —
   Recommend's `rec_id` continuity rule depends on it.

## Inputs (read, never recompute)

- `snapshots/<date>.json` — the newest one is your evidence base; its numbers
  are the only numbers you may cite. Its `seo_summary` block (when present) is
  the search-side evidence: top ranked keywords with rank, monthly searches,
  difficulty, and whether Google shows an AI Overview for them.
- `current.md` — evergreen measured state; per the shared wiki-layout rule, the
  snapshot wins when they disagree.
- `desired-associations.md` — the user-confirmed positioning, when present.
  When absent, infer positioning; on any conflict between inference sources the
  priority order is `positioning.md` > `brand/voice.md` > `website/state.md` —
  the higher source wins outright. Set `positioning_basis: "inferred"` so every
  surface labels the report accordingly. When the snapshot's `synthesis_md`
  records a provider-registration category mismatch (a stale registration
  describing a previous product), treat the historical metadata as evidence of
  a measured mismatch to correct, never as a benchmark for the current
  positioning.
- `readiness/<date>.json` — the exact agent-readiness probe outputs. The newest
  file feeds the hosted page's "Agent readiness" subsection verbatim. Absent
  when no probe has run yet.
- `/efs/knowledge/competitors/` — competitor profiles for the comparison
  section. A top-level wiki directory, outside this application's `aeo/`
  subtree.

## The six gap dimensions

Judge desired vs. actual along exactly these dimensions (the `dimension` field
values):

| Dimension | Question it answers |
| --- | --- |
| `volume` | How often does the brand appear vs. competitors (share of voice, leaderboard)? |
| `narrative` | Is the brand described as it wants to be, or as something else? |
| `topic` | Does it surface in the topics it wants to own (category presence)? |
| `format` | Which content formats do engines cite for these topics, and does the brand have them? |
| `external_mentions` | Is it present in the third-party sources engines cite (listicles, reviews)? |
| `brand_vs_category` | Do answers name the brand, or only a generic category description? |

Severity is `high` / `medium` / `low`, ranked by distance from the desired
positioning alone; consult frequency (how often the surface appears in tracked
prompts) only to order findings whose distance is equal. A badly-missed rare
surface therefore outranks a slightly-missed common one. Confirmed and inferred
positioning rank identically — `positioning_basis` labels the report, it never
changes the math.

## Search findings (the SEO × AEO join)

When the snapshot carries `seo_summary`, build `search_findings`: for each
topic where the two surfaces disagree, one row joining the search evidence to
the AI-answer evidence. Both directions are findings:

- **Demand without AI presence** — the site ranks for a keyword (or holds a
  target pick) with real volume, an AI Overview exists for it, and the brand is
  absent from the topic's AI answers ("rank #3, 2,400/mo, AI Overview present —
  0 of 2 AI answers"). These are the highest-leverage gaps: proven demand, an
  existing AI surface, and no presence.
- **AI presence without demand capture** — the brand appears in AI answers for
  a topic it does not rank for: a defend-and-extend finding (the AI surface is
  won; the search surface is not).

Populate every field from the snapshot (`seo_summary.top_keywords` /
`target_keywords` for the search side; `category_presence` / `query_runs` for
the AI side); `ai_presence` states the count in plain words. No `seo_summary` →
`search_findings` stays empty; never guess search numbers.

## Competitor evidence (what they demonstrably do)

This is the comparison the user asked for, and it is never optional: for each
brand ranked above (or tied with) the measured brand, say what the measurement
shows it has that the measured brand lacks — and why that plausibly drives its
standing.

**Attribute the cited pages by reading them.** The snapshot's `citation_urls`
name the pages the engines actually cited for these topics, but neither the
snapshot nor the provider says which brands each page features — so you verify
it directly: fetch each cited URL (webfetch, or `kite-research extract` with
"which of these brands does this page name: <leaderboard brands>"), capped at
the top ~6 URLs by citation count, and record per page which leaderboard brands
it lists, its format (roundup, comparison, docs, community thread), and whether
the measured brand appears. A page that fails to fetch is recorded as
unverified — never guessed.

**One evidence pass per competitor.** For every competitor on the snapshot's
leaderboard at or above the brand (and every confirmed competitor in
`competitors/`), combine the page-verification results with the snapshot's
`query_runs` and `category_presence`: which verified cited pages feature it,
which topics it wins, what its mention/share numbers are. Each competitor gets
its own evidence block with names and numbers ("Budibase: 16 mentions, featured
on appsrhino.com and zite.com roundups — both cited for 'website audit tool'
answers; the brand appears on neither"). This mining uses the measurement plus
public cited pages — it must be produced even when every other data source is
down.

**Search-side traffic is an enrichment, never a precondition.** When
`kite-aeo competitor-seo <competitor domain> <application_id>` succeeds (7-day cache),
append its `est_monthly_visits` and ranked-keyword evidence to that
competitor's block. When it fails, continue with the citation-based block
alone — the platform alerts the team about the source failure internally;
user-facing output never mentions providers, credits, or internal service
names.

A shared pattern (two or more competitors above the brand exhibiting the same
mechanism) is the strongest finding — name it explicitly. Only measured
competitors, only observed patterns.

## Citation-source opportunity map (where the brand could appear)

From `citation_domains` / `citation_urls` and the competitor patterns, list the
third-party sources the engines demonstrably cite for the tracked topics that
the brand is absent from — the listicles, review sites, community threads, and
roundups where presence is winnable. Each entry names the source, the evidence
it is cited (counts from the snapshot), and which competitors appear there.
This map is the raw material for Recommend's off-site recommendations; keep it
to sources with snapshot evidence.

## Name the wins, not only the gaps

The snapshot's `category_presence` and `query_runs` show where the brand
already appears (`prompts_with_brand > 0`, `brand_mentioned: true`). Record
those alongside the gaps — they anchor what to defend and make the gaps
credible.

## Result + handoff

Assemble the diagnosis as the report fields Recommend's submit payload
consumes — `executive_summary`, `scorecard`, `gap_findings`, `search_findings`,
`query_type_findings`, `external_citations`, `competitor_comparison` (built
from the per-competitor evidence blocks — mechanisms, never restated scoreboard
numbers), `what_changed` (cross-run deltas with exact numbers from both runs;
empty on the first report). Before finishing, verify: every field is either
populated or deliberately empty (no evidence — never padded), every `dimension`
value is one of the six, every entry's numbers trace to the snapshot or a
`kite-aeo` evidence command from this run, and every leaderboard competitor at
or above the brand has an evidence block.

**This stage submits nothing to the platform.** `submit-snapshot` belongs to
Measure and `submit-report` to Recommend; the diagnosis file is the one
artifact you write, through `kite-knowledge submit`. Submitting from here would
overwrite a stage artifact you did not produce — put every finding in the
diagnosis and let Recommend carry it into the report.

Then persist the diagnosis before you finish, in this order:

1. **Write it to the wiki** at `aeo/<application_id>/diagnosis/<date>.md`,
   where `<date>` is the snapshot date you diagnosed — all report fields above,
   as structured markdown plus a fenced JSON block — then run
   `kite-knowledge submit`. This file is the handoff (see the shared cross-task
   rule): a diagnosis that exists only in your task result is unreachable by
   stage three and blocks the chain.
2. **Record the digest** with `set-task-result`. It leads with the sharpest
   mechanism findings in plain words ("every brand above you is cited by
   category roundups you're absent from — Budibase via X and Y, ToolJet via
   Z"), not scoreboard numbers the measurement stage already reported, and ends
   with the pointer stage three needs: "Recommendations ready to run for
   application <application_id>, diagnosis at
   `aeo/<application_id>/diagnosis/<date>.md`."
