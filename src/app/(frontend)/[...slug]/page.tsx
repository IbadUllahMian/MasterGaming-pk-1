import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';
import { RenderBlocks } from '@/components/blocks/RenderBlocks';
import { RenderItem } from '@/components/collections/RenderItem';
// Full configs are still needed here for the per-collection `custom.schemaType`
// lookup; the routable-slug SET is the shared `contentCollectionSlugs`.
import { generatedCollections } from '@/payload/collections/generated';
import type { ContentItem } from '../../../lib/related';
import {
  contentCollectionSlugs,
  findPublishedItems,
} from '../../../lib/related';
import { CMS_CONTENT_TAG, cmsCached } from '../../../lib/cms-cache';
import {
  itemMetadata,
  itemUrl,
  jsonLdScriptHtml,
  pageJsonLdBlocks,
  pageMetadata,
} from '../../../lib/page-metadata';
import { getBaseUrl } from '../../../lib/site-url';

// Every non-home request renders on the server — no build-time static pages, so CMS
// edits never need a rebuild. The data read itself is cached in production
// (tag-invalidated, 30s TTL backstop — see src/lib/cms-cache.ts) and live in
// the dev sandbox. The generated design authors block components only — never
// this data fetch.
export const dynamic = 'force-dynamic';

// A `Pages` doc always wins; a slug that matches no page falls back to the
// content collections (`contentCollectionSlugs` — the shared definition that
// also drives the sitemap; see its doc comment in `lib/related.ts`).

