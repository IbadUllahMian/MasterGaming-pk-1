# Deep-dive report — skeleton and per-section sourcing

Load condition: the Deep-dive report lane only, when building the report. The
Targeted question and Brand profile lanes never need this file.

## First, always: the datasource batch

Run the company datasources in parallel (per the skill's parallel-call rule),
before any web-research verb: the Context.dev product-catalog and sitemap
operations feed §1 and `company-brand` feeds §2 and §4; `company-competitors`
(§5–§6 need it),
`company-pagespeed` (§7) and `company-community-signals` go in the same
batch. Keep each response at hand. `web-research` verbs (`extract`/`deep`/
`search`/`history`/`screenshot`/`mentions`) then fill the gaps these sourced
datasources leave — they never take their place (a missing brand color comes
from `company-brand`, not from eyeballing the site).

## Report skeleton

One markdown report with this skeleton — sections in this order, citations
inline, screenshot URLs embedded where visual:

```markdown
# Deep dive: [Company]
## Identity and positioning
## Brand snapshot
## Website evolution
## Firmographics
## Signals
## Competitive landscape
## Search and AI-answer standing
## Community voice
## Leadership               <!-- top executives: title, LinkedIn, professional email -->
## Ranked opportunities
```

## Per-section sourcing

1. **Identity and positioning.** Ground the section in the
   runtime-discovered product-catalog and site-structure data; `extract` the
   pricing page — the one thing that source reliably misses. Then one
   `kite-research deep` run (processor `base`; `core` only when the task
   itself says thorough, or the purpose is a prospect call or similarly
   high-stakes decision) with a brief like: `"What does <company> sell, to
   whom, at what price, and how does it position itself in <category>?
   Include recent product or strategy changes."` Keep the citations.
2. **Brand snapshot.** The `company-brand` data covers the registered
   identity (palette, fonts, logos, socials); `assets` covers the imagery
   they actually ship. Note both gaps: how they describe themselves versus
   how the site reads, and the registered brand versus what the site ships.
3. **Website evolution.** `history` returns at most one snapshot per month
   and, when its cap bites, the **most recent** ones — a single call cannot
   span a long archive. Make two: `history <url> <founding-yyyyMMdd>` for the
   recent era (founding year from `company-brand`; when it lacks one, a quick
   search — the founding bound keeps a previous domain owner's history out),
   and a second bounded a year or two past founding (`to_date`) for the
   earliest usable capture. Pick 4–6 snapshots roughly evenly spaced across
   the company's life — always the earliest usable one and the current site —
   and `screenshot` their archive URLs. Two sentences on what changed:
   repositioning, redesigns, pivots. This section photographs well — keep the
   screenshot URLs in the report.
4. **Firmographics.** Use `tool-discovery-execution` for current
   company-firmographics data by domain: founding year, headcount and its
   growth trend (often the single most telling number in the report),
   funding, and categories. Corroborate founding, size, and socials against
   `company-brand`; when the sources disagree, report both values rather than
   picking one. If no suitable structured route supports firmographics by
   domain, use only the corroborated fields available from `company-brand`
   and mark the rest unavailable.
5. **Signals — where money and people are going.** `kite-research
   company-signals <domain> <yyyy-mm-dd>` and `kite-research company-hiring
   <domain> <yyyy-mm-dd>`, bounded to roughly the last 12 months; both are
   independent calls, so background them in the same batch as the datasources
   above. Funding and expansion events give the trajectory; open roles give
   the near-term roadmap. Report each signal with its date and source URL —
   cite those, not the tool. Where that URL sits varies by endpoint: a job
   opening carries `url` on the record, while a news event links to its
   article through `included`. When the purpose is a prospect call, this
   section supplies the "why now": carry its strongest item into the
   opportunities.
6. **Competitive landscape.** Run the `competitor-research` protocol (its own
   skill), seeding its candidate pool with the `company-competitors` result —
   that result counts as one source; every entry still passes that protocol's
   verification and tiering. For an onboarding report, Tier 1 plus the
   dominant substitute is enough depth.
7. **Search and AI-answer standing** (when the purpose is onboarding or
   growth). Use `tool-discovery-execution` for current organic-ranking
   evidence, and `kite-research company-ai-visibility <domain>` for AI-answer
   visibility — the brands AI assistants surface against the company, with
   ranks and share of voice (it reuses or registers the team's visibility
   site for the domain; read `status`, then `reason`, as its usage text
   defines them, and follow it on whether to call again). This is the same
   sourcing `competitor-research`'s standings lane owns for standalone
   standings asks; tracked AEO measurement stays with
   `ai-search-visibility`. Compare the company's keywords and visibility
   with its Tier-1 competitors, and use `company-competitors` for
   buyer-persona framing. Add one sentence from the `company-pagespeed`
   mobile and desktop scores — a slow site is discoverability evidence and
   can back a ranked opportunity. If no suitable structured route supports
   one of the two visibility capabilities, use `web-research` only for
   publicly indexed ranking evidence, mark direct AI-answer visibility
   unavailable, and preserve that limitation in the paragraph.
8. **Community voice.** `mentions "<company>"` for Hacker News; `search` for
   community and review-site threads. Where a named platform is involved,
   take it via `tool-discovery-execution` first — its integration is the only
   first-party source; when its search returns no ready integration, follow
   its §5: a `search` naming that platform's domain is unverified
   indexed-search evidence, cited as such until the integration confirms it.
   Quote 2–3 sentiments with links, drawn from the highest-engagement threads
   (points, comments) — at least one positive and one critical when both
   exist. No mentions is itself a finding (nobody is talking about them).
9. **Leadership.** A company deep dive proactively includes the people the team
   could learn from or approach unless the user excludes people. Name the CEO or
   founders and the heads of the functions the report's purpose cares about
   (CTO/CIO, CMO, CRO, or COO as relevant). Load `prospect-research`, send the
   leaders as one batch to the routed work-email capability it names, and return
   one row per leader with current title, LinkedIn URL, source URL, and
   professional email with every material qualification. A description or
   count of found addresses does not deliver the rows. For an external company,
   retain leaders whose professional email remains missing and label that field
   with the enrichment capability's terminal outcome. For the self company,
   source leadership publicly
   without paid enrichment.
10. **Ranked opportunities.** Close with 3–5 moves, ranked by expected impact
   on the company's actual goals, each traceable to evidence above
   ("competitors A and B own the comparison-page SERP you're absent from")
   and confidence-labeled per your evidence standards. Evidence outranks
   impact: a lower-impact move you can evidence beats a bigger claim you
   cannot — leave the unevidenced one out. A short justified list beats a
   long list of observations.
