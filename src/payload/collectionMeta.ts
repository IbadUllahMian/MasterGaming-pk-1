import type { CollectionConfig, Field } from 'payload';
import { imageUrlField } from './fields';
import {
  revalidateContentAfterChange,
  revalidateContentAfterDelete,
} from './revalidate';

// Standard metadata carried by every content-collection item. These are the
// inference targets the Collections product writes to (import, metadata
// inference, post-publish monitoring) — editors rarely fill them by hand. Keep
// this set stable so those engines always have the same schema to target.
export const collectionMetaFields: Field[] = [
  { name: 'title', type: 'text', required: true },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      description: 'URL path without a leading slash, e.g. blog/my-post.',
    },
  },
  { name: 'author', type: 'text' },
  { name: 'publishDate', type: 'date' },
  {
    name: 'status',
    type: 'select',
    defaultValue: 'draft',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
      { label: 'Needs attention', value: 'needs-attention' },
    ],
  },
  {
    name: 'topicCluster',
    type: 'text',
    admin: { description: 'Topic/content cluster this item belongs to.' },
  },
  {
    name: 'intent',
    type: 'select',
    options: [
      { label: 'SEO', value: 'seo' },
      { label: 'Conversion', value: 'conversion' },
      { label: 'Awareness', value: 'awareness' },
    ],
  },
  { name: 'seoTitle', type: 'text' },
  { name: 'metaDescription', type: 'textarea' },
  imageUrlField('featuredImage', { label: 'Featured Image URL' }),
  // Per-item SEO controls, read by the catch-all route's `generateMetadata` and
  // the sitemap. `canonicalUrl` overrides the default self-referential canonical
  // (for syndicated/duplicate items); `ogImageUrl` overrides the social-share
  // image when it should differ from `featuredImage`; `noindex` removes the item
  // from the sitemap and emits `robots: noindex` so thin/legacy items stay out
  // of the index.
  { name: 'canonicalUrl', type: 'text', label: 'Canonical URL override' },
  imageUrlField('ogImageUrl', { label: 'OG Image URL' }),
  {
    name: 'noindex',
    type: 'checkbox',
    defaultValue: false,
    label: 'Hide from search engines',
  },
];

// Build a standard content collection: the inference-target metadata above plus
// the type-specific `fields`, with consistent admin defaults. Use this for every
// starter type (blog, caseStudy, testimonial, gallery, changelog, faq, teamBios)
// and for inferred custom types, so the data model stays uniform — the
// schema-standards foundation the Collections product builds on.
export function makeCollection(
  slug: string,
  opts: {
    labelSingular?: string;
    labelPlural?: string;
    fields?: Field[];
    // schema.org `@type` the catch-all route's JSON-LD emits for this
    // collection's items (e.g. 'Article', 'PodcastEpisode', 'BlogPosting').
    // Omitted → the emission site falls back to the generic 'CreativeWork',
    // which is truthful for any content item — never assert 'Article' for a
    // collection that isn't one.
    schemaType?: string;
  } = {},
): CollectionConfig {
  return {
    slug,
    // Content items render through the catch-all route's cached lookup —
    // writes must invalidate it just like Pages writes do.
    hooks: {
      afterChange: [revalidateContentAfterChange],
      afterDelete: [revalidateContentAfterDelete],
    },
    labels:
      opts.labelSingular || opts.labelPlural
        ? {
            singular: opts.labelSingular ?? slug,
            plural: opts.labelPlural ?? slug,
          }
        : undefined,
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', 'status', 'publishDate', 'updatedAt'],
      hideAPIURL: true,
    },
    custom: opts.schemaType ? { schemaType: opts.schemaType } : undefined,
    fields: [...collectionMetaFields, ...(opts.fields ?? [])],
  };
}
