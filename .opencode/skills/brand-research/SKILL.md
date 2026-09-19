---
name: brand-research
description: >
  Use this skill when the task is to capture a company's brand identity from its
  live website — "research brand X", "what is their look and feel", "profile our
  brand", "document the brand voice and visual style", or a bare company URL when
  the goal is a brand profile rather than a single fact. Covers the visual
  identity (colors, typography, logo, imagery, layout feel), the writing voice and
  tone taken from real page copy, and the brand personality and positioning cues,
  then files the profile to the team's shared knowledge. For the self company,
  it returns a verified brand handoff that a Generalist findings-page builder can apply.
  For general market, competitor, or pricing research, or a quick one-off
  brand-token pull, use `web-research`.
mode: sandbox
---

# Brand Research

Profile a company's brand from its live website — how it looks, how it sounds, and
what it stands for — then record the profile in the team wiki.

## Use When

- A research task asks for a company's brand, look and feel, visual identity, or voice and tone.
- You are about to produce customer-facing work and need the self company's own brand on record first.
- Not for a single brand-token pull or general market and competitor research — use `web-research`. Not for restyling a site from a reference — use `website-visual-design-extraction`.

## Inputs

- The company's website URL, or enough to find it. For the self company, use the site named on `company/identity.md`.
- Whether the subject is the self company or an external one — it decides where the profile is filed.

## Workflow

1. Load context per `wiki-management`. For the self company, re-read `company/brand/` so you extend the existing record. If `/efs/knowledge` is absent, proceed with the task's explicit target, keep the resulting profile in the task result, and skip the wiki-only read, write, and submission checks below. When the wiki exists, apply its source precedence:
   - Current verified evidence supersedes older agent-written facts with provenance.
   - `source: user-edit` remains pinned. Preserve and report any conflict with research evidence; do not relabel the user edit as research-verified.
   - A prior fact remains when replacement evidence is unavailable, but is not relabeled as newly verified.
2. Use the platform Firecrawl commands as the extraction source. Start with the canonical homepage URL. Run `kite-research scrape "<url>"` for page content, `kite-research brand "<url>"` for semantic design tokens, `kite-research logo "<url>"` for the on-page logo, and `kite-research assets "<url>"` for page-exposed imagery. From the scraped homepage, choose one or two same-site primary pages (About, Product, or Services pages linked from the homepage), run the same four commands on each, and retain every input URL beside its evidence. Follow `web-research` for the returned JSON fields and gateway error contract.
3. Classify the evidence before synthesizing it. A newly researched visual fact is `verified` only when every applicable source, role, corroboration, and asset-property rule below is satisfied; otherwise it is `unverified`.
   - **Colors and type** — verify a concrete hex/RGB color or named font in a semantic role in the homepage's `result.brand.color_palette` or `result.brand.typography_palette`. When a primary page exists, confirm the same value and role there. When none is linked from the homepage, homepage evidence is sufficient. Treat declared tokens as global theme inventories only. Promote a WordPress preset or other declared token only if the current page's role-keyed result contains that concrete value.
   - **Logos and imagery** — treat a non-null `result.logo` as Firecrawl's provider-selected on-page logo persisted by the gateway as an HTTPS asset. Preserve its exact returned URL and source page. The required identity evidence is the homepage result plus same-family corroboration from a same-site primary page when one is linked: promote the asset to `Primary logo` when both pages show the same wordmark text and symbol geometry. When the homepage links no primary page, its provider-selected result is sufficient. This promotion establishes the identity asset; it does not require the gateway to separately report header placement or every background variant. Inspect the hosted asset for dimensions, fills, and canvas transparency. Semantic page backgrounds and optional screenshots may establish only actual-use background and observed light/dark suitability; they cannot select a logo or recover a null or failed extraction. Missing variant evidence leaves only that variant field unset and does not demote the primary logo or block an otherwise complete visual profile. Keep newsroom, docs, partner, and article-only marks as candidates unless they match the homepage identity family. Use `result.images` only for non-logo imagery; retain each image's exact asset URL, source page, and usage context. Describe imagery treatment, layout density, and motion only when Firecrawl page, asset, or screenshot evidence supports them.
   - **Voice and essence** — use quoted scraped copy to assess reading level, sentence length, person, formality, humor, and recurring phrases. Label positioning and personality conclusions as inference.
4. Optionally use `kite-research screenshot "<url>" [viewport]` or `browser-session` after extraction for final rendered verification or fallback observations. Browser availability is not an extraction dependency. Firecrawl evidence retains precedence; rendered observations may corroborate it or fill a gap, but never override it.
5. Record the profile per `wiki-management`, routed by subject: the self company → `company/brand/visual.md` and `company/brand/voice.md`; any other company → its `companies/<slug>/profile.md` (set `relationship: competitor` when it is one). Preserve existing frontmatter and facts per step 1. Record the promoted asset under `Primary logo` with the exact persisted HTTPS URL returned in `result.logo`, source pages, identity corroboration, and every observable property. Add `Light-background variant` and `Dark-background variant` only when evidence establishes them; state unknown variant properties without moving the primary asset to `Logo candidates (unverified)`. Put non-primary marks under that candidate heading with their unresolved properties. Never put another company's brand on the self pages.
6. **Self company only — return the findings-page brand handoff.** Do not initialize,
   edit, or publish the reports portal. In the task result, give the next
   Generalist findings-page task the exact wiki paths plus only verified values:
   `companyName`, the color roles, recorded typefaces, and the primary logo's
   exact persisted HTTPS URL with its supported background variants. Name any
   rendered accent discrepancy or missing light-background logo as a caveat.
   When the visual profile is `incomplete/blocked`, say which brand fields must
   remain unset rather than guessing them.

## Verification

Before returning, complete every check:

- Confirm each required page returned text in `result.markdown`, at least one concrete color role and one font role in `result.brand`, `result.logo` without a Firecrawl error, and `result.images` without a Firecrawl error. A null logo is valid only when Firecrawl rejects every on-page logo candidate; keep the logo unverified and report the gap. An empty image list is valid only when the scraped page exposes no non-logo images.
- Confirm a repeated non-null provider-selected logo is recorded as `Primary logo` with its exact persisted HTTPS URL and source URLs. A missing light- or dark-background variant is an explicit gap, not a reason to mark the primary logo or visual profile incomplete.
- Confirm every voice claim cites a specific scraped line and source URL; label each essence claim as inference.
- When `/efs/knowledge` exists, confirm the write landed on the required subject page, no external brand data landed on a self-company page, and the `wiki-management` submission succeeded.
- For the self company, confirm the task result contains the exact wiki paths,
  verified brand values, source URLs, and every variant or confidence gap a
  Generalist page builder must preserve.

## Failure Handling

- Apply `web-research` retry handling to Firecrawl gateway errors. When a required `scrape`, `brand`, `logo`, or `assets` call still fails or misses the first verification check, preserve only the prior facts whose replacement evidence is missing and return `Visual profile: incomplete/blocked` with the URL, failed command, and missing evidence. Submit only independently verified updates.
- Rendered observations can corroborate Firecrawl evidence but cannot promote a logo when `result.logo` is null or failed. Browser capacity failure does not demote a repeated provider-selected primary logo; it leaves only rendered placement or variant-suitability properties unverified.
- When the site is unreachable, report which URL failed and profile only what loaded — do not invent tokens.
- Never compensate for incomplete brand evidence by editing a Report project;
  return the supported handoff and its gaps for the CMO to route after results
  return.
