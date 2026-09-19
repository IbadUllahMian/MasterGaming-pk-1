# Growth checklist — 138 questions in 13 batches

The platform's pipeline applies the same checklist from `growth_grader/analysis/checklist.yaml`; when a question changes there, change it here in the same PR so the Analyst and the pipeline keep deciding alike.

Every question is quoted verbatim into its record — never reworded, shortened, or retitled. Each heading reads `id · emphasis group · contract status`; ⚖ marks a comparative question, which is answered per company like every other question and once more over the target and every rival together in the comparative pass. `Evidence` lists the contract's citations as the dossier carries them; `Slices` names the dossier slices those citations read — the evidence block for the question, and the slices whose statuses decide whether it can be asked at all. A question marked **Decided: not assessed** is never put to the evaluator: record it with that reason, verbatim, for every company. `Note` is the contract's own evidence note, quoted for parity; a Note that names a lookup (web search, EDGAR) records what the contract's author expected, not an instruction — answer from the batch's slices and say in `limit` that the lookup was not performed.

Comparative questions: 0.14, 0.15, 0.16, 1.3, 1.4, 1.5, 1.17, 1.23, 4.3.

## Batch 1 — Section 0 — Company, Market, and Positioning Context

17 questions (0.1–0.17). Slices this batch reads: `ai_visibility`, `branded_search`, `community`, `company_series`, `crawl`, `founders`, `page_capture`, `public_records`, `seo`, `sitemap_history`, `trustpilot`, `wayback`.

### 0.1 · Message clarity · JUDGMENT

Can you tell what the company sells, who buys it, and how it charges?

- Evidence: `company.crawl`, `company.page_capture.homepage`
- Slices: `crawl`, `page_capture`
- Note: `company.page_capture.pages[]` (homepage + pricing markdown, screenshots), `company.crawl`

### 0.2 · Message clarity · JUDGMENT

Who does the company say the product is for?

- Evidence: `company.page_capture`, `company.wayback.pages`
- Slices: `page_capture`, `wayback`
- Note: `company.page_capture`, `company.wayback.pages`

### 0.3 · Message clarity · PARTIAL

Are the buyer and the user different people?

- Evidence: `company.page_capture`
- Slices: `page_capture`
- Note: `company.page_capture` (homepage/pricing); case-study page content: ADD:12

### 0.4 · Conversion path · CAPTURED

What action does the company want a visitor to take?

- Evidence: `company.crawl.conversion_motion`
- Slices: `crawl`
- Note: `company.crawl.conversion_motion` + `.conversion_ctas`

### 0.5 · Platform adoption · CAPTURED

Where do people actually discover or adopt the product?

- Evidence: `company.community.surfaces`
- Slices: `community`
- Note: `company.community.surfaces[]`, `.github`, `.app_store`

### 0.6 · Market context · CAPTURED

How old is the company?

- Evidence: `company.company_series.funding_rounds.date`, `company.wayback.footprint.first_year`
- Slices: `company_series`, `wayback`
- Note: `company.company_series.funding_rounds[0].date`, `company.wayback.footprint.first_year`

### 0.7 · Message clarity · JUDGMENT

What problem or outcome does the company advertise?

- Evidence: `company.page_capture`, `company.wayback`, `company.wayback.pages.snapshots.skeleton.desc`, `company.wayback.pages.snapshots.skeleton.h1`, `title` (any of: community, founders, public_records, trustpilot, wayback)
- Slices: `community`, `founders`, `page_capture`, `public_records`, `trustpilot`, `wayback`
- Note: `company.wayback` skeletons (`title`/`desc`/`h1`), `company.page_capture`

### 0.8 · Message clarity · JUDGMENT

Does the company say why a buyer should choose it over the alternatives?

- Evidence: `company.crawl.comparison_pages`
- Slices: `crawl`
- Note: `company.crawl.comparison_pages[]`, homepage markdown

### 0.9 · Customer proof · PARTIAL

Do reviews and case studies support the difference the company claims?

- Evidence: `company.community.app_store.recent_reviews`, `company.trustpilot.reviews.text`
- Slices: `community`, `trustpilot`
- Note: `company.trustpilot.reviews[].text`, `company.community.app_store.recent_reviews` vs. homepage claims; case-study content: ADD:12

### 0.10 · Reviews · JUDGMENT

Do customers describe the product or its main use differently from the company?

- Evidence: `company.community.hn_stories`, `company.distribution.mentions` — **missing**: no dossier field carries this
- Slices: `community`
- Note: review corpora + `company.community.hn_stories`, `company.distribution.mentions`

### 0.11 · Content coverage · PARTIAL

Are there dedicated pages for the main use cases?

- Evidence: `company.sitemap_history.snapshots`
- Slices: `sitemap_history`
- Note: `company.sitemap_history.snapshots` (current paths); confirming the pages' content: ADD:12

### 0.12 · Market context · ADD:3

Is search demand for the category growing, flat, or shrinking?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:3).

### 0.13 · Market context · PARTIAL

Do buyers and competitors use a consistent name for the category?

- Evidence: `company.ai_visibility.buyer_questions`
- Slices: `ai_visibility`
- Target only: every slice here is captured for the target alone; record it for a rival as not assessed with the target-only reason.
- Note: `target.ai_visibility.buyer_questions[]`; SERP vocabulary: ADD:2