type Args = {
  params: Promise<{ slug?: string[] }>;
  // Threaded into RenderBlocks so faceted blocks can read `?tag=`.
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Cross-request cached in production (tag-invalidated by the Pages /
// content-collection afterChange hooks, TTL backstop — see
// src/lib/cms-cache.ts); a per-request DB read in the dev sandbox.
const fetchDoc = cmsCached(
  async (slug: string) => {
    const payload = await getPayload({ config });
    const page = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (page.docs[0]) return { kind: 'page' as const, doc: page.docs[0] };
    // A slug that matches no page scans the content collections. Concurrent —
    // each find is an independent round trip to the remote DB, and a serial
    // walk made misses (including every `/favicon.ico`-style stray URL) pay
    // collections × RTT. First match in `contentCollectionSlugs` order still
    // wins, preserving the serial walk's precedence.
    const items = await Promise.all(
      contentCollectionSlugs.map((collection) =>
        findPublishedItems(payload, collection, {
          where: { slug: { equals: slug } },
          limit: 1,
        }),
      ),
    );
    for (let i = 0; i < items.length; i++) {
      const [doc] = items[i];
      if (doc) {
        return {
          kind: 'item' as const,
          collection: contentCollectionSlugs[i],
          doc,
        };
      }
    }
    return null;
  },
  ['query-doc'],
  [CMS_CONTENT_TAG],
);

// Per-request memoized via React `cache()`: both `generateMetadata` and `Page`
// run on every request and would otherwise each fire the lookup. Keyed by the
// joined slug string so the two call sites share one lookup regardless of
// `params` identity.
const queryDoc = cache(fetchDoc);

function slugKey(slugParts?: string[]): string {
  return slugParts?.length ? slugParts.join('/') : 'home';
}

// schema.org `@type` for a collection's items, declared per collection via
// `makeCollection`'s `schemaType` (carried on the config's `custom`).
// 'CreativeWork' is the truthful generic fallback — a podcast or case-study
// item must not be asserted to search engines as an 'Article'. Hoisted to a
// module-level Map: under `force-dynamic` this is consulted per request.
const schemaTypeBySlug = new Map(
  generatedCollections.map((c) => [
    c.slug,
    (c.custom as { schemaType?: string } | undefined)?.schemaType,
  ]),
);
function schemaTypeFor(collection: string): string {
  return schemaTypeBySlug.get(collection) ?? 'CreativeWork';
}

// og:type has a small fixed vocabulary with no podcast/case-study entries —
// only these schema.org types may assert `article`; everything else is the
// generic `website`. An explicit set, not a substring sniff: the two
// vocabularies are independent, and a future schemaType must opt in here
// rather than silently matching.
const ARTICLE_SCHEMA_TYPES = new Set([
  'Article',
  'BlogPosting',
  'NewsArticle',
  'TechArticle',
  'JobPosting',
]);

// JSON-LD structured data for a content item. Emitted as a sibling of the item
// layout so search engines see typed markup (publish date, author, image) for
// every collection item — the neutral item template alone gives them none. The
// `@type` comes from the collection's declared `schemaType` (see
// `schemaTypeFor`). Kept brand-agnostic and additive; a generated design never
// authors this.
function ItemJsonLd({
  item,
  collection,
  url,
}: {
  item: ContentItem;
  collection: string;
  url: string;
}) {
  if (!item.title) return null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaTypeFor(collection),
    headline: item.title,
    description: item.metaDescription ?? undefined,
    datePublished: item.publishDate ?? undefined,
    author: item.author ? { '@type': 'Person', name: item.author } : undefined,
    image: item.ogImageUrl || item.featuredImage || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        // jsonLdScriptHtml escapes '<' so a literal '</script>' in any CMS
        // string cannot close the element (stored XSS).
        __html: jsonLdScriptHtml(jsonLd),
      }}
    />
  );
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const found = await queryDoc(slugKey(slug));
  if (!found) return {};
  if (found.kind === 'page') {
    // Canonical, OG/Twitter, robots, and metadataBase for a `Pages` doc — the
    // pure builder in src/lib/page-metadata.ts (contract-tested there). Every
    // URL of a migrated site is a `Pages` doc, so this branch must carry the
    // full metadata surface, not just title/description (V2-6704).
    return pageMetadata(found.doc, getBaseUrl());
  }
  // Canonical, OG/Twitter, robots and metadataBase for a content-collection
  // item — the pure builder in src/lib/page-metadata.ts, beside the pages one
  // and contract-tested with it. og:type is resolved here because it reads the
  // collection's generation-driven `schemaType`.
  const ogType = ARTICLE_SCHEMA_TYPES.has(schemaTypeFor(found.collection))
    ? ('article' as const)
    : ('website' as const);
  return itemMetadata(found.doc, getBaseUrl(), ogType);
}

export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params;
  const found = await queryDoc(slugKey(slug));
  if (!found) notFound();

  if (found.kind === 'page') {
    const page = found.doc;
    const sp = searchParams ? await searchParams : undefined;
    return (
      <>
        {/* Seeded structured data, the pages counterpart of ItemJsonLd below:
            each stored block is served verbatim — a migration seeds the source
            page's real-world assertions (LocalBusiness address, phone, hours)
            and the platform never regenerates them (V2-6704). */}
        {pageJsonLdBlocks(page).map((block, i) => (
          <script
            key={i}
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(block) }}
          />
        ))}
        <main>
          <RenderBlocks blocks={page.layout} searchParams={sp} />
        </main>
      </>
    );
  }

  // Collection item: rendered through the per-collection item registry,
  // which dispatches to a custom layout when one is registered for this
  // collection and falls back to the neutral DefaultItemLayout otherwise. The
  // JSON-LD sibling gives search engines the typed markup the layout doesn't
  // express.
  const item = found.doc;
  // Same canonical resolution as generateMetadata: a syndicated item's
  // canonicalUrl override must reach JSON-LD's @id too, or structured data
  // contradicts the <link rel=canonical> the same page advertises.
  const canonical = item.canonicalUrl || itemUrl(getBaseUrl(), item.slug);
  return (
    <>
      <ItemJsonLd item={item} collection={found.collection} url={canonical} />
      <RenderItem collection={found.collection} doc={item} />
    </>
  );
}
