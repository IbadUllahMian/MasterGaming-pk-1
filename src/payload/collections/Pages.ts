import type { CollectionConfig } from 'payload';
import { layoutBlocks } from '../blocks';
import { imageUrlField } from '../fields';
import {
  revalidateContentAfterChange,
  revalidateContentAfterDelete,
} from '../revalidate';

// One document per route. `slug` is the route path without a leading slash
// (the home page uses `home`). The page renderer maps `layout` blocks to React
// components; `sitemap`/`robots` read this collection instead of static arrays.
export const Pages: CollectionConfig = {
  slug: 'pages',
  hooks: {
    afterChange: [revalidateContentAfterChange],
    afterDelete: [revalidateContentAfterDelete],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    hideAPIURL: true,
    // Renders as the list-view sub-header (styled by admin-skin.css) to match
    // the Kite content editor's "title + description" page header.
    description: 'Create and manage the pages for your website.',
    components: {
      // Custom save controls: an explicit Save button plus a save-state badge
      // (Saved / Unsaved changes / Saving). Drafts are off, so Save writes
      // straight to the live page. See src/admin/SaveControls.
      // The Back control that replaces the hidden breadcrumb is applied to
      // every collection centrally (`withKiteAdmin` in src/payload/kiteAdmin),
      // so it is deliberately not repeated here.
      edit: { SaveButton: '/admin/SaveControls#SaveControls' },
      // The design-system list view is applied to every collection centrally
      // (`withKiteAdmin` in src/payload/kiteAdmin.ts) rather than wired per
      // collection here. See src/admin/KiteListView for why it owns the whole
      // view: Payload's list-controls row (search, Columns, Filters) renders
      // above every override slot, so it cannot be replaced piecemeal.
    },
  },
  fields: [
    // Presentational grouping only — an UNNAMED group does not nest data, so the
    // `title`/`slug` paths stay top-level (the frontend renderer, seed manifest,
    // and autosave/autofill all still reference them unchanged). The header
    // icon + label render via a custom Label component; admin-skin.css cards the
    // `.kite-section` wrapper. `admin.width` lays the two fields side by side.
    {
      type: 'group',
      label: 'Page Details',
      admin: {
        className: 'kite-section',
        components: { Label: '/admin/SectionLabel#PageDetailsLabel' },
      },
      // `admin.width` only lays fields side by side inside a `row` (Payload's
      // `.render-fields` otherwise stacks them); the row is presentational and
      // does not nest data, so `title`/`slug` stay top-level paths.
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      // Layout sits directly under Page Details (UX review: the sections a
      // user edits most come first; SEO reads as metadata and goes last).
      // Field order here is presentational only — `layout`/`seo` stay the
      // same top-level data paths wherever they appear in this array.
      name: 'layout',
      type: 'blocks',
      label: 'Layout',
      admin: {
        className: 'kite-section',
        // Block rows start collapsed so the page reads as a tidy section list.
        initCollapsed: true,
        components: { Label: '/admin/SectionLabel#LayoutLabel' },
      },
      blocks: layoutBlocks,
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: {
        className: 'kite-section',
        components: { Label: '/admin/SectionLabel#SeoLabel' },
      },
      // Single-column, full-width stacked fields — no `row`/`width` so each
      // field spans the card.
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        imageUrlField('ogImageUrl', { label: 'OG Image URL' }),
        {
          // Mirrors the content-collection items' `canonicalUrl` override
          // (src/payload/collectionMeta.ts). Read by the catch-all route's
          // `generateMetadata`; empty means the page canonicalizes to its own
          // URL on the deployed origin.
          name: 'canonicalUrl',
          type: 'text',
          label: 'Canonical URL',
          admin: {
            description:
              'Override the canonical URL. Leave empty to use this page’s own URL.',
          },
        },
        {
          name: 'noindex',
          type: 'checkbox',
          defaultValue: false,
          // Renders the design system's Switch (see src/admin/KiteField),
          // wired by `withKiteAdmin` along with every other checkbox.
          admin: {
            description: 'Prevent search engines from indexing this page',
          },
        },
        {
          // Robots meta directives beyond indexability, carried verbatim from
          // a migrated source page (e.g. `max-image-preview:large`). The
          // `noindex` switch above wins when set — see `pageMetadata`
          // (src/lib/page-metadata.ts).
          name: 'robots',
          type: 'text',
          label: 'Robots directives',
          admin: {
            description:
              'Robots meta content, e.g. max-image-preview:large. The noindex switch above takes precedence.',
          },
        },
        {
          // Structured-data blocks emitted verbatim as
          // `<script type="application/ld+json">` by the catch-all route. A
          // migration seeds the source page's blocks here so real-world
          // assertions (a LocalBusiness address, phone, opening hours) round-
          // trip instead of being regenerated. An array of JSON-LD objects;
          // a single object is also accepted.
          name: 'jsonLd',
          type: 'json',
          label: 'Structured data (JSON-LD)',
          admin: {
            description:
              'JSON-LD blocks served with this page, exactly as stored.',
          },
        },
      ],
    },
    {
      // Invisible watcher: auto-fills a block with AI content when one is added
      // via the native "Add Layout" (see src/admin/SectionAutofill.tsx). Carries
      // no data (ui field).
      name: 'sectionAutofill',
      type: 'ui',
      admin: {
        components: { Field: '/admin/SectionAutofill#SectionAutofill' },
      },
    },
  ],
};