### 0.14 · Market context · PARTIAL · ⚖ comparative

How many alternatives appear repeatedly in search results, reviews, buyer guides, and AI answers?

- Evidence: `company.ai_visibility.leaderboard`, `target.competitor_discovery.candidates[]` — **missing**: no dossier field carries this
- Slices: `ai_visibility`
- Target only: every slice here is captured for the target alone; record it for a rival as not assessed with the target-only reason.
- Note: `target.ai_visibility.leaderboard[]`, `target.competitor_discovery.candidates[]`, review mentions; buyer-guide inclusion: ADD:2

### 0.15 · Market context · CAPTURED · ⚖ comparative

Which competitors are gaining search demand, reviews, proof, or attention?

- Evidence: `company.branded_search`, `company.public_records.linkedin_hits`, `company.seo.monthly`, `company.trustpilot`
- Slices: `branded_search`, `public_records`, `seo`, `trustpilot`
- Note: rival-parity series: `seo.monthly`, `company_series.headcount_monthly`, `trustpilot`, `branded_search`

### 0.16 · Market context · CAPTURED · ⚖ comparative

Do the competitors named by the company match the competitors buyers encounter?

- Evidence: `company.crawl.comparison_pages`, `company.ai_visibility.leaderboard`, `target.competitor_discovery.candidates` — **missing**: no dossier field carries this
- Slices: `ai_visibility`, `crawl`
- Note: `company.crawl.comparison_pages` (declared) vs. `target.competitor_discovery.candidates` (demand) vs. `target.ai_visibility.leaderboard` + `.vendor_competitors` (consideration)

### 0.17 · Market context · PARTIAL

Do buyers compare the product with manual work, agencies, spreadsheets, or doing nothing?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: review language (captured); SERP/forum "how to" landscape: ADD:2/ADD:9

## Batch 2 — Section 1 — Acquisition and Demand Capture — Search demand

14 questions (1.1–1.14). Slices this batch reads: `branded_search`, `company_series`, `seo`, `sitemap_history`.

### 1.1 · Search visibility · CAPTURED

Does the company rank for non-branded searches that indicate the buyer's problem or purchase intent?

- Evidence: `company.seo.rankings`, `main_intent` — **missing**: no dossier field carries this, `company.seo.rankings.position`, `search_volume` (any of: branded_search, seo)
- Slices: `branded_search`, `seo`
- Note: `company.seo.rankings[]` (`is_branded=False`, `position`, `search_volume`, `main_intent`)

### 1.2 · Search visibility · CAPTURED

Is the number of relevant non-branded searches it ranks for growing or shrinking?

- Evidence: `company.seo.monthly.organic_keywords`
- Slices: `seo`
- Note: `company.seo.monthly[].organic_keywords` + position buckets

### 1.3 · Search visibility · CAPTURED · ⚖ comparative

Is estimated organic traffic growing or shrinking?

- Evidence: `company.company_series.web_traffic`, `company.seo.monthly.organic_traffic`
- Slices: `company_series`, `seo`
- Note: `company.seo.monthly[].organic_etv` + `company.company_series.web_traffic_monthly` (two independent estimators)

### 1.4 · Search visibility · CAPTURED · ⚖ comparative

For the same buyer searches, does the company rank as often and as highly as its competitors?

- Evidence: `company.seo.rankings`, `run.historical_search_standing.rows` — **missing**: no dossier field carries this
- Slices: `seo`
- Note: `company.seo.rankings` for all four companies; `run.historical_search_standing.rows`

### 1.5 · Search visibility · CAPTURED · ⚖ comparative

Which buyer searches do competitors rank for that the company misses?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (seo.monthly[].organic_pos_11_20), so it cannot be answered from this capture.
- Note: same ranking tables + `seo.monthly[].organic_pos_11_20`

### 1.6 · Search visibility · ADD:2

Does the company appear in featured snippets, People Also Ask, video results, and other search features?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:2).

### 1.7 · Search visibility · CAPTURED

Is branded search demand growing, stable, or shrinking?

- Evidence: `company.branded_search.terms.monthly`
- Slices: `branded_search`
- Note: `company.branded_search.terms[].monthly`, `.ambiguous_terms` (collision caveat)

### 1.8 · Search visibility · CAPTURED

What is the branded versus non-branded search mix?

- Evidence: `company.branded_search`, `company.seo.rankings.is_branded`
- Slices: `branded_search`, `seo`
- Note: `seo.rankings[].is_branded` split + `branded_search`

### 1.9 · Search visibility · ADD:2

What does a buyer see when searching the brand?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:2).

### 1.10 · Search visibility · PARTIAL

Does older content continue to rank?

- Evidence: `company.seo.rankings.url`, `company.sitemap_history`
- Slices: `seo`, `sitemap_history`
- Note: `seo.rankings[].ranking_url` × `sitemap_history` first-seen dates

### 1.11 · Search visibility · JUDGMENT

Do newly published pages begin ranking for the searches they target?

- Evidence: `company.seo.rankings.url`, `company.sitemap_history.deltas.added_sample`
- Slices: `seo`, `sitemap_history`
- Note: `sitemap_history.deltas[].added_sample` × current `rankings[].ranking_url`

