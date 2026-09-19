import type { Block } from 'payload';
import { imageUrlField } from '../fields';
import { lexicalDoc } from '../lexical';
import { generatedBlocks } from './generated';

// Fixed block library shared by every generated design. The data shape is
// baked into the template so the page renderer and the seed manifest agree on
// a stable contract; per-design visual variation lives only in the React block
// components under `src/components/blocks/`, never in this schema.
//
// Image and asset fields are plain text URL fields (Cloudinary URLs, as the
// rest of the platform uses) — not Payload uploads.

// Shared admin config for every layout block row. Payload's default block row
// shows the block type plus an editable block-name input whose empty state reads
// "Untitled" (noise). We drop that input and render "<Block Type> — <heading>"
// via a custom Label so collapsed rows are identifiable. The Label component is
// registered in the admin importMap.
const blockRowAdmin: Block['admin'] = {
  components: { Label: '/admin/BlockRowLabel#BlockRowLabel' },
  disableBlockName: true,
};

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'primaryCtaLabel', type: 'text' },
    { name: 'primaryCtaHref', type: 'text' },
    { name: 'secondaryCtaLabel', type: 'text' },
    { name: 'secondaryCtaHref', type: 'text' },
    imageUrlField('imageUrl'),
  ],
};

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        imageUrlField('iconUrl'),
      ],
    },
  ],
};

export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaHref', type: 'text' },
  ],
};

export const TestimonialListBlock: Block = {
  slug: 'testimonialList',
  interfaceName: 'TestimonialListBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'testimonials',
      type: 'array',
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorTitle', type: 'text' },
        imageUrlField('avatarUrl'),
      ],
    },
  ],
};

export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
};

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'images',
      type: 'array',
      fields: [
        imageUrlField('imageUrl', { required: true }),
        { name: 'alt', type: 'text' },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
};

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
};

export const LogoCloudBlock: Block = {
  slug: 'logoCloud',
  interfaceName: 'LogoCloudBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      fields: [
        imageUrlField('imageUrl', { required: true }),
        { name: 'alt', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
};

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  admin: blockRowAdmin,
  fields: [{ name: 'content', type: 'richText', defaultValue: lexicalDoc('') }],
};

export const ContactBlock: Block = {
  slug: 'contact',
  interfaceName: 'ContactBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    { name: 'email', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
  ],
};

// Listing primitive: renders a live grid of items from a content collection
// (newest published first). Its component queries Payload at render time, so the
// listing stays in sync with the collection without per-item seed duplication.
export const CollectionListBlock: Block = {
  slug: 'collectionList',
  interfaceName: 'CollectionListBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      // The slug of the content collection to list. Collections are
      // generation-driven (see `payload/collections/generated.ts`), so this is a
      // free-text slug rather than a fixed select — the cms validator checks it
      // against the site's registered collections (`unknown-collection`).
      name: 'collection',
      type: 'text',
      required: true,
      admin: {
        description:
          'Slug of the content collection to list (e.g. posts). Must match a registered collection.',
      },
    },
    { name: 'limit', type: 'number', defaultValue: 9 },
    // Faceting. `filterByTag` restricts the grid to one topic cluster;
    // `showTagFilter` renders a server-rendered facet bar (links that set
    // `?tag=`) so visitors can filter without client JS; `sortBy` orders the
    // grid. The component reads the active `?tag=` facet from the route's
    // searchParams (threaded through RenderBlocks), so faceting stays
    // SEO-friendly and works under `force-dynamic`.
    {
      name: 'filterByTag',
      type: 'text',
      admin: {
        description:
          'Restrict the grid to one topicCluster (leave empty to list all). ' +
          'A restricted grid never shows the facet bar.',
      },
    },
    {
      name: 'showTagFilter',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show the visitor facet bar (?tag= links). Ignored when filterByTag is set.',
      },
    },
    {
      name: 'sortBy',
      type: 'select',
      defaultValue: 'publishDate',
      options: [
        { label: 'Newest first', value: 'publishDate' },
        { label: 'Title (A–Z)', value: 'title' },
      ],
    },
  ],
};

