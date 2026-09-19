---
name: website-page-creation
description: >
  Use this skill when a request adds a new page to an existing website —
  "write an article about X", "add a comparison page against <competitor>",
  "a landing page for the spring campaign", "add a page for the new feature",
  "add a pricing page" — including pages built from research, audit, or report
  findings. It decides which kind of page the request wants and whether the
  site already has a template for that kind, so an article on a site that
  already publishes articles reuses that layout instead of getting a fresh
  design. Changing an existing page is a normal edit. For a campaign-specific
  page used by paid, email, social, event, partner, or account outreach, load
  `custom-landing-pages` too. For a hosted internal report or dashboard, use
  dashboard building.
mode: sandbox
---

# Adding a new page

Two answers decide the task: **which kind of page** this is, and **whether the
site already has a template for it**. Read both from the codebase before you
design anything or ask anything.

## Step 1 — Classify the page

| The request asks for | Kind |
| --- | --- |
| One more entry in a family the site already publishes — article, blog post, comparison, use case, case study, customer story, glossary or changelog entry | **Content entry** |
| A page for one campaign, audience, or offer that sells the whole thing | **Landing page** |
| A page that explains one product, feature, or service in depth | **Feature page** |
| Anything else — a tool, a calculator, an interactive surface | **Open-ended**: stop here and build it under `nextjs-code-writing` |

When the site already publishes a family the request fits, it is a content
entry, however the request words it. "Write something on our blog about
serverless costs" on a site with three posts is the fourth post, not a new kind
of page.

## Step 2 — Probe for an existing template

For a content entry, and for a feature page where the site already has one,
find the family before you decide anything about design. Check for
`src/payload.config.ts` first — it tells you where the family lives.

**File-based site** (no `src/payload.config.ts`)

- The family's routes — a list route and a per-entry route, `src/app/<family>/page.tsx` and `src/app/<family>/[slug]/page.tsx`.
- The entries as data — `src/data/<family>.ts`, or a directory of entry files the list route maps over.

**Embedded-CMS site** (`src/payload.config.ts` exists)

- A collection for the family in the Payload config, and the block components its entries render.
- Load `cms-management` first: here the entry is a record in that collection rather than a new route, and the catch-all route already renders it.

Found the family → **reuse it** (Step 3A). No family → **you are building it**
(Step 3B).

## Step 3A — Reuse: the site already decided the design

The site answered every layout, typography, and color question for this family.
Copy those answers.

1. Read one or two existing entries end to end. File-based: the entry route,
   its data shape, the components it renders, its metadata. Embedded-CMS: the
   collection's field schema and the blocks its records use.
2. Build the new entry from that same structure and those same components. It
   should differ from its siblings in content alone.
3. Get it listed. File-based: add it to the data the list route maps over,
   using the order and date fields its siblings use. Embedded-CMS: a published
   record joins the family's `collectionList` on its own, so fill
   `publishDate`, `status`, and `topicCluster`, and leave the index page alone.
4. Ask about content only — the angle, the audience, the product to feature —
   and only when the answer changes what you write. Asking about layout, color,
   or typography wastes the requester's time.
5. Take the design from the existing entries so the new entry remains part of
   the same family. An explicit request to redesign the family is separate
   from adding an entry.
6. Report which family template you reused.

## Step 3B — Create the template

The first entry fixes the shape every later entry inherits, so build the
family, not one page:

1. File-based: a list route, a per-entry route, and an entry data shape later
   entries extend. Embedded-CMS: register the collection and put a
   `collectionList` block on the index page. The catch-all route renders each
   item already, so write a custom item layout only when the detail page needs
   one. `cms-management` owns the collection factory, that layout, and the
   validator.
2. For a landing page or an explicit redesign, use `website-page-design` to
   resolve the visual foundation. Otherwise take the family design from the
   site’s existing components, spacing, type scale, and color tokens; use
   `website-page-design` when there is no similar page to build from.
3. Report that this first entry **set the family template** and that later
   entries reuse it. The requester is agreeing to a shape, not one page.

## Landing pages

One audience, one promise, one primary action.

- Open with the promise, prove it, say what it is, answer the obvious
  objection, close with the action. Vary that order to fit the offer and drop
  the folds the offer does not need.
- Repeat the primary action down the page; every other exit competes with it.
- Before designing the page, load `website-page-design` to resolve and record
  its visual foundation. That skill owns matching an existing site versus
  choosing gallery inspiration; existing components alone do not settle the
  direction of a new landing page.
- Give it its own title, description, and canonical route.
- A campaign or outbound sequence lands here → load `custom-landing-pages` for
  source-message match, attribution, measurement, and campaign-page search
  exclusion.
- Section order by business category lives in `website-structure-planning`.

## Feature pages

One product, feature, or service in depth: what it does, who it is for, how it
works, proof, and a route into the main funnel.

- Build from the site's own design, and link the page both from the area it
  belongs to and back into the funnel.
- When the site already has a feature page, treat it as the family template and
  follow Step 3A.

## Every new page

- Write the content from the brief and from what the site and the team already
  know. Ask two or three questions at most, all about content, all before you
  build.
- Deliver the page as a draft for the requester to read and change.
- Report the route path, and for a content entry whether you reused the family
  template or set it.

## Mechanics

Routing, metadata, navigation links, and the sitemap belong to
`nextjs-code-writing`. CMS collections, field schemas, block registration, and
seed content belong to `cms-management`. This skill decides which kind of page
to build; those two decide how.

`website-agent-readiness` refreshes `/llms.txt` to list the new page. It
loads itself once this skill finishes.