### 1.12 · Content coverage · PARTIAL

Does the content cover the questions buyers ask across the journey?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: `sitemap_history` paths (journey-stage classification by path); page content: ADD:12

### 1.13 · Content coverage · ADD:12

Does the content contribute something original or merely restate the category?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:12).
- Note: content pages: ADD:12

### 1.14 · Search visibility · CAPTURED

Is the company gaining links from customers, partners, trade publications, and respected category websites?

- Evidence: `company.seo.backlinks`
- Slices: `seo`
- Note: `company.seo.backlinks_history[]` (counts, referring_domains, rank)

## Batch 3 — Section 1 — Acquisition and Demand Capture — AI and answer-engine visibility

5 questions (1.15–1.19). Slices this batch reads: `ai_visibility`, `crawl`.

### 1.15 · AI-answer visibility · CAPTURED

Does the company appear in AI answers to real buyer questions?

- Evidence: `coverage_pct` — **missing**: no dossier field carries this, `is_target` (any of: ai_visibility), `share_of_voice_pct` (any of: ai_visibility), `company.ai_visibility.leaderboard`
- Slices: `ai_visibility`
- Target only: every slice here is captured for the target alone; record it for a rival as not assessed with the target-only reason.
- Note: `target.ai_visibility.leaderboard` (`is_target`, `coverage_pct`, `share_of_voice_pct`), `.target_match` (None = the finding)

### 1.16 · AI-answer visibility · PARTIAL

Is the company described accurately in AI answers?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: answer excerpts when present (typed on the siftly SourceReport when absent)

### 1.17 · AI-answer visibility · CAPTURED · ⚖ comparative

Which competitors do AI answers mention for the same buyer questions?

- Evidence: `company.ai_visibility.leaderboard`
- Slices: `ai_visibility`
- Target only: every slice here is captured for the target alone; record it for a rival as not assessed with the target-only reason.
- Note: `target.ai_visibility.leaderboard[]` full ranked list

### 1.18 · AI-answer visibility · CAPTURED + JUDGMENT

Does the company appear on the websites that AI answers cite?

- Evidence: `cited_brands` — **missing**: no dossier field carries this, `company.ai_visibility.citation_domains`
- Slices: `ai_visibility`
- Target only: every slice here is captured for the target alone; record it for a rival as not assessed with the target-only reason.
- Note: `target.ai_visibility.citation_domains[]` / `.citation_urls[]` (`cited_brands`)

### 1.19 · AI-answer visibility · CAPTURED + JUDGMENT

Does the company's content give clear, direct answers that people and AI systems can quote?

- Evidence: `company.crawl.llms_txt`
- Slices: `crawl`
- Note: `company.crawl.llms_txt_present`/`_excerpt`, `.jsonld_types`, `.ai_crawler_rules`, homepage/pricing structure

## Batch 4 — Section 1 — Acquisition and Demand Capture — Third-party discovery and consideration

8 questions (1.20–1.27). Slices this batch reads: `community`, `public_records`, `sitemap_history`, `trustpilot`.

### 1.20 · Buyer-guide presence · ADD:2

Does the company appear in the listicles and buyer guides that rank?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:2).

### 1.21 · Buyer-guide presence · CAPTURED

Is the company listed on the review sites, directories, app stores, and marketplaces its buyers use?

- Evidence: `company.community.app_store`, `company.public_records.g2_hits`, `company.trustpilot`, `company.trustpilot.platform_total_reviews`
- Slices: `community`, `public_records`, `trustpilot`
- Note: `company.trustpilot` (`platform_total_reviews`, typed not_found), `company.company_series.review_platforms[]` (G2 count+rating), `company.community.app_store`

### 1.22 · Local findability · ADD

Is the company findable locally when location matters?

- **Decided: not assessed** — The evidence this question needs is not captured yet.

### 1.23 · Platform adoption · CAPTURED · ⚖ comparative

If adoption happens on another platform, is the company gaining ground there?

- Evidence: `company.community.app_store`, `company.community.github`, `historical_adoption` — **missing**: no dossier field carries this
- Slices: `community`
- Note: `community.github` (releases, stars, `historical_adoption`), `community.app_store` (dated reviews, version dates)

### 1.24 · Partnerships & events · PARTIAL

Do integration listings and partners put the company in front of buyers?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: `sitemap_history` paths; integrations/partners page content: ADD:12

### 1.25 · Community & word of mouth · PARTIAL

Do unaffiliated people recommend the company?

- Evidence: `author` (any of: community), `company.community.hn_stories`
- Slices: `community`
- Note: `community.hn_stories[]` (`author` enables the affiliation filter)

### 1.26 · Community & word of mouth · CAPTURED

Do third parties teach people how to use the product?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (company.distribution.mentions[]), so it cannot be answered from this capture.
- Note: `company.distribution.mentions[]` (channel=youtube)

### 1.27 · Community & word of mouth · CAPTURED + JUDGMENT

Do publications, newsletters, and podcasts that buyers follow cover the company?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (distribution.mentions[]), so it cannot be answered from this capture.
- Note: `distribution.mentions[]` (channel=press, podcast)

## Batch 5 — Section 1 — Acquisition and Demand Capture — Owned audience and community

7 questions (1.28–1.34). Slices this batch reads: `founders`.

