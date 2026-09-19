import type { CollectionConfig } from 'payload';

// Per-site content collections, authored by the generation pipeline ONLY when the
// site needs repeating content (blog, case studies, menu, events, team bios, …).
// The template ships this empty: a site with no repeating content has zero
// content collections, so its CMS admin shows only Pages / Users / Brand &
// Navigation (the `site-settings` global).
//
// This array is the single source of truth for "which slugs are content
// collections" — `payload.config.ts` spreads it into `collections`, the
// catch-all route maps it to item-renderable slugs, and the cms validator checks
// `collectionList.collection` against it.
//
// When authoring, build each entry with `makeCollection` (from `../collectionMeta`)
// so every item carries the standard inference-target metadata, e.g.:
//
//   import { makeCollection } from '../collectionMeta';
//   export const generatedCollections: CollectionConfig[] = [
//     makeCollection('posts', {
//       labelSingular: 'Post',
//       labelPlural: 'Posts',
//       fields: [
//         { name: 'excerpt', type: 'textarea' },
//         { name: 'body', type: 'richText' },
//       ],
//     }),
//   ];
export const generatedCollections: CollectionConfig[] = [];
