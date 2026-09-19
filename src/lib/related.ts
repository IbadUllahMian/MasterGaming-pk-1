import type { BasePayload, CollectionSlug, Where } from 'payload';
import type { RichTextBlock } from '@/payload-types';
import { generatedCollections } from '../payload/collections/generated';

// The content collections whose published items render at `/<slug>` — THE one
// definition shared by the catch-all route (dispatch) and the sitemap (URL
// emission), so the two can never drift on which collections are routable.
// Derived from the per-site `generatedCollections` (empty on a site with no
// repeating content) — never the live `payload.collections`, which also holds
// Payload internals (preferences/migrations/locked-documents) with no
// slug/status.
export const contentCollectionSlugs = generatedCollections.map((c) => c.slug);

// THE hand-written shape of a content-collection item — the single source every
// consumer (the catch-all route, CollectionList, RelatedItems, item layouts)
// imports. Hand-written (not derived from `@/payload-types`) because collections
// are generation-driven — no generated doc type is guaranteed to exist on a
// given site. Superset of the standard `collectionMeta` fields plus the common
// optional extras (`excerpt`, `body`); a consumer reads only what it needs.
export type ContentItem = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  author?: string | null;
  excerpt?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  publishDate?: string | null;
  featuredImage?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  noindex?: boolean | null;
  topicCluster?: string | null;
  body?: RichTextBlock['content'];
  // Payload-managed meta, present on every doc regardless of collection config.
  updatedAt?: string | null;
};

// Historical name used by item layouts' `related` prop; same shape.
export type RelatedItem = ContentItem;

// Names of the data fields a collection's config declares (presentational
// wrappers share the parent namespace). Collections are generation-driven and
// may be authored WITHOUT `makeCollection` — querying a field the collection
// lacks (`status`, `topicCluster`, `publishDate`) throws a QueryError and 500s
// the page, so every query clause is guarded on field existence.
function collectionFieldNames(
  payload: BasePayload,
  collection: string,
): Set<string> {
  const names = new Set<string>(['id']);
  type FieldNode = {
    name?: string;
    fields?: FieldNode[];
    tabs?: { name?: string; fields?: FieldNode[] }[];
  };
  const walk = (fields: FieldNode[] | undefined) => {
    for (const f of fields ?? []) {
      if (f?.name) names.add(f.name);
      else if (f) {
        walk(f.fields);
        for (const tab of f.tabs ?? []) {
          if (tab.name) names.add(tab.name);
          else walk(tab.fields);
        }
      }
    }
  };
  walk(
    payload.collections?.[collection as CollectionSlug]?.config
      ?.fields as unknown as FieldNode[],
  );
  return names;
}

// The one query primitive for generation-driven collections. Owns the three
// things every caller was hand-rolling: the existence guard (a bound collection
// may not exist on this site — degrade to an empty list rather than a 500 at
// render), the field guards (clauses on fields the collection lacks are
// dropped, not thrown), and the single unavoidable `as unknown as` cast off
// Payload's generated types. `where` is merged on top of the published filter.
export async function findPublishedItems(
  payload: BasePayload,
  collection: string,
  opts: {
    where?: Where;
    sort?: string;
    limit?: number;
    // Field projection — e.g. `{ topicCluster: true }` for a facet scan that
    // must not drag full richText bodies over the wire.
    select?: Record<string, true>;
  } = {},
): Promise<ContentItem[]> {
  if (!collection || !payload.collections?.[collection as CollectionSlug]) {
    return [];
  }
  const fieldNames = collectionFieldNames(payload, collection);
  const where: Where = {};
  if (fieldNames.has('status')) where.status = { equals: 'published' };
  for (const [key, clause] of Object.entries(opts.where ?? {})) {
    // Our callers filter on plain top-level fields (slug, topicCluster); a
    // clause on a field this collection lacks would throw at query time.
    if (fieldNames.has(key)) {
      where[key] = clause;
    } else if (key === 'slug') {
      // A slug lookup against a collection with no slug field can never match
      // a specific item — dropping the clause would return the FIRST published
      // item for ANY url (200 + wrong content where the router should 404).
      return [];
    } else {
      // Dropping widens the result set (e.g. a filterByTag restriction is
      // lost), so leave a server-side trace rather than a fully silent drop.
      console.warn(
        `[related] dropped filter on "${key}" — collection "${collection}" has no such field`,
      );
    }
  }
  const sort = opts.sort ?? '-publishDate';
  const res = await payload.find({
    collection: collection as CollectionSlug,
    where,
    sort: fieldNames.has(sort.replace(/^-/, '')) ? sort : undefined,
    // Payload treats limit: 0 as "no pagination — return EVERYTHING", so an
    // editor-entered 0 (or a negative) must coerce to the default, not pass
    // through as an unbounded query.
    limit: opts.limit && opts.limit > 0 ? opts.limit : 9,
    depth: 0,
    select: opts.select,
  });
  return res.docs as unknown as ContentItem[];
}

// Related-by-known-cluster primitive: published items in `collection` sharing
// `topicCluster` (or, when the cluster is unknown/empty, the most recent
// published items), excluding the reference slug. Callers that already hold
// the reference doc (RenderItem) use this directly and skip the extra ref
// lookup `getRelated` performs.
export async function getRelatedByCluster(
  payload: BasePayload,
  collection: string,
  opts: {
    slug: string;
    topicCluster?: string | null;
    limit?: number;
    // Optional field projection, forwarded to findPublishedItems. Deliberately
    // NOT defaulted to a card projection: RenderItem hands the results to
    // open-ended generated item layouts that may read any field, so callers
    // that render a known-narrow surface (RelatedItems' cards) opt in.
    select?: Record<string, true>;
  },
): Promise<ContentItem[]> {
  const where: Where = { slug: { not_equals: opts.slug } };
  if (opts.topicCluster) where.topicCluster = { equals: opts.topicCluster };
  return findPublishedItems(payload, collection, {
    where,
    limit: opts.limit ?? 3,
    select: opts.select,
  });
}

// Related-content primitive. Returns published items from `collection`
// that share the reference item's `topicCluster`, excluding the reference item
// itself, newest first. Falls back to recent published items in the collection
// when the reference has no topicCluster (or is not found), so a "related"
// surface is never empty for lack of tagging. Degrades to an empty array rather
// than throwing when the collection is not registered on this site.
export async function getRelated(
  payload: BasePayload,
  collection: string,
  slug: string,
  limit = 3,
  // Optional field projection, threaded to getRelatedByCluster (see the
  // rationale there for why it is opt-in rather than a default).
  select?: Record<string, true>,
): Promise<ContentItem[]> {
  if (!collection || !payload.collections?.[collection as CollectionSlug]) {
    return [];
  }
  const fieldNames = collectionFieldNames(payload, collection);
  let topicCluster: string | null | undefined;
  if (fieldNames.has('slug') && fieldNames.has('topicCluster')) {
    const ref = await payload.find({
      collection: collection as CollectionSlug,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      // topicCluster is a generation-driven collection field, absent from the
      // template's generated select type (same reason ContentItem is hand-written).
      select: { topicCluster: true } as Record<string, true>,
    });
    topicCluster = (ref.docs[0] as { topicCluster?: string | null } | undefined)
      ?.topicCluster;
  }
  return getRelatedByCluster(payload, collection, {
    slug,
    topicCluster,
    limit,
    select,
  });
}
