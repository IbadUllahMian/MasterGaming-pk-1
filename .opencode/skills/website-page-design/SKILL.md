---
name: website-page-design
description: >
  Use this skill when establishing the visual direction for a new landing
  page, a page without a layout, or a redesign — including “match our existing
  site”, “give it a fresh look”, and “try a different layout”. Resolves a
  concrete design specification to build from. Adding an entry to an existing
  article or feature-page family uses that family's template instead; copy,
  functionality, and styling fixes that retain the current visual direction
  use the normal website editing path.
mode: sandbox
---

# website-page-design

A page's visual direction is grounded in a design specification before the
page is built. Web Developer owns this choice: match the requested existing
site, or establish a fresh direction from the gallery.

## Choose the foundation

Resolve the foundation in this order:

1. Use a site as the design reference when the current request explicitly asks
   to match its visual design (for example, “make it look like our homepage”),
   or apply a design spec supplied for this page.
2. Otherwise, an explicit request for a fresh or replacement visual direction
   uses gallery inspiration, superseding an earlier supplied contract.
3. Otherwise, use a supplied design contract that applies to the requested page.
   Brand guidelines alone do not prescribe a page's visual direction.
4. With no applicable direction supplied, establish the page or redesign from
   gallery inspiration.

The destination site tells you where to build; it is a design reference only
when the request asks to match its look. “Keep our brand” constrains the assets,
colors, and typography while gallery inspiration supplies the page composition.
Preserve approved brand constraints in every branch. Existing components and a
stored site-wide spec do not by themselves select the matching branch.

**Match an existing site.** For a managed Kite site, load
`website-design-creation` and use only its “Resolve an existing site's spec”
section. That section owns source eligibility, retrieval, and evidence capture;
page work does not invoke its initial-generation workflow. For another public
reference, use `website-reference-design-application` for its evidence contract.
Apply the resolved specification to the page, not just a few copied components.

**Gallery foundation.** Obtain gallery inspiration when the routing above
selects this branch. Describe the page's purpose, audience, offer, content needs, and
desired visual treatment in the query. Use one suitable returned spec as the
foundation. If it does not fit, explain the mismatch and reformulate the query
once; for a requested different look, compare against the previous direction
rather than accepting the same inspiration again. If no usable spec is
returned, report that the fresh design is blocked instead of inventing a
foundation and claiming it came from the gallery.

Keep the chosen spec and its source in the page's working design notes so
implementation and verification share the same evidence. Capturing a source
spec for a page is read-only with respect to website state: save the artifact
with the page, not through a global visual-spec write on the source or target.
The page's direction applies only to the requested page.

## Query the gallery

```bash
curl -sS -X POST "$GALLERY_API_URL/api/external/visual-specs" \
  -H "Authorization: Bearer $GALLERY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": ["A photography portfolio homepage"], "quantity": 1}'
```

Replace `data[0]` with the page description; the gallery selects the category.
Encode the request as JSON so quotes in the brief do not corrupt the body.

## Read the response

JSON shape:

```json
{
  "category": { "name": "...", "description": "..." },
  "visual_specs": [
    { "inspiration_website_id": 123, "category_id": 1, "visual_spec": "<design description>" }
  ]
}
```

Use the non-empty `visual_spec` as design evidence and retain
`inspiration_website_id` and category metadata as provenance. The optional
`inspiration_website_name` is a label, not a required response field.

## Apply and verify

Apply the spec's composition, typography, spacing, and visual treatment to
the requested page or section. Page content, claims, copy, and image subjects
come from the user's business, not the inspiration site. For a scoped change,
adapt only the requested visual aspects and preserve the surrounding design.

The foundation is ready when a readable spec and its source are available to
the builder. During the normal page verification, compare the rendered result
with that spec and report which foundation was used and any material
deviations; a gallery call alone is not evidence that its design was applied.

## Env vars

- `$GALLERY_API_URL` — base URL
- `$GALLERY_API_TOKEN` — bearer token (never log or echo this)