### 1.28 · Owned audience · NOT-ASSESSED

Does the company have a following on channels its buyers use?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 1.29 · Owned audience · PARTIAL

Do people outside the company engage with its posts?

- Evidence: `company.founders.founders.posts`
- Slices: `founders`
- Note: `company.founders.founders[].posts[]` (reactions/comments/shares) — founder LinkedIn only

### 1.30 · Owned audience · NOT-ASSESSED

Does company-produced content reach beyond the existing audience?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 1.31 · Owned audience · CAPTURED

Does founder-led distribution matter for this company?

- Evidence: `connections` — **missing**: no dossier field carries this, `company.founders.founders`, `company.founders.founders.posts`
- Slices: `founders`
- Note: `founders.founders[]` (`connections`, dated `posts[]` w/ engagement)

### 1.32 · Community & word of mouth · NOT-ASSESSED

Do users post, reply to one another, and share their own work in the community?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: public GitHub discussions/forums only.
- Note: public GitHub discussions/forums only

### 1.33 · Community & word of mouth · NOT-ASSESSED

Is the community growing or shrinking?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 1.34 · Owned audience · NOT-ASSESSED

Does the company collect email addresses and actually email the list?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: capture points visible in homepage markdown.
- Note: capture points visible in homepage markdown

## Batch 6 — Section 1 — Acquisition and Demand Capture — Paid and outbound distribution

10 questions (1.35–1.44). Slices this batch reads: `company_series`, `sitemap_history`, `tools`.

### 1.35 · Paid advertising · ADD:1 + ADD:2

Does the company run paid search for queries that suggest buying intent?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:1, ADD:2).

### 1.36 · Paid advertising · ADD:1

Does the company run paid social or display advertising?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:1).

### 1.37 · Paid advertising · ADD:1

Does the company test different ad messages and creative?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:1).

### 1.38 · Paid advertising · ADD:1

Do ads send people to landing pages that match the ad?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:1).
- Note: ADD:1 destination URLs + Firecrawl fetch of destinations

### 1.39 · Paid advertising · CAPTURED

Is there evidence of retargeting?

- Evidence: `company.tools.ad_pixels`
- Slices: `tools`
- Note: `company.tools.pixels[]`

### 1.40 · Partnerships & events · PARTIAL

Does the company sponsor newsletters, podcasts, communities, or events its buyers follow?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (distribution.mentions), so it cannot be answered from this capture.
- Note: `distribution.mentions`; sponsor-list SERP queries: ADD:2

### 1.41 · Partnerships & events · JUDGMENT

Does the company use creator or influencer marketing?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (distribution.mentions[]), so it cannot be answered from this capture.
- Note: `distribution.mentions[]` (youtube) + LLM disclosure detection

### 1.42 · Growth loops & dependence · PARTIAL

Does the company have a referral or affiliate program?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: `sitemap_history` paths (referral/affiliate path presence); program-page content: ADD:12

### 1.43 · Partnerships & events · ADD:2

Does the company attend the conferences or trade shows its buyers attend?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:2).
- Note: exhibitor/speaker-list SERP queries: ADD:2

### 1.44 · Outbound sales · CAPTURED + JUDGMENT

Does the company have an outbound sales team?

- Evidence: `company.company_series.recent_job_titles`
- Slices: `company_series`
- Note: `company_series.recent_job_titles[]`, `.open_jobs_monthly`, `.headcount_monthly`

## Batch 7 — Section 2 — Conversion and the Buying Path

23 questions (2.1–2.23). Slices this batch reads: `crawl`, `page_capture`, `sitemap_history`, `tools`, `wayback`.

### 2.1 · Message clarity · JUDGMENT

Can a stranger understand the offer quickly?

- Evidence: `company.page_capture.homepage`
- Slices: `page_capture`
- Note: `page_capture.pages[]` (markdown + screenshot bytes in raw envelope)

### 2.2 · Message clarity · JUDGMENT

Does the page have one primary CTA or several competing CTAs?

- Evidence: `company.crawl.conversion_ctas`, `company.crawl.conversion_ctas`
- Slices: `crawl`
- Note: `crawl.conversion_ctas`, wayback skeleton `ctas[]`, screenshot

### 2.3 · Message clarity · JUDGMENT

Is there a clear reason for having several CTAs?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: same

### 2.4 · Message clarity · JUDGMENT

Do calls-to-action use specific or generic language?

- Evidence: `company.crawl.conversion_ctas`
- Slices: `crawl`
- Note: `crawl.conversion_ctas` verbatim

### 2.5 · Conversion path · PARTIAL

How many clicks, fields, and required steps separate a visitor from converting?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: raw homepage HTML (page_capture/tool_detection raw envelopes) for visible form fields

### 2.6 · Conversion path · JUDGMENT

Is a low-priced, simple product unnecessarily gated by sales, or a complex purchase forced into self-serve?

- Evidence: `company.crawl.conversion_motion`
- Slices: `crawl`
- Note: `crawl.conversion_motion` + pricing markdown

### 2.7 · Conversion path · PARTIAL

Do different audiences get separate, clearly labeled paths?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: `sitemap_history` paths + homepage markdown; segment-page content: ADD:12

### 2.8 · Pricing transparency · CAPTURED

Is pricing findable?

