---
name: cms-management
description: >
  Use this skill when authoring or editing content, fields, collections, or
  reusable blocks for a generated Next.js site with an embedded CMS — for
  example "change the CMS seed", "add a block type", "add a collection", or
  "fix a field validation error". Do not use it for file-based or single-file
  HTML sites.
mode: both
---

# cms-management

Generated sites store content in **Payload CMS**, not in route files or
`src/data/*`. Content is authored as one `seed.json` manifest, loaded into the
per-iter Payload schema, and rendered by a baked server component that reads the
Payload Local API and maps each page's `layout` blocks to React components.

**At generation** the schema (`src/payload/**`), the content (`seed.json`), and
the components (`src/components/blocks/**`) must agree. When they drift, the
admin rejects the doc, silently drops fields, or the page crashes. This skill
defines the grammar that keeps them in sync and a validator that **proves** it
before the content ships. **Once the site is live** the database — not
`seed.json` — is authoritative (see the next section).

## seed.json seeds the database once; after that the live DB is authoritative

`seed.json` loads into Payload **once**, at generation. After the site is live
the **Payload database owns the content** — editors change copy through the
admin (`/admin`), so live content may already differ from `seed.json`.

- Pure copy changes on a live site are made with `kite-cms update-content`, not
  by editing `seed.json` — that string edit does not change content already
  published from the database, so a run that only rewrites the manifest reports
  a change the user cannot see. Edit `seed.json` in code only when a structural
  or block change also requires it. The user can always edit the same copy by
  hand in the admin (`/admin`).
- Treat `seed.json` as one possible location for text, not the source of truth.
  Copy edited via the admin lives only in the database and never appears in
  `seed.json`, so a `seed.json` grep can miss the current live copy.
- Removing a page or collection item follows the same authority rule. In a
  generated replacement design, delete the entry from `seed.json`; the platform
  turns that difference into an explicit database deletion in the replacement
  schema before applying updates. The currently selected live design is not
  overwritten by generation. For a direct edit to the currently served site,
  the database owns the document, so remove it in the admin (`/admin`). When the
  removed URL must redirect somewhere, load `website-sitemap-management` for
  its redirect preflight first; a removal that simply stops resolving does not
  need one.

## Changing live copy on a live site

Copy already published from the database is changed with
`kite-cms update-content`, which writes into a **draft** the user approves —
never onto the live site. `external-cms-management` owns that workflow and its
rules; load it rather than working them out from here. Editing `seed.json`
changes nothing that is already published (see above), and the user can always
edit the same copy by hand in the admin (`/admin`).

## The seed manifest

`seed.json` lives at the iteration root and has this shape:

```json
{
  "siteSettings": { "...": "matches the SiteSettings global" },
  "pages": [{ "slug": "home", "title": "Home", "layout": [ /* blocks */ ] }],
  "collections": { "posts": [{ "slug": "blog/my-post", "title": "My Post" }] }
}
```

- **`siteSettings`** — one object matching the `site-settings` global
  (`src/payload/globals/SiteSettings.ts`): brand, colors, fonts, nav, footer,
  social, contact, default SEO.
- **`pages`** — one entry per route matching the `pages` collection
  (`src/payload/collections/Pages.ts`): `title`, `slug`, `seo`, and an
  ordered `layout` array of blocks.
- **`collections`** (optional) — items for repeating-content collections, keyed
  by collection slug (`{ "<slug>": [docs] }`). Present only when the site
  registers content collections (see **Collections — repeating content** below);
  omit it entirely for sites that don't.

Every field name in the manifest **must** be a field name in the schema. The
admin only renders fields it knows; an unknown key is silently dropped and
uneditable.

## Field grammar

Author values that match each Payload field's type exactly. The library uses:

