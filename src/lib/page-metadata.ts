import type { Metadata } from 'next';
import type { Page } from '@/payload-types';
import type { ContentItem } from './related';

// Metadata for the two kinds of document the catch-all route serves: a `Pages`
// doc (`pageMetadata`) and a content-collection item (`itemMetadata`). Both are
// built pure from the doc plus the resolved site origin (`getBaseUrl()` at the
// call site) so the contract test (`page-metadata.test.ts`) can drive them
// without a database. The catch-all route is the only intended caller.
//
// Everything here is either read off the document or derived from the document's
// own title + description — no other value is ever synthesized. A migrated
// source page that declared no Open Graph / Twitter data must not gain
// fabricated values (V2-6704).

// The one page→URL rule, the counterpart of `itemUrl` below and of `entryFor`
// in app/sitemap.ts: a page renders at `/<slug>`, and the `home` slug is the
// bare origin — the same string the sitemap advertises, so the homepage's
// canonical and its sitemap entry can never disagree.
export function pageUrl(baseUrl: string, slug: string): string {
  return slug === 'home' ? baseUrl : `${baseUrl}/${slug}`;
}

// Serialized form of a JSON-LD block for `<script type="application/ld+json">`.
// Escape '<' — JSON.stringify does not, and a literal '</script>' in any CMS
// string would close the element and execute what follows (stored XSS). '<' is
// valid JSON and parses identically.
export function jsonLdScriptHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// The page's stored JSON-LD, normalized to a list of blocks. Stored verbatim
// at seed time and re-emitted verbatim — never regenerated: these blocks
// assert real-world facts (a LocalBusiness address, phone, opening hours).
// The canonical shape is an array of objects; a single object is accepted,
// and so is JSON text — Payload's json field stores any JSON value and the
// admin editor can hand back a quoted string, so dropping it silently would
// lose exactly the data this field exists to preserve. Text that does not
// parse yields no blocks.
export function pageJsonLdBlocks(page: Page): unknown[] {
  let stored = page.seo?.jsonLd;
  if (typeof stored === 'string') {
    try {
      stored = JSON.parse(stored);
    } catch {
      return [];
    }
  }
  if (Array.isArray(stored)) return stored;
  if (stored && typeof stored === 'object') return [stored];
  return [];
}

// Word-match, not substring: `noindex` must not fire on a token that merely
// contains it. `none` is included — it is defined as `noindex, nofollow`.
// Shared with `pageInSitemap` below so the served robots meta and the
// sitemap's indexability decision cannot disagree.
export function robotsDeclaresNoindex(
  robots: string | null | undefined,
): boolean {
  return /(^|[\s,])(noindex|none)([\s,]|$)/i.test(robots ?? '');
}

// Case-insensitive, trailing-slash-insensitive form for comparing a resolved
// canonical override against the document's own URL. Scheme differences are
// intentionally significant: an override on another scheme is still another
// URL.
function normalizedUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase();
}

// Does a stored canonical override send readers to some OTHER URL than the
// document's own? THE shared rule, applied to both document kinds: a `Pages`
// doc (override nested at `seo.canonicalUrl`) and a content-collection item
// (override top-level at `canonicalUrl`, from `payload/collectionMeta.ts`).
//
// Resolve against `baseUrl` before comparing, because that is what the served
// head does: `pageMetadata` sets `metadataBase`, so Next resolves a stored
// RELATIVE canonical like `/about` to the page's own absolute URL. Comparing
// the raw string instead would read a self-canonical as pointing elsewhere and
// withdraw a page whose head says the opposite.
//
// An override that will not parse withdraws the document: nobody can tell where
// it points, so advertising it risks contradicting the head. Silence in the
// sitemap is the recoverable direction.
export function canonicalPointsElsewhere(
  override: string | null | undefined,
  ownUrl: string,
  baseUrl: string,
): boolean {
  if (!override) return false;
  let resolved: string;
  try {
    resolved = new URL(override, baseUrl).href;
  } catch {
    return true;
  }
  return normalizedUrl(resolved) !== normalizedUrl(ownUrl);
}

// The one sitemap-membership decision for a `Pages` doc, used by
// app/sitemap.ts and pinned by the contract test. A page leaves the sitemap
// when it is noindexed (the switch or its carried robots directives — which
// is exactly what `pageMetadata` serves), or when its canonical override
// points at a DIFFERENT URL: advertising it would contradict the page's own
// head. A redundant self-canonical (the page's own URL stored explicitly,
// give or take case, a trailing slash, or being written relative) keeps the
// page advertised.
export function pageInSitemap(
  page: Pick<Page, 'slug' | 'seo'>,
  baseUrl: string,
): boolean {
  if (page.seo?.noindex) return false;
  if (robotsDeclaresNoindex(page.seo?.robots)) return false;
  return !canonicalPointsElsewhere(
    page.seo?.canonicalUrl,
    pageUrl(baseUrl, page.slug),
    baseUrl,
  );
}

// The `noindex` admin switch always wins on indexability, but it must not
// discard the carried source directives: a source `noindex, follow,
// max-image-preview:large` keeps its own words, and a page noindexed in the
// admin keeps its carried directives with `noindex` prepended. Only with no
// carried string does the switch fall back to the structured form.
function pageRobots(page: Page): Metadata['robots'] {
  const carried = page.seo?.robots || undefined;
  if (page.seo?.noindex) {
    if (!carried) return { index: false, follow: false };
    return robotsDeclaresNoindex(carried) ? carried : `noindex, ${carried}`;
  }
  return carried;
}

export function pageMetadata(page: Page, baseUrl: string): Metadata {
  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? undefined;
  const canonical = page.seo?.canonicalUrl || pageUrl(baseUrl, page.slug);
  const ogImage = page.seo?.ogImageUrl || undefined;
  return {
    // Resolves any relative image URL against the deployed origin instead of
    // the request host.
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    robots: pageRobots(page),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// The one item→URL rule, the content-collection counterpart of `pageUrl`: an
// item renders at `/<slug>`, with no `home` special case — a `Pages` doc always
// owns that slug. Shared by the canonical link, og:url and the item's JSON-LD
// so the three cannot drift from each other.
export function itemUrl(
  baseUrl: string,
  slug: string | null | undefined,
): string {
  return `${baseUrl}${slug ? `/${slug}` : ''}`;
}

// Metadata for a content-collection item — the counterpart of `pageMetadata`,
// pure for the same reason. `ogType` is passed in rather than derived here: it
// comes from the collection's `schemaType`, and collections are
// generation-driven, so that lookup belongs with the route.
export function itemMetadata(
  item: ContentItem,
  baseUrl: string,
  ogType: 'article' | 'website',
): Metadata {
  const title = item.seoTitle ?? item.title ?? undefined;
  const description = item.metaDescription ?? undefined;
  const canonical = item.canonicalUrl || itemUrl(baseUrl, item.slug);
  const ogImage = item.ogImageUrl || item.featuredImage || undefined;
  return {
    // Same reason as `pageMetadata`, and the reason this branch must set it at
    // all: an item's stored `canonicalUrl` or `ogImageUrl` may be RELATIVE, and
    // app/sitemap.ts judges that same stored string against this base URL. With
    // no `metadataBase` anywhere in the item branch's ancestry Next resolves it
    // against its own default origin instead, so the served head and the
    // sitemap disagree about the same item.
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    robots: item.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: title ?? undefined,
      description,
      type: ogType,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: title ?? undefined,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
