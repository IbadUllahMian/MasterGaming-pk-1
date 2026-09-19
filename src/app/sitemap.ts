import type { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { ContentItem } from '../lib/related';
import { contentCollectionSlugs, findPublishedItems } from '../lib/related';
import type { SitemapPageDoc } from '../lib/sitemap-entries';
import { siteRootEntry, sitemapEntries } from '../lib/sitemap-entries';
import { getBaseUrl } from '../lib/site-url';

// Next.js serves this at `/sitemap.xml`. Routes are read live from Payload so
// the sitemap stays in sync with the CMS without a rebuild: every published,
// indexable `Pages` doc plus every published, indexable item of each
// generation-driven content collection (blog posts, podcasts, …). Without the
// collection pass a content site's articles — usually the bulk of its
// indexable surface — would be absent from search engines.
export const dynamic = 'force-dynamic';

// Items render at `/<slug>`; `contentCollectionSlugs` (lib/related.ts) is the
// same definition the catch-all route dispatches on.

// This file owns the reads only. Every decision about what reaches the emitted
// list — reservation, the shared membership rule, and the no-documents
// fallback — lives in the pure `sitemapEntries` (lib/sitemap-entries.ts), which
// the contract test drives without a database.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();
  const repositoryRoutes: MetadataRoute.Sitemap = [
    'tournaments', 'leaderboard', 'rankings', 'news', 'players', 'teams', 'about', 'contact', 'rules', 'terms', 'privacy', 'refund-policy', 'withdrawal-rules', 'help',
  ].map((slug) => ({ url: `${baseUrl}/${slug}`, lastModified, changeFrequency: 'weekly', priority: 0.8 }));

  let payload;
  try {
    payload = await getPayload({ config });
  } catch {
    // DB unreachable at request time — emit just the homepage rather than 500.
    return [siteRootEntry(baseUrl), ...repositoryRoutes];
  }

  // Two server-side-filtered queries so each 1000-doc window is spent on the
  // right set: indexable pages for EMISSION (an unfiltered fetch would let
  // noindex pages evict indexable ones past the window), and noindex page
  // SLUGS for reservation only — a noindex page still shadows a same-slug
  // content item in the router, so its slug must land in seenSlugs even
  // though it is never emitted. Each query fails independently: a homepage
  // fallback keyed to BOTH would emit the site root twice when only the
  // second one throws.
  //
  // `null` on the first is how a failure reaches `sitemapEntries`, which then
  // guarantees the site root; the second and the collections degrade to empty,
  // because losing them costs dedup and reach, never the root.
  let indexablePages: SitemapPageDoc[] | null = null;
  try {
    const pages = await payload.find({
      collection: 'pages',
      limit: 1000,
      depth: 0,
      // SQL `col <> true` is NULL for NULL rows: a directly-inserted page
      // with a null noindex would vanish from BOTH queries while the router
      // (falsy check) still serves it — treat missing as indexable.
      where: {
        or: [
          { 'seo.noindex': { not_equals: true } },
          { 'seo.noindex': { exists: false } },
        ],
      },
    });
    indexablePages = pages.docs as SitemapPageDoc[];
  } catch {
    indexablePages = null;
  }

  let noindexPageSlugs: string[] = [];
  try {
    const noindexPages = await payload.find({
      collection: 'pages',
      limit: 1000,
      depth: 0,
      where: { 'seo.noindex': { equals: true } },
      select: { slug: true },
    });
    noindexPageSlugs = (noindexPages.docs as { slug: string }[]).map(
      (page) => page.slug,
    );
  } catch {
    noindexPageSlugs = [];
  }

  // Content-collection items via the canonical query primitive: it guards
  // field existence, so a collection authored without `status`/`noindex`
  // degrades to an unfiltered list instead of a QueryError swallowing the
  // collection's whole indexable URL set. The catch only covers infra errors;
  // each collection stays independent so one failure can't blank the sitemap.
  // `noindex` is filtered in `sitemapEntries`, not the query: SQL `col <> true`
  // is NULL for NULL rows (same hazard the pages query guards against), and
  // findPublishedItems can't carry an `or`-composite clause. A falsy check
  // matches the router's semantics exactly.
  const collectionItems: ContentItem[][] = [];
  for (const slug of contentCollectionSlugs) {
    try {
      collectionItems.push(
        await findPublishedItems(payload, slug, {
          limit: 5000,
          select: {
            slug: true,
            updatedAt: true,
            noindex: true,
            canonicalUrl: true,
          },
        }),
      );
    } catch {
      // Skip this collection; the rest of the sitemap is unaffected.
    }
  }

  const cmsEntries = sitemapEntries({
    baseUrl,
    indexablePages,
    noindexPageSlugs,
    collectionItems,
  });
  const repositoryUrls = new Set(repositoryRoutes.map((route) => route.url));
  return [...cmsEntries.filter((entry) => !repositoryUrls.has(entry.url)), ...repositoryRoutes];
}