| Field type | Seed value |
|---|---|
| `text`, `textarea`, `email` | a string |
| `number` | a number |
| `checkbox` | a boolean |
| `select` / `radio` | a string that is one of the field's `options` |
| `group` | an object with the group's sub-fields |
| `array` | an array of objects with the row's sub-fields |
| `blocks` | an array of `{ "blockType": "<slug>", ...fields }` |
| `richText` | a **lexical document** or a **markdown string** (see below) |
| `json` | any JSON value |

### Image and asset fields are text URLs

Images, logos, avatars, and og-images are **plain `text` URL fields holding a
Cloudinary URL** — not Payload uploads. Field names ending in `Url`/`ImageUrl`
carry the resolved CDN URL from the image manifest verbatim. Never invent URLs.

### richText is a lexical document or a markdown string

A `richText` value is either a lexical JSON document shaped `{ "root": { ... } }`
or a **markdown string**. The seed converts a markdown string to lexical at write
time (`markdownDoc`), so the admin still stores and edits real rich text — the
string is a convenience for authoring, not a different storage format.

- For **long-form bodies** (article/podcast bodies with headings, lists, quotes,
  links, bold) author a markdown **string**. `lexicalDoc()` only carries
  plain-text paragraphs and silently drops every other construct, so it is the
  wrong tool for long-form content.
- A markdown image (`![alt](url)`) seeds as an image block the admin can edit
  when the app has `src/payload/richText.ts`. Render richText with `RichText`
  from `src/components/blocks/RichTextContent.tsx`; Payload's own renderer draws
  nothing for those blocks.
- For short, plain richText, the literal lexical object is fine — see the
  `richText` block in `fixtures/seed.golden.json`.