- Evidence: `company.page_capture.pricing_page.url`
- Slices: `page_capture`
- Note: `page_capture.pricing_url` (None = the finding), wayback pricing track

### 2.9 · Pricing transparency · JUDGMENT

Can a buyer tell which pricing tier is meant for them?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing-page markdown (`page_capture.pages[page_type="pricing"]`)

### 2.10 · Trust & procurement content · PARTIAL

Does the site answer the main questions that could stop a purchase?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: `sitemap_history` paths (security/FAQ/docs path presence); the pages' content: ADD:12

### 2.11 · Customer proof · JUDGMENT

Is social proof placed near signup, demo, pricing, and purchase CTAs?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: homepage/pricing screenshots + markdown

### 2.12 · Customer proof · ADD:12

Do testimonials and case studies name customers and give specific results?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:12).
- Note: case-study/customers page content: ADD:12 (wayback customers-track `text_excerpt` gives capped historical text)

### 2.13 · Customer proof · PARTIAL

Do the featured customers resemble the company's target buyers?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: homepage proof (captured) + case-study content: ADD:12

### 2.14 · Trust & procurement content · PARTIAL

Does the site answer the security, privacy, compliance, and procurement questions its buyers will ask?

- Evidence: `company.crawl`, `company.sitemap_history`
- Slices: `crawl`, `sitemap_history`
- Note: `sitemap_history`/`crawl` path presence; security/trust page content (incl. trust-center subdomains): ADD:12

### 2.15 · Conversion path · NOT-ASSESSED

Does the full public journey work on the devices the company says it supports?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 2.16 · Conversion path · ADD:4

Do the homepage, landing pages, pricing, forms, and signup load quickly without jumping around?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:4).

### 2.17 · Conversion path · NOT-ASSESSED

What happens after a demo or contact-sales form is submitted?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 2.18 · Conversion path · CAPTURED

Which analytics, testing, automation, and chat tools can be detected?

- Evidence: `company.tools`
- Slices: `tools`
- Note: `company.tools` (analytics/ab_testing/pixels/email_tools; empty-on-ok is a valid finding)

### 2.19 · Positioning history · CAPTURED

Has the target audience, category, problem, or claimed difference changed?

- Evidence: `company.wayback.pitch_evidence_skinny`, `company.wayback.section_a_scoreable`, `company.wayback.pages`
- Slices: `wayback`
- Note: `wayback.pages` skeleton series; `section_a_scoreable` gate; `pitch_evidence_skinny` safety rule

### 2.20 · Positioning history · CAPTURED + JUDGMENT

Did a new positioning stick, or was it quickly reversed?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: same dated skeleton series

### 2.21 · Positioning history · PARTIAL

Has the main CTA changed between signup, trial, demo, contact sales, or waitlist?

- Evidence: `company.crawl.conversion_ctas`, `company.wayback.sales_motion_extractable`
- Slices: `crawl`, `wayback`
- Note: wayback `ctas` series — but `sales_motion_extractable` is unconditionally False for archive extraction (footer links fake CTA presence); use sitemap + pricing-track corroboration

### 2.22 · Positioning history · CAPTURED

Have main products or offers been added or removed?

- Evidence: `company.sitemap_history.deltas.added_sample`, `company.sitemap_history.deltas.removed_sample`, `company.sitemap_history.deltas`
- Slices: `sitemap_history`
- Note: `sitemap_history.deltas[]` (`added_sample`/`removed_sample`; truncation-suppressed)

### 2.23 · Positioning history · PARTIAL

Have landing pages tested different audiences, offers, or claims?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: wayback five-page tracks

## Batch 8 — Section 3 — Onboarding and Access to Product Value

5 questions (3.1–3.5). Slices this batch reads: `crawl`.

### 3.1 · Onboarding · CAPTURED + JUDGMENT

Can someone try or see the product without talking to sales?

- Evidence: `company.crawl.conversion_motion`
- Slices: `crawl`
- Note: `crawl.conversion_motion`, trial/demo/sandbox links

### 3.2 · Onboarding · NOT-ASSESSED

How long and how many steps does it take to complete the product's main job?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

### 3.3 · Onboarding · JUDGMENT

Does the trial or free tier let a user complete the product's main job?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing-page markdown limits vs. the claimed core job

### 3.4 · Onboarding · PARTIAL

Does onboarding help a new user complete the main job?

- **Decided: not assessed** — The dossier schema does not carry the evidence the contract cites for this question (distribution.mentions), so it cannot be answered from this capture.
- Note: `distribution.mentions` (tutorial/demo videos); docs content: ADD:12

### 3.5 · Onboarding · NOT-ASSESSED

What emails and notifications arrive after signup?

- **Decided: not assessed** — The capture contract records this as not gettable from public sources: NOT-ASSESSED.

## Batch 9 — Section 4 — Reviews, Customer Proof, and Signs of Continued Use

19 questions (4.1–4.19). Slices this batch reads: `branded_search`, `community`, `company_series`, `public_records`, `seo`, `trustpilot`, `wayback`.

### 4.1 · Reviews · CAPTURED

Does the company have reviews on the platforms its buyers use?

- Evidence: `company.community.app_store`, `company.public_records.g2_hits`, `company.trustpilot`
- Slices: `community`, `public_records`, `trustpilot`
- Note: `trustpilot` (typed not_found is valid evidence), `company_series.review_platforms` (G2 count/rating), `community.app_store`