// Audio embed. Renders a podcast/track player from a provider embed URL
// — the data model (provider + embedUrl) is trivial; the gap this closes is
// having a first-class rendering block so common podcast pages don't each need a
// custom triple.
export const AudioEmbedBlock: Block = {
  slug: 'audioEmbed',
  interfaceName: 'AudioEmbedBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'generic',
      options: [
        { label: 'Spotify', value: 'spotify' },
        { label: 'Apple Podcasts', value: 'apple' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'SoundCloud', value: 'soundcloud' },
        { label: 'Generic (iframe)', value: 'generic' },
      ],
    },
    {
      name: 'embedUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'The provider embed/player URL (used as iframe src).',
      },
    },
    { name: 'caption', type: 'text' },
  ],
};

// People list. A reusable people grid — team members, speakers, podcast
// guests, contributors. Each person is name + role + optional avatar,
// short bio, and link.
export const PeopleListBlock: Block = {
  slug: 'peopleList',
  interfaceName: 'PeopleListBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'people',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'bioShort', type: 'textarea' },
        imageUrlField('avatarUrl'),
        { name: 'href', type: 'text' },
      ],
    },
  ],
};

// Related-by-tag listing. Renders items from the same collection sharing
// a reference item's `topicCluster`. Its component calls `getRelated` (see
// `src/lib/related.ts`) at render time; the item layouts call the same
// primitive for an in-page sidebar.
export const RelatedItemsBlock: Block = {
  slug: 'relatedItems',
  interfaceName: 'RelatedItemsBlock',
  admin: blockRowAdmin,
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'collection',
      type: 'text',
      required: true,
      admin: {
        description:
          'Slug of the content collection to relate within. Must match a registered collection.',
      },
    },
    {
      name: 'fromSlug',
      type: 'text',
      required: true,
      admin: {
        description:
          'Slug of the reference item; related items share its topicCluster.',
      },
    },
    { name: 'limit', type: 'number', defaultValue: 3 },
  ],
};

// Optional per-section background. Every block carries it so a page can express
// a light/dark section rhythm. Empty → the block component's own default
// variant. Read by the shared <Section> wrapper in the components. Values are
// neutral, semantic surface roles — per-brand color comes from the generation /
// design-override layer, not from the shared template.
const backgroundField: Block['fields'][number] = {
  name: 'background',
  type: 'select',
  admin: {
    description:
      'Section background. Leave empty to use the block’s default surface.',
  },
  options: [
    { label: 'Light', value: 'light' },
    { label: 'Muted', value: 'muted' },
    { label: 'Dark', value: 'dark' },
  ],
};

const libraryBlocks: Block[] = [
  HeroBlock,
  FeatureGridBlock,
  CtaBlock,
  TestimonialListBlock,
  FaqBlock,
  GalleryBlock,
  StatsBlock,
  LogoCloudBlock,
  RichTextBlock,
  ContactBlock,
  CollectionListBlock,
  AudioEmbedBlock,
  PeopleListBlock,
  RelatedItemsBlock,
  // `hero` is excluded: its surface is media-driven (overlay vs. plain) and its
  // component never reads `background`, so the select would be a dead control.
].map((b) =>
  b.slug === 'hero' ? b : { ...b, fields: [...b.fields, backgroundField] },
);

// `generatedBlocks` (src/payload/blocks/generated.ts) holds per-site custom
// block schemas the generation pipeline authors when a design needs a bespoke
// section no library block covers. It ships empty; the generator authors each
// schema + component, and the deterministic injection step writes the
// RenderBlocks registry entry.
// Generated blocks are authored without an admin row config, so we force
// `blockRowAdmin` onto them here — otherwise Payload renders its default row
// with the empty "Untitled" block-name input. The block's own `admin` still
// wins for anything else it sets (e.g. className); only the custom Label and
// `disableBlockName` are guaranteed. The `background` field is added by the
// author when wanted.
const withBlockRowAdmin = (block: Block): Block => ({
  ...block,
  admin: {
    ...block.admin,
    ...blockRowAdmin,
    components: { ...block.admin?.components, ...blockRowAdmin?.components },
  },
});

export const layoutBlocks: Block[] = [
  ...libraryBlocks,
  ...generatedBlocks.map(withBlockRowAdmin),
];