In TypeScript (a field's `defaultValue`, or any code that builds richText) use
the baked helper rather than hand-writing the node tree:

```ts
import { lexicalDoc } from '@/payload/lexical';
// lexicalDoc('First paragraph.', 'Second paragraph.')
```

### Slug rules

`slug` is the route path without a leading slash. The home page is `home`
(rendered at `/`); every other slug is the URL path (`pricing`, `blog`,
`blog/my-post`). Slugs are unique, lowercase, hyphenated.

Before changing a slug that existed before the current run, load
`website-sitemap-management` and complete its redirect preflight. If that
preflight reports that the required redirect cannot be applied, leave the slug
unchanged and return its exact blocker. The sitemap skill owns the preflight;
this skill owns the CMS slug edit only after the preflight permits it.
When the host prompt carries an **External CMS** notice, do not edit the slug
through this skill: report that old-URL safety and the slug mutation belong to
the named external provider, then end this skill without changing the document.

### Search-index metadata

Use the field path owned by the document type:

- A document in the `pages` collection uses nested `seo.noindex: true`.
- A repeating-content collection item uses top-level `noindex: true` from
  `collectionMetaFields`.

The baked route emits the matching robots metadata and the baked sitemap
excludes either document type. Do not put top-level `noindex` on a page: it is
not a field in the Pages schema.

## Governed, extensible blocks — the triple

Blocks are the composition primitive and the library is **open**: prefer the
blessed library, but you MAY add a new block type when no existing block fits a
design. A block is a validated **triple** authored as one matched set:

> **block = field schema (`src/payload/blocks/<name>.ts`) + component
> (`src/components/blocks/<Name>.tsx`) + registry entry
> (`RenderBlocks.tsx` `blockComponents` map)** — with identical field and prop
> names.

To add a block, ship all three legs as one matched set:

1. Add the `Block` field schema. In the generation pipeline, custom blocks go in
   `src/payload/blocks/generated.ts` (`generatedBlocks`), with a slug unique from
   the library; elsewhere, under `src/payload/blocks/` included in the relevant
   `blocks` list.
2. Add the React component under `src/components/blocks/`, named `<Pascal(slug)>`
   (slug `storyScroller` → `StoryScroller.tsx`); its props are the block's field
   names exactly (the renderer spreads the stored block onto it).
3. The registry entry in `RenderBlocks.tsx`'s `blockComponents` map. This leg is
   written by a deterministic injector between the sentinel markers — never by
   hand, because one mis-emitted brace in that literal map breaks every block on
   the site. Run it yourself once the schema and component exist:

   ```bash
   # generation: this run authored the whole of generatedBlocks, so the file is
   # the complete set and the registry is REPLACED with it
   python3 .opencode/skills/cms-management/scripts/registry_inject.py \
     block src/components/blocks/RenderBlocks.tsx \
     --from-generated src/payload/blocks/generated.ts

   # per-page migration: you authored only these slugs, so they are MERGED into
   # whatever earlier pages already registered
   python3 .opencode/skills/cms-management/scripts/registry_inject.py \
     block src/components/blocks/RenderBlocks.tsx storyScroller pricingTable
   ```

   Merge mode takes one or more slugs as ordinary arguments — replace
   `storyScroller pricingTable` with the ones you authored. They are written
   without angle brackets on purpose: `<slug>` in a command a shell runs is a
   redirection, not a placeholder, so a copied `<slug>...` reads from a file
   named `slug` and the injector receives no slugs at all.

   Both modes are idempotent, so running it before you validate costs nothing —
   and it is what lets the validator see a complete triple, since an absent
   registry entry is a blocking `block-triple` error. The generation platform
   re-runs the same command after your turn, which is the authoritative pass.

The validator checks both halves mechanically: schema↔registry
(`block-triple` errors) and component↔schema prop names (`component-props`
errors — every prop a registered component destructures must be a field of its
block, because the renderer spreads the stored block onto the component and a
drifted prop name renders an empty section). `tsc` against `payload-types.ts`
additionally checks prop types. A schema with no registry entry renders
nothing — that is a blocking error, not a warning.

### Rich fields inside blocks

Blocks may use `group`, `array`, and `richText` fields for real editor
ergonomics (e.g. an array of features, a grouped CTA, a richText body) — not
only flat scalars. Nest them freely; the validator recurses through groups,
arrays, and nested blocks, and the generic renderer handles them.

## Collections — repeating content

`Pages` model singleton page content. **Collections** model repeating items —
blog posts, case studies, testimonials, galleries, changelogs, FAQs, team bios.

**Generation-driven — the template ships none.** A site only gets content
collections when its content is genuinely repeating. A single landing page, a
cafe, a brochure site has no collections — its CMS admin shows just Pages /
Users / Brand & Navigation (the `site-settings` global — its seed key stays
`siteSettings`). Add a collection **only** when the site needs a list of
like items (a blog index, a case-study library, a menu, an events list). When in
doubt, model it as Pages.

**Registering a collection.** Author `src/payload/collections/generated.ts`,
which exports `generatedCollections: CollectionConfig[]`. `payload.config.ts`
spreads this array into `collections`, so every entry becomes a real Payload
collection. Build each entry with the `makeCollection(slug, { fields })` factory
(`src/payload/collectionMeta.ts`); it prepends the standard metadata and applies
consistent admin defaults. Example:

```ts
import type { CollectionConfig } from 'payload';
import { makeCollection } from '../collectionMeta';

export const generatedCollections: CollectionConfig[] = [
  makeCollection('posts', {
    labelSingular: 'Post',
    labelPlural: 'Posts',
    fields: [
      { name: 'excerpt', type: 'textarea' },
      { name: 'body', type: 'richText' },
    ],
  }),
];
```

The generation pipeline regenerates the Payload types from this file, so block
components and the seed are typed against the collections you declare.

**Standard metadata (inference targets).** `makeCollection` gives every item a
stable metadata set so the Collections product's import / metadata-inference /
monitoring engines have a consistent schema to write to — users rarely fill
these by hand: `title`, `slug`, `author`, `publishDate`, `status`
(`draft`/`published`/`needs-attention`), `topicCluster`, `intent`
(`seo`/`conversion`/`awareness`), `seoTitle`, `metaDescription`, `featuredImage`
(URL), `canonicalUrl` (override the self-referential canonical),
`ogImageUrl` (social-share image when it differs from `featuredImage`),
`noindex` (hide the item from search + the sitemap), plus the type-specific
`fields` you pass (e.g. a post's `excerpt` + `body`). This set lives in
`src/payload/collectionMeta.ts` (`collectionMetaFields`).

**Item SEO is handled for you.** The baked catch-all route reads these fields to
emit the item's canonical, og/twitter tags, `noindex`, and Article JSON-LD; the
baked `sitemap.ts` lists every published, non-`noindex` item. Populate
`seoTitle`/`metaDescription`/`featuredImage` (and `canonicalUrl`/`ogImageUrl`
when they should differ); never author per-item `<head>` markup.

**Seeding items.** Seed each collection's docs under the `collections` key of
`seed.json` (`{ "<slug>": [docs] }`), keyed by the same slug you registered.
Items are validated exactly like pages (structural + Local-API).

**Listing + item primitives.**
- The `collectionList` block renders a live grid of a collection's published
  items (newest first). Bind it by setting its `collection` field to the
  collection's slug — that slug **must** match a collection you registered in
  `generated.ts`, or the validator fails (`unknown-collection`). It queries
  Payload at render time, so the listing never duplicates item content in the
  seed. It also **facets**: set `filterByTag` to restrict the grid to one
  `topicCluster`, `showTagFilter` to render a server-rendered tag bar (visitors
  filter via `?tag=` links, no client JS), and `sortBy`
  (`publishDate`/`title`).
- The `relatedItems` block renders items from a collection sharing a reference
  item's `topicCluster` — set `collection` and `fromSlug` (the reference item's
  slug). Used for "related posts"/"more episodes" surfaces.
- The baked catch-all route renders each published item via the per-collection
  **item registry** at `/<slug>` (e.g. a post with slug `blog/my-post` renders at
  `/blog/my-post`). A collection without a custom layout uses the neutral
  `DefaultItemLayout` (article-shaped: `title`, `publishDate`, `featuredImage`,
  `body`); non-article collections still render the fields they have.

**Rich-media library blocks.** Beyond the layout blocks, the library includes
`audioEmbed` (an audio/track player from a provider `embedUrl`) and `peopleList`
(a people grid — team members, speakers, guests, contributors). Prefer these for
audio and people-listing content rather than authoring a custom block.

**Custom per-collection item layouts — the item triple.** This is the block
triple's pattern applied to a collection's detail page: the same author-the-leaves,
injected-registry mechanism, keyed by collection instead of blockType. When a
content type needs a bespoke detail page (an article layout with an author block
and a related sidebar, a podcast layout with an audio player and guests), author a
custom layout as a matched triple:

> **item layout = collection schema (`generated.ts`) + component
> (`src/components/collections/<Pascal(slug)>Layout.tsx`) + RenderItem entry** —
> with the component's prop names equal to the collection's field names.

1. Register the collection in `generated.ts` with the fields the layout needs.
2. Author `src/components/collections/<Pascal(slug)>Layout.tsx` (slug `posts` →
   `PostsLayout.tsx`). Its props are the collection's field names exactly, plus
   two renderer-injected props: `collection` (the slug) and `related` (an array
   of same-`topicCluster` items, for a sidebar). Type props against the
   collection's generated interface (`import type { Post } from '@/payload-types'`).
3. The `RenderItem.tsx` registry entry is written **for you** by the deterministic
   injector — never hand-edit it. The validator checks the layout's props match
   the collection's fields (`item-triple`).

Reach for a custom layout when a type's detail page is genuinely bespoke;
otherwise the default layout and a `collectionList` index are enough.

Only the data-model + schema standards live here. Import pipelines, the metadata
inference engine, AI search, related-content, and performance monitoring are
separate tracks this schema targets but does not implement.

## Admin ergonomics standards

The admin panel is the editing surface, so author schemas that are pleasant to
edit:

- **Image fields use `imageUrlField()`** (`src/payload/fields.ts`), which wires
  the `ImagePreview` thumbnail (`src/admin/ImagePreview.tsx`) via
  `admin.components.afterInput`. Use it for every logo/avatar/og-image/image URL
  so editors see the image, not just a string. After adding a custom admin
  component, run `pnpm generate:importmap`.
- **`admin.hideAPIURL: true`** on collections and globals — the API URL is noise
  for content editors.
- **Labels** via the field's `label` for any name whose role is not obvious
  (e.g. `OG Image URL`), and `group` fields to cluster related fields.
- **richText `defaultValue`** via `lexicalDoc()` so a new richText field opens to
  a valid empty document, not a broken/null editor.
- **Live Preview** is configured (`admin.livePreview`, `collections: ['pages']`
  and `globals: ['site-settings']`) with responsive breakpoints; it renders the
  page same-origin in the admin.

## The three fit invariants

Generated content is proven to fit the admin when all three hold. The validator
checks them mechanically:

1. **Schema is valid** — `@payload-config` loads. The admin can render it.
2. **Content is structural** — every seed value matches the field shape *derived
   from the live config* (types, required, select options, block discrimination),
   plus a bidirectional orphan-key check: no content key is missing from the
   schema, and no required field is missing from the content.
3. **Content is semantic** — each doc is accepted by Payload's Local API in a
   rolled-back transaction (the same write-time validation the admin runs). It
   boots Payload, and the config runs with `push: true`, so this layer PUSHES
   THE SCHEMA — safe exactly once at a time. Not yours to run: see below.

## Run the validator before finishing

From the iteration directory (the one holding `src/payload.config.ts` and
`seed.json`) — the skill tree is staged under this run dir, not the app root:

```bash
pnpm exec tsx .opencode/skills/cms-management/scripts/validate_cms.mjs \
  --structural-only seed.json </dev/null
```

**`--structural-only` is not optional here.** Without it the validator boots
Payload against the live database while your iteration's dev server is still
running, and two concurrent schema pushes produce a prompt from drizzle that no
piped input can answer — the command then hangs until its timeout expires and
takes the iteration with it. The flag runs invariants 1 and 2 and reports
`"semantic": "not-run"`, so an `ok` verdict from this command means "the content
fits the schema", never "the database accepted it".

**Website generation** runs the full validator, semantic layer included, after
you finish — with the dev server stopped and the environment loaded, which is
what makes that pass safe. There, its verdict is the authoritative one.

Every other consumer of this skill has no such pass. If you are editing a CMS
outside generation, the structural result above is the only verdict there will
be: say so when you report, rather than implying the database accepted content
nothing checked against it.

So the structural pass above is worth running first: everything it catches is
something you fix on your own turn, before any of it becomes someone else's
verdict. Whether a rejection there is recoverable is the calling workflow's to
say — this skill is loaded by consumers that have no such callback at all.

It prints one line of JSON and exits non-zero on any blocking fit error:

```json
{ "ok": false, "invariants": { "schema": "pass", "structure": "fail", "semantic": "not-run" },
  "errors": [ { "path": "pages[0].layout[0].heading", "kind": "missing-required",
                "hint": "required field \"heading\" is missing from the content." } ] }
```

Read `errors[].path` and `errors[].hint`, repair `seed.json` (or the block
schema/component/registry), and re-run until `ok` is `true`. Error kinds:
`missing-required`, `orphan-key`, `type-mismatch`, `unknown-block`,
`block-triple`, `component-props`, `item-triple` (a custom item layout's props
drift from its collection's fields, or it is registered for an unregistered
collection), `unknown-global`/`unknown-collection`, `no-raw-html` (a route was
dumped into a raw-HTML field instead of decomposed into blocks — replace it with
editable blocks), `config-load`, `semantic`.

A worked example of a valid manifest is `fixtures/seed.golden.json`.