### 4.2 · Reviews · CAPTURED

Are reviews accumulating?

- Evidence: `company.community.app_store.recent_reviews.date`, `company.trustpilot.truncated`, `company.trustpilot.reviews.timestamp`
- Slices: `community`, `trustpilot`
- Note: `trustpilot.reviews[].timestamp` (+ `truncated`, `coverage_oldest/newest`), `app_store.recent_reviews[].date`

### 4.3 · Reviews · CAPTURED · ⚖ comparative

Is the company adding reviews faster or slower than comparable competitors?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: same fields, rival parity; respect `coverage_*` window overlap

### 4.4 · Reviews · JUDGMENT

Is recent review sentiment improving, stable, or deteriorating?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: dated review text, recent vs. earlier periods, distribution not just mean

### 4.5 · Reviews · JUDGMENT

What do customers repeatedly praise?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: dated review text

### 4.6 · Reviews · JUDGMENT

What do customers repeatedly complain about, and are those complaints increasing?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: dated review text, grouped by period

### 4.7 · Reviews · JUDGMENT

Do reviewers describe switching to or away from the company?

- Evidence: `company.community.hn_stories`
- Slices: `community`
- Note: review text + `hn_stories` ("switched from"/"replaced"/"moved to" language, named alternatives)

### 4.8 · Reviews · JUDGMENT

Do customers praise the same benefits the company advertises?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: reviews vs. wayback/homepage skeleton claims

### 4.9 · Reviews · CAPTURED

Does the company respond quickly and specifically to public complaints?

- Evidence: `company.trustpilot.reviews.company_responded`
- Slices: `trustpilot`
- Note: `trustpilot.reviews[].company_responded`, app-store developer responses

### 4.10 · Customer proof · CAPTURED + JUDGMENT

Is the company adding new customer logos and case studies?

- Evidence: `company.wayback.pages.snapshots.skeleton.h2s`, `company.wayback.pages.snapshots.text_excerpt`
- Slices: `wayback`
- Note: `wayback.pages["customers"]` snapshot series (skeleton `h2s` + capped `text_excerpt`; logo *images* not extracted)

### 4.11 · Customer proof · PARTIAL

Do older case studies show that customers stayed, expanded, or achieved more?

- Evidence: `company.wayback.pages.snapshots.text_excerpt`
- Slices: `wayback`
- Note: wayback customers-track `text_excerpt` (capped, historical); current full case-study content: ADD:12

### 4.12 · Customer proof · PARTIAL + JUDGMENT

Are customer logos disappearing?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: wayback customers-track diffs (text-level; logo images not extracted)

### 4.13 · Customer proof · PARTIAL

Are new case studies more specific, more recent, and closer to the target customer than older ones?

- Evidence: `company.wayback.pages.snapshots.text_excerpt`
- Slices: `wayback`
- Note: wayback `text_excerpt` (historical, capped) vs. current case-study content: ADD:12

### 4.14 · Customer proof · ADD:12

Do case studies show customers adding teams, users, use cases, regions, or volume?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:12).
- Note: case-study content: ADD:12

### 4.15 · Product upkeep · CAPTURED

When were the changelog, release notes, and product updates last updated, and has the cadence slowed?

- Evidence: `company.community.app_store.version_release_date`, `company.community.github.releases`
- Slices: `community`
- Note: `community.github.releases[]`, `app_store.version_release_date`, wayback blog track, sitemap deltas

### 4.16 · Product upkeep · JUDGMENT

Do launches keep generating search interest, traffic, reviews, downloads, or discussion after launch day?

- Evidence: `company.branded_search`, `company.community.github.releases`, `company.community.hn_stories.is_launch`, `company.seo.monthly`
- Slices: `branded_search`, `community`, `seo`
- Note: `hn_stories[].is_launch` + `github.releases` dates × `seo.monthly` / `branded_search` / review series

### 4.17 · Product upkeep · ADD:12

Do the docs match the current product and avoid broken steps, old screenshots, and outdated names?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:12).
- Note: docs content: ADD:12

### 4.18 · Product upkeep · ADD:5

Are outages, reliability complaints, and unresolved issues increasing or decreasing?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:5).

### 4.19 · Hiring direction · CAPTURED

Is the company hiring for support, implementation, education, or customer success?

- Evidence: `company.company_series.recent_job_titles`
- Slices: `company_series`
- Note: `company_series.recent_job_titles`, `.open_jobs_monthly`

## Batch 10 — Section 5 — Ways Existing Customers Can Spend More

8 questions (5.1–5.8). Slices this batch reads: `company_series`, `sitemap_history`, `wayback`.

### 5.1 · Pricing structure & history · JUDGMENT

What does the company charge for?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing markdown

### 5.2 · Pricing structure & history · JUDGMENT

Does the price rise as the customer gets more value or uses more of the product?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing markdown vs. outcomes emphasized on homepage (captured); case-study outcomes: ADD:12

### 5.3 · Pricing structure & history · JUDGMENT

Do the pricing tiers show what triggers an upgrade and provide somewhere for larger customers to go?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing markdown

### 5.4 · Pricing structure & history · JUDGMENT

