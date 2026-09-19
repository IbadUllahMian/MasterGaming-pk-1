import config from '@payload-config';
import { getPayload } from 'payload';
import type { Where } from 'payload';
import type { CollectionListBlock as CollectionListBlockType } from '@/payload-types';
import { findPublishedItems } from '../../lib/related';
import { ItemCardGrid, itemCardSelect } from './ItemCardGrid';
import { Section } from './Section';

// Route search params, threaded from the page through RenderBlocks. A
// nested server component never receives `searchParams` directly, so the route
// passes them down; the active `?tag=` facet is read here. `searchParams` is not
// a schema field — it is a renderer-injected prop (allowlisted in the cms
// validator's component-props check).
type SearchParams = Record<string, string | string[] | undefined> | undefined;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Listing primitive (async server component). Queries the selected content
// collection for published items and renders a card grid. Supports a hard
// `filterByTag` restriction, an optional server-rendered tag facet bar
// (`?tag=` links, SEO-friendly under `force-dynamic`), and `sortBy`.
// `findPublishedItems` degrades to an empty list when the bound collection does
// not exist on this site (collections are generation-driven), so a stale
// binding renders nothing rather than a 500.
export async function CollectionList({
  heading,
  subheading,
  collection,
  limit,
  filterByTag,
  showTagFilter,
  sortBy,
  background,
  searchParams,
}: CollectionListBlockType & { searchParams?: SearchParams }) {
  if (!collection) return null;
  const payload = await getPayload({ config });

  // A configured `filterByTag` is a HARD restriction: it always applies, and
  // the visitor's `?tag=` must never escape it. Since `topicCluster` is
  // single-valued, faceting inside a one-cluster restriction is meaningless —
  // so the facet bar (and `?tag=`) is honored only when no `filterByTag` is
  // set; a restricted block renders as a plain restricted grid.
  const facetsEnabled = Boolean(showTagFilter) && !filterByTag;
  const activeTag = facetsEnabled ? firstParam(searchParams?.tag) : undefined;
  const effectiveTag = filterByTag || activeTag || undefined;

  const where: Where = {};
  if (effectiveTag) where.topicCluster = { equals: effectiveTag };
  const docs = await findPublishedItems(payload, collection, {
    where,
    sort: sortBy === 'title' ? 'title' : '-publishDate',
    // Bounding (incl. the 0/negative → default coercion) is owned by
    // findPublishedItems — one default, one clamp.
    limit: limit ?? undefined,
    // The grid renders cards only — project to card fields so this listing
    // query (on a force-dynamic path) never fetches richText bodies.
    select: itemCardSelect,
  });

  // Discover the distinct topic clusters for the facet bar from published items
  // (bounded scan, topicCluster field only — no bodies). Done independently of
  // the filtered grid so the bar shows all facets, not just the active one.
  // The 200-item cap is deliberate: a cluster appearing only past it is left
  // out of the bar (a nav affordance, not data) rather than paying an
  // unbounded scan on every render.
  let clusters: string[] = [];
  if (facetsEnabled) {
    const all = await findPublishedItems(payload, collection, {
      limit: 200,
      select: { topicCluster: true },
    });
    clusters = Array.from(
      new Set(
        all.map((d) => d.topicCluster).filter((c): c is string => Boolean(c)),
      ),
    ).sort();
  }

  if (docs.length === 0 && clusters.length === 0) return null;

  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-6xl"
    >
      {heading ? (
        <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
      ) : null}
      {subheading ? <p className="mt-2 opacity-70">{subheading}</p> : null}
      {facetsEnabled && clusters.length > 0 ? (
        <nav className="mt-6 flex flex-wrap gap-2">
          <a
            href="?"
            className={`rounded-full border px-3 py-1 text-sm ${
              activeTag ? 'opacity-60' : 'font-medium'
            }`}
          >
            All
          </a>
          {clusters.map((cluster) => (
            <a
              key={cluster}
              href={`?tag=${encodeURIComponent(cluster)}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                activeTag === cluster ? 'font-medium' : 'opacity-60'
              }`}
            >
              {cluster}
            </a>
          ))}
        </nav>
      ) : null}
      {docs.length > 0 ? (
        <ItemCardGrid items={docs} />
      ) : (
        // Reachable only via the facet bar (a tag matching no published item);
        // an empty note keeps the bar + "All" link so the visitor can recover,
        // where hiding the whole block would strand them.
        <p className="mt-8 text-sm opacity-60">No items match this filter.</p>
      )}
    </Section>
  );
}
