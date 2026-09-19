import type { ComponentType } from 'react';
import { getPayload } from 'payload';
import config from '@payload-config';
import { getRelatedByCluster } from '../../lib/related';
import type { ContentItem, RelatedItem } from '../../lib/related';
import { DefaultItemLayout } from './DefaultItemLayout';
// Custom per-collection item-layout imports are written between the
// markers below by the deterministic registry injector — do not hand-edit
// between them.
// >>> generated item imports
// <<< generated item imports

// Props every item layout receives: the item's fields (`ContentItem` — THE
// shared content-item shape from lib/related.ts; the index signature carries a
// collection's type-specific extras) spread on top of two renderer-injected
// props — `collection` (the item's collection slug) and `related` (same-cluster
// items, for an in-page sidebar). A layout reads only what it needs.
export type ItemLayoutProps = ContentItem & {
  [key: string]: unknown;
  collection: string;
  related: RelatedItem[];
};

// Per-collection item-layout registry: the baked catch-all route renders
// a content item through this map, keyed by collection slug, falling back to the
// neutral `DefaultItemLayout`. Custom layouts (e.g. an article or podcast layout)
// are registered between the sentinel markers by the deterministic injector —
// never hand-edited — so the literal map stays well-formed (the item triple:
// collection schema ↔ <Name>Layout component ↔ this entry).
const itemComponents: Record<string, ComponentType<ItemLayoutProps>> = {
  // >>> generated item registry
  // <<< generated item registry
};

export async function RenderItem({
  collection,
  doc,
}: {
  collection: string;
  doc: ContentItem & { [key: string]: unknown };
}) {
  const custom = itemComponents[collection] as
    | ComponentType<ItemLayoutProps>
    | undefined;
  const Component = custom ?? DefaultItemLayout;
  // `related` feeds a custom layout's in-page sidebar; the neutral
  // DefaultItemLayout never reads it — skip the lookup on the fallback path so
  // the common case costs no extra DB round-trip. The doc in hand already
  // carries topicCluster, so query by cluster directly (no ref re-fetch).
  const related =
    custom && doc.slug
      ? await getRelatedByCluster(await getPayload({ config }), collection, {
          slug: doc.slug,
          topicCluster: doc.topicCluster,
          limit: 3,
        })
      : [];
  return <Component {...doc} collection={collection} related={related} />;
}
