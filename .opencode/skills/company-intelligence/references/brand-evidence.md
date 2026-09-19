# Brand evidence — classification, verification, and logo rules

Load condition: the Brand profile lane only, before synthesizing extracted
evidence into a profile. The other lanes never need this file.

## Classification gate

Classify evidence before synthesizing it. A newly researched visual fact is
`verified` only when every applicable source, role, corroboration, and
asset-property rule below is satisfied; otherwise it is `unverified`.

## Colors and type

Verify a concrete hex/RGB color or named font in a semantic role in the
homepage's `result.brand.color_palette` or `result.brand.typography_palette`.
When a primary page exists, confirm the same value and role there. When none
is linked from the homepage, homepage evidence is sufficient. Treat declared
tokens as global theme inventories only. Promote a WordPress preset or other
declared token only if the current page's role-keyed result contains that
concrete value.

## Logos and imagery

Treat a non-null `result.logo` as Firecrawl's provider-selected on-page logo
persisted by the gateway as an HTTPS asset. Preserve its exact returned URL
and source page. The required identity evidence is the homepage result plus
same-family corroboration from a same-site primary page when one is linked:
promote the asset to `Primary logo` when both pages show the same wordmark
text and symbol geometry. When the homepage links no primary page, its
provider-selected result is sufficient. This promotion establishes the
identity asset; it does not require the gateway to separately report header
placement or every background variant. Inspect the hosted asset for
dimensions, fills, and canvas transparency.

The promote/demote asymmetries (prior-incident-shaped — apply exactly):

- Semantic page backgrounds and optional screenshots establish only
  actual-use background and observed light/dark suitability; they cannot
  select a logo or recover a null or failed extraction.
- Missing variant evidence leaves only that variant field unset; it does not
  demote the primary logo or block an otherwise complete visual profile.
- Newsroom, docs, partner, and article-only marks stay candidates unless they
  match the homepage identity family.

Use `result.images` only for non-logo imagery; retain each image's exact
asset URL, source page, and usage context. Describe imagery treatment, layout
density, and motion only when Firecrawl page, asset, or screenshot evidence
supports them.

## Rendered verification (subordinate)

Optionally use `kite-research screenshot "<url>" [viewport]` or
`browser-session` after extraction for final rendered verification or
fallback observations. Browser availability is not an extraction dependency.
Firecrawl evidence retains precedence: rendered observations may corroborate
it or fill a gap, but never override it. Rendered observations cannot promote
a logo when `result.logo` is null or failed; and a browser capacity failure
does not demote a repeated provider-selected primary logo — it leaves only
rendered placement or variant-suitability properties unverified.

## Verification checks before returning

Complete every check:

- Each required page returned text in `result.markdown`, at least one
  concrete color role and one font role in `result.brand`, `result.logo`
  without a Firecrawl error, and `result.images` without a Firecrawl error.
  A null logo is valid only when Firecrawl rejects every on-page logo
  candidate — keep the logo unverified and report the gap. An empty image
  list is valid only when the scraped page exposes no non-logo images.
- A repeated non-null provider-selected logo is recorded as `Primary logo`
  with its exact persisted HTTPS URL and source URLs. A missing light- or
  dark-background variant is an explicit gap, not a reason to mark the
  primary logo or visual profile incomplete.
- Every voice claim cites a specific scraped line and source URL; every
  essence claim is labeled inference.
- When `/efs/knowledge` exists: the write landed on the required subject
  page, no external brand data landed on a self-company page, and the
  `wiki-management` submission succeeded.
- For the self company: the task result contains the exact wiki paths,
  verified brand values, source URLs, and every variant or confidence gap a
  Generalist page builder must preserve.