Can customers buy add-ons or related products as their needs grow?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: pricing markdown + `sitemap_history` paths; lineup history via `wayback.pages["pricing"]` and sitemap deltas

### 5.5 · Expansion mechanics · PARTIAL

Does the product make it easy to invite more users or spread to more teams?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: docs/feature-page content: ADD:12 (pricing-page seat/team language captured)

### 5.6 · Expansion mechanics · PARTIAL

Do integrations make the product more useful and harder to replace over time?

- Evidence: `company.sitemap_history`
- Slices: `sitemap_history`
- Note: integrations directory content: ADD:12 (`sitemap_history` gives path counts today)

### 5.7 · Hiring direction · CAPTURED

Is the company hiring account managers or customer-success people to grow existing accounts?

- Evidence: `company.company_series.recent_job_titles`
- Slices: `company_series`
- Note: `company_series.recent_job_titles`

### 5.8 · Pricing structure & history · CAPTURED

Have prices, packages, add-ons, or pricing units changed over time?

- Evidence: `company.wayback.pages.snapshots.skeleton.pricing`
- Slices: `wayback`
- Note: `wayback.pages["pricing"]` skeleton `pricing` fragments per dated snapshot

## Batch 11 — Section 6 — Does the Visible Math Make Sense?

9 questions (6.1–6.9). Slices this batch reads: `company_series`, `public_records`.

### 6.1 · Economic plausibility · PARTIAL

Is a low-priced product supported by expensive paid ads, outbound sales, events, or partner sales?

- Evidence: `company.company_series`
- Slices: `company_series`
- Note: pricing + ADD:1 ads + `company_series` headcount/jobs

### 6.2 · Economic plausibility · JUDGMENT

Does the size and complexity of the sales team fit the likely contract value?

- Evidence: `company.public_records.linkedin_hits`, `company.company_series.recent_job_titles`
- Slices: `company_series`, `public_records`
- Note: `headcount_monthly`, `recent_job_titles`, pricing

### 6.3 · Economic plausibility · PARTIAL

Does each new customer appear to need a lot of implementation, consulting, or support?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: review complaints + implementation hiring (captured); services-page content: ADD:12

### 6.4 · Pricing structure & history · CAPTURED + JUDGMENT

Are public discounts or promotions persistent?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: wayback pricing track (+ ADD:1 promo creative)

### 6.5 · Pricing structure & history · CAPTURED

Has the company raised prices and kept the new pricing?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: wayback pricing fragments across dated snapshots

### 6.6 · Economic plausibility · JUDGMENT

Are the obvious costs of delivering the product high relative to its price?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: pricing + product-type inference

### 6.7 · Economic plausibility · JUDGMENT

Are reliable financial disclosures available?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: **analysis-time lookup** (WebSearch/SEC EDGAR) — not a dossier field; findings must be recorded with URLs in the Evidence Record

### 6.8 · Economic plausibility · JUDGMENT

Is customer or revenue concentration publicly disclosed?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: **analysis-time lookup** (same sources, same recording rule)

### 6.9 · Economic plausibility · CAPTURED

How long ago did the company raise money, and how large are its current headcount and visible spending commitments?

- Evidence: `days_since_last_fundraise` — **missing**: no dossier field carries this, `company.company_series.funding_rounds`, `company.public_records.linkedin_hits`, `company.company_series.open_jobs`
- Slices: `company_series`, `public_records`
- Note: `funding_rounds[]`, `days_since_last_fundraise`, `headcount_monthly`, `open_jobs_monthly`

## Batch 12 — Section 7 — Can Growth Continue, and Is the Company Still Moving?

10 questions (7.1–7.10). Slices this batch reads: `community`, `company_series`, `public_records`, `seo`, `sitemap_history`.

### 7.1 · Growth loops & dependence · JUDGMENT

Which growth loops actually exist?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: cross-slice synthesis (referral paths, integrations, content rankings, community, invite mechanics)

### 7.2 · Growth loops & dependence · JUDGMENT

Which visible acquisition channels require continued spending or publishing?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: channel evidence classified paid/published vs. accumulating

### 7.3 · Growth loops & dependence · CAPTURED + JUDGMENT

Is acquisition concentrated in one channel?

- Evidence: `company_series.traffic_source_split_pct` — **missing**: no dossier field carries this, `company.seo.monthly`
- Slices: `seo`
- Note: `company_series.traffic_source_split_pct` + `_monthly`, `seo.monthly` paid vs. organic

### 7.4 · Growth loops & dependence · PARTIAL

Does the product or its distribution depend heavily on another company's platform?

- Evidence: `company.community.surfaces`
- Slices: `community`
- Note: `community.surfaces` + homepage/pricing markdown (captured); docs/integrations content: ADD:12

### 7.5 · Growth loops & dependence · JUDGMENT

How much search traffic comes from questions that AI systems can answer without a click?

- Evidence: `main_intent` — **missing**: no dossier field carries this, `company.seo.rankings`
- Slices: `seo`
- Note: `seo.rankings[]` (`main_intent`, keyword text) classified by LLM

### 7.6 · Growth loops & dependence · PARTIAL / NOT-ASSESSED

Can the company reach its audience directly through email, product accounts, events, or community?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: capture points in homepage markdown; depth limited by the §1 owned-audience gaps

