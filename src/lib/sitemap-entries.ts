import type { MetadataRoute } from 'next';
import type { Page } from '@/payload-types';
import type { ContentItem } from './related';
import { canonicalPointsElsewhere, pageInSitemap } from './page-metadata';

// Assembles `/sitemap.xml` from what the queries returned, built pure so the
// contract test (`sitemap-entries.test.ts`) can drive it without a database.
// `app/sitemap.ts` owns the Payload reads and is the only intended caller;
// every decision about what reaches the emitted list lives here.

// A `Pages` row as the sitemap queries select it: enough for the shared
// membership decision plus the entry itself.
export type SitemapPageDoc = {
  slug: string;
  updatedAt?: string | null;
} & Pick<Page, 'seo'>;

// The site root, in the shape both failure paths and the no-documents fallback
// emit. Deliberately leaner than `entryFor`: it stands in for a document the
// list does not have, so it asserts nothing about change frequency.
export function siteRootEntry(baseUrl: string): MetadataRoute.Sitemap[number] {
  return { url: baseUrl, lastModified: new Date(), priority: 1.0 };
}

export function entryFor(
  baseUrl: string,
  slug: string,
  updatedAt: string | null | undefined,
  { isHome = false }: { isHome?: boolean } = {},
): MetadataRoute.Sitemap[number] {
  const path = isHome ? '' : `/${slug}`;
  return {
    url: `${baseUrl}${path}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: isHome ? 1.0 : 0.7,
  };
}

export function sitemapEntries({
  baseUrl,
  indexablePages,
  noindexPageSlugs,
  collectionItems,
}: {
  // `null` means the indexable-pages query itself failed — distinct from an
  // empty list, and the one input whose failure the emission depends on.
  indexablePages: SitemapPageDoc[] | null;
  // Slugs of pages carrying the noindex switch. Reservation only; a query
  // failure degrades dedup, never emission, so it arrives here as an empty
  // list.
  noindexPageSlugs: string[];
  // One array per content collection that answered. A collection whose query
  // failed contributes nothing, exactly as an empty one does.
  collectionItems: ContentItem[][];
  baseUrl: string;
}): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  // In the catch-all a `Pages` doc shadows a content item at the same slug —
  // mirror that here so a colliding slug is advertised once (as the page), not
  // as a duplicate URL pointing at content the router never serves.
  const seenSlugs = new Set<string>();
  // Did the homepage DOCUMENT itself withdraw from the sitemap? Only that
  // withdraws the no-documents fallback at the tail — see the comment there.
  let homeOptedOut = false;

  if (indexablePages) {
    for (const page of indexablePages) {
      // Reservation always happens — even an unadvertised page shadows a
      // same-slug content item in the router.
      seenSlugs.add(page.slug);
      // One shared membership decision (page-metadata.ts): a page whose
      // carried robots declare noindex, or whose canonical override points at
      // a genuinely different URL, must not be advertised — listing it would
      // contradict the page's own head. A redundant self-canonical stays
      // advertised.
      if (!pageInSitemap(page, baseUrl)) {
        if (page.slug === 'home') homeOptedOut = true;
        continue;
      }
      entries.push(
        entryFor(baseUrl, page.slug, page.updatedAt, {
          isHome: page.slug === 'home',
        }),
      );
    }
  } else {
    // Indexable-pages query failed — the collections below may still succeed,
    // but the site root must never vanish from the sitemap.
    seenSlugs.add('home');
    entries.push(siteRootEntry(baseUrl));
  }

  for (const slug of noindexPageSlugs) {
    seenSlugs.add(slug);
    if (slug === 'home') homeOptedOut = true;
  }

  for (const items of collectionItems) {
    for (const item of items) {
      if (item.noindex) continue;
      if (item.slug && !seenSlugs.has(item.slug)) {
        // The same canonical rule the pages loop applies, on the item side:
        // items carry their own top-level `canonicalUrl` override
        // (payload/collectionMeta.ts) and the catch-all route already serves
        // it in the item's head and JSON-LD, so advertising an item that
        // canonicalizes elsewhere would contradict what the item itself says.
        // The item's own URL is built the same way `entryFor` builds it, so
        // the decision and the emitted entry judge the same URL.
        if (
          canonicalPointsElsewhere(
            item.canonicalUrl,
            `${baseUrl}/${item.slug}`,
            baseUrl,
          )
        ) {
          continue;
        }
        seenSlugs.add(item.slug);
        entries.push(entryFor(baseUrl, item.slug, item.updatedAt));
      }
    }
  }

  // An empty list here means the site has no documents to advertise — a
  // freshly generated site, or one whose pages are all still drafts. It does
  // NOT mean everything opted out: the indexable-pages query returns zero rows
  // just as readily as it returns a page `pageInSitemap` then rejects, and the
  // template ships `generatedCollections` empty (payload/collections/
  // generated.ts), so a site with no repeating content contributes nothing
  // from the collection pass either. Serving an empty `<urlset>` there hides
  // the site from search engines, which is why the site root is advertised
  // instead — the guarantee this file has carried since #13614.
  //
  // The one document whose own head could contradict that root URL is the
  // homepage, so a homepage that withdrew itself — and nothing else —
  // withdraws the fallback too. `homeOptedOut` is tracked in BOTH page loops:
  // a `home` doc carrying the noindex switch is filtered out of the indexable
  // query server-side and surfaces only in the reservation one.
  if (entries.length === 0 && !homeOptedOut) {
    return [siteRootEntry(baseUrl)];
  }
  return entries;
}