### 7.7 · Hiring direction · CAPTURED

Is the company adding or cutting sales, marketing, partnerships, customer-success, or growth roles?

- Evidence: `company.company_series.open_jobs`, `company.company_series.recent_job_titles`
- Slices: `company_series`
- Note: `open_jobs_monthly` (counts over time) + `recent_job_titles` (current mix only)

### 7.8 · Decay signals · PARTIAL

Are the homepage, pricing, docs, blog, changelog, status page, community, and signup paths current and working?

- Evidence: no machine path — answer from the slices this batch already carries.
- Note: homepage/pricing freshness (captured) + wayback recency + sitemap presence; docs/blog/changelog/status page content: ADD:12 (+ ADD:5 for status)

### 7.9 · Decay signals · CAPTURED

Have pricing, products, docs, integrations, communities, or signup paths disappeared?

- Evidence: `company.sitemap_history.deltas.removed_sample`
- Slices: `sitemap_history`
- Note: `sitemap_history.deltas[].removed_sample`, wayback page tracks

### 7.10 · Decay signals · CAPTURED + JUDGMENT

Are there public signs of layoffs, shutdowns, shrinking support, leadership departures, or product cuts?

- Evidence: `current_open_jobs` — **missing**: no dossier field carries this, `distribution.mentions` — **missing**: no dossier field carries this, `company.public_records.linkedin_hits`
- Slices: `public_records`
- Note: `headcount_monthly` drops + `current_open_jobs`≈0 + `distribution.mentions` (press)

## Batch 13 — Appendix — Technical Failures That Can Block Discovery or Conversion

3 questions (A.1–A.3). Slices this batch reads: `crawl`, `page_capture`.

### A.1 · Technical checks · CAPTURED + JUDGMENT

Can search engines and AI crawlers access and read the important public content?

- Evidence: `company.crawl.ai_crawler_rules`, `company.crawl.ai_crawler_rules.directives`, `company.page_capture.homepage.markdown`, `company.crawl.robots_txt`
- Slices: `crawl`, `page_capture`
- Note: `crawl.ai_crawler_rules[]` (with `directives` evidence), `robots_present`; raw-vs-rendered = raw fetch vs. `page_capture.markdown`

### A.2 · Technical checks · ADD:11

Do canonical tags and redirects point to one current version of each page?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:11).

### A.3 · Technical checks · ADD:11

Do links and conversion paths resolve?

- **Decided: not assessed** — The evidence this question needs is not captured yet (pending capture addition ADD:11).

## Contract gaps

Citations the dossier schema cannot satisfy. Report every one of them in the analysis output, verbatim, so "the analysis could not see this" stays distinguishable from "the analysis looked and found nothing".

- `cited_brands` — cited by 1.18 — detail: The dossier schema has no field for 'cited_brands'. The capture contract was written against dossier-v2.3.
- `company.distribution.mentions` — cited by 0.10 — detail: The dossier schema has no field for 'distribution'. The capture contract was written against dossier-v2.3.
- `company.distribution.mentions[]` — cited by 1.26 — detail: The dossier schema has no field for 'distribution'. The capture contract was written against dossier-v2.3.
- `company_series.traffic_source_split_pct` — cited by 7.3 — detail: The dossier schema has no field for 'traffic_source_split_pct'. The capture contract was written against dossier-v2.3.
- `connections` — cited by 1.31 — detail: The dossier schema has no field for 'connections'. The capture contract was written against dossier-v2.3.
- `coverage_pct` — cited by 1.15 — detail: The dossier schema has no field for 'coverage_pct'. The capture contract was written against dossier-v2.3.
- `current_open_jobs` — cited by 7.10 — detail: The dossier schema has no field for 'current_open_jobs'. The capture contract was written against dossier-v2.3.
- `days_since_last_fundraise` — cited by 6.9 — detail: The dossier schema has no field for 'days_since_last_fundraise'. The capture contract was written against dossier-v2.3.
- `distribution.mentions` — cited by 1.40, 3.4, 7.10 — detail: The dossier schema has no field for 'distribution'. The capture contract was written against dossier-v2.3.
- `distribution.mentions[]` — cited by 1.27, 1.41 — detail: The dossier schema has no field for 'distribution'. The capture contract was written against dossier-v2.3.
- `historical_adoption` — cited by 1.23 — detail: The dossier schema has no field for 'historical_adoption'. The capture contract was written against dossier-v2.3.
- `main_intent` — cited by 1.1, 7.5 — detail: The dossier schema has no field for 'main_intent'. The capture contract was written against dossier-v2.3.
- `run.historical_search_standing.rows` — cited by 1.4 — detail: The dossier schema has no field for 'historical_search_standing'. The capture contract was written against dossier-v2.3.
- `seo.monthly[].organic_pos_11_20` — cited by 1.5 — detail: The dossier schema has no field for 'organic_pos_11_20'. The capture contract was written against dossier-v2.3.
- `target.competitor_discovery.candidates` — cited by 0.16 — detail: The dossier schema has no field for 'competitor_discovery'. The capture contract was written against dossier-v2.3.
- `target.competitor_discovery.candidates[]` — cited by 0.14 — detail: The dossier schema has no field for 'competitor_discovery'. The capture contract was written against dossier-v2.3.
