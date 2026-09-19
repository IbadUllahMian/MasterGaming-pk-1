// Contract for the metadata surface of both document kinds the catch-all route
// serves (V2-6704). Every URL of a migrated site is a `Pages` doc, and the
// original pages branch emitted only title/description/noindex — no canonical,
// no OG/Twitter, no JSON-LD, no carried robots. This script pins the repaired
// contract: self-referential canonical with a per-page override, OG/Twitter
// derived from title + description only (never fabricated beyond them), source
// robots carried verbatim under the noindex switch, and stored JSON-LD returned
// verbatim. It also pins the content-collection item surface, whose emitted
// metadata must resolve its URLs against the same origin app/sitemap.ts judges
// them against.
//
// The template ships no unit-test runner, so this is a self-contained tsx
// script (run in CI by nextjs-template-code-quality.yml, like the
// platform-token forge contract). Exits non-zero on any failure.
//
// Run locally: pnpm exec tsx src/lib/page-metadata.test.ts

import {
  canonicalPointsElsewhere,
  itemMetadata,
  itemUrl,
  jsonLdScriptHtml,
  pageInSitemap,
  pageJsonLdBlocks,
  pageMetadata,
  pageUrl,
  robotsDeclaresNoindex,
} from './page-metadata';
import type { Metadata } from 'next';
import type { Page } from '../payload-types';
import type { ContentItem } from './related';

const BASE = 'https://example-site.kite.space';

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 1,
    title: 'About',
    slug: 'about',
    updatedAt: '2026-08-14T00:00:00.000Z',
    createdAt: '2026-08-14T00:00:00.000Z',
    ...overrides,
  };
}

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

// --- canonical -------------------------------------------------------------

const bare = pageMetadata(makePage(), BASE);
check(
  'canonical is self-referential on the deployed origin',
  bare.alternates?.canonical === `${BASE}/about`,
);
check(
  'home canonicalizes to the bare origin, the same string the sitemap emits',
  pageMetadata(makePage({ slug: 'home' }), BASE).alternates?.canonical === BASE,
);
check(
  'nested slugs keep their full path',
  pageUrl(BASE, 'services/flooring-installation') ===
    `${BASE}/services/flooring-installation`,
);
const overridden = pageMetadata(
  makePage({ seo: { canonicalUrl: 'https://elsewhere.example/about' } }),
  BASE,
);
check(
  'a seeded canonical override survives',
  overridden.alternates?.canonical === 'https://elsewhere.example/about',
);
check(
  'og:url follows the canonical override',
  overridden.openGraph?.url === 'https://elsewhere.example/about',
);

// --- OG / Twitter: derived from title + description, nothing fabricated ----

check('og title comes from the page title', bare.openGraph?.title === 'About');
check(
  'og description absent when the source had none',
  bare.openGraph?.description === undefined,
);
check(
  'no og image is fabricated',
  (bare.openGraph as { images?: unknown })?.images === undefined,
);
check(
  'no twitter image is fabricated',
  (bare.twitter as { images?: unknown })?.images === undefined,
);
check(
  'twitter card is a plain summary without an image',
  (bare.twitter as { card?: string })?.card === 'summary',
);
const withSeo = pageMetadata(
  makePage({
    seo: {
      title: 'About us — Acme',
      description: 'What Acme does.',
      ogImageUrl: 'https://cdn.example/acme.png',
    },
  }),
  BASE,
);
check(
  'seo title wins over the page title',
  withSeo.openGraph?.title === 'About us — Acme',
);
check(
  'description flows into OG',
  withSeo.openGraph?.description === 'What Acme does.',
);
check(
  'an explicit OG image is used',
  JSON.stringify((withSeo.openGraph as { images?: unknown })?.images) ===
    JSON.stringify([{ url: 'https://cdn.example/acme.png' }]),
);
check(
  'metadataBase is the deployed origin',
  bare.metadataBase instanceof URL && bare.metadataBase.origin === BASE,
);

// --- robots ----------------------------------------------------------------

check('no robots emitted when none stored', bare.robots === undefined);
check(
  'source robots directives are carried verbatim',
  pageMetadata(makePage({ seo: { robots: 'max-image-preview:large' } }), BASE)
    .robots === 'max-image-preview:large',
);
check(
  'the noindex switch keeps carried directives, prepending noindex',
  pageMetadata(
    makePage({ seo: { noindex: true, robots: 'max-image-preview:large' } }),
    BASE,
  ).robots === 'noindex, max-image-preview:large',
);
check(
  'a source robots string already declaring noindex is served verbatim',
  pageMetadata(
    makePage({
      seo: { noindex: true, robots: 'noindex, follow, noarchive' },
    }),
    BASE,
  ).robots === 'noindex, follow, noarchive',
);
check(
  'the noindex switch alone keeps the structured form',
  JSON.stringify(
    pageMetadata(makePage({ seo: { noindex: true } }), BASE).robots,
  ) === JSON.stringify({ index: false, follow: false }),
);
check(
  'robotsDeclaresNoindex matches the token, not a substring',
  robotsDeclaresNoindex('noindex, follow') &&
    robotsDeclaresNoindex('NOINDEX') &&
    !robotsDeclaresNoindex('max-image-preview:large') &&
    !robotsDeclaresNoindex('nonoindexy'),
);
check(
  'robots "none" means noindex',
  robotsDeclaresNoindex('none') && robotsDeclaresNoindex('none, noarchive'),
);

// --- sitemap membership: one decision, shared with app/sitemap.ts ----------

check('a plain page is advertised', pageInSitemap(makePage(), BASE));
check(
  'the noindex switch withdraws a page',
  !pageInSitemap(makePage({ seo: { noindex: true } }), BASE),
);
check(
  'carried robots noindex withdraws a page',
  !pageInSitemap(makePage({ seo: { robots: 'noindex, follow' } }), BASE),
);
check(
  'carried robots "none" withdraws a page',
  !pageInSitemap(makePage({ seo: { robots: 'none' } }), BASE),
);
check(
  'benign carried directives keep a page advertised',
  pageInSitemap(makePage({ seo: { robots: 'max-image-preview:large' } }), BASE),
);
check(
  'a canonical override pointing elsewhere withdraws a page',
  !pageInSitemap(
    makePage({ seo: { canonicalUrl: 'https://elsewhere.example/about' } }),
    BASE,
  ),
);
check(
  'a redundant self-canonical keeps a page advertised',
  pageInSitemap(makePage({ seo: { canonicalUrl: `${BASE}/about/` } }), BASE) &&
    pageInSitemap(
      makePage({ slug: 'home', seo: { canonicalUrl: `${BASE}/` } }),
      BASE,
    ),
);
// A stored canonical may be relative: `pageMetadata` sets `metadataBase`, so
// Next resolves `/about` in the served head to the page's own absolute URL. The
// sitemap decision must resolve it the same way or the head and the sitemap
// contradict each other (D1-F7).
check(
  'a RELATIVE self-canonical keeps a page advertised',
  pageInSitemap(makePage({ seo: { canonicalUrl: '/about' } }), BASE),
);
check(
  'a relative canonical pointing at another path withdraws a page',
  !pageInSitemap(makePage({ seo: { canonicalUrl: '/services' } }), BASE),
);
check(
  'an override that will not parse withdraws a page',
  !pageInSitemap(makePage({ seo: { canonicalUrl: 'https://' } }), BASE),
);

// The same decision on the OTHER document kind. A content-collection item keeps
// its override at the TOP level (`canonicalUrl`, from payload/collectionMeta.ts)
// rather than nested under `seo`, and renders at `/<slug>` — app/sitemap.ts
// feeds those two values in (D1-F8).
const itemUrlFor = (slug: string) => `${BASE}/${slug}`;
check(
  'an item canonicalizing elsewhere is excluded from the sitemap',
  canonicalPointsElsewhere(
    'https://medium.example/syndicated-post',
    itemUrlFor('my-post'),
    BASE,
  ),
);
check(
  'an item with a redundant self-canonical stays in the sitemap',
  !canonicalPointsElsewhere(`${BASE}/my-post`, itemUrlFor('my-post'), BASE) &&
    !canonicalPointsElsewhere('/my-post', itemUrlFor('my-post'), BASE) &&
    !canonicalPointsElsewhere(null, itemUrlFor('my-post'), BASE),
);

// --- content-collection items: one origin with the sitemap -----------------

// The item branch of `generateMetadata` builds its own metadata surface, and a
// stored `canonicalUrl` or `ogImageUrl` may be written RELATIVE. Next resolves
// those against the emitted `metadataBase`, while app/sitemap.ts judges the
// same stored string against `getBaseUrl()` — so the two contradict each other
// unless the item's metadata carries that origin. These checks therefore assert
// the RESOLVED absolute URL, which is what a reader of the served head sees.
function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return { id: 1, title: 'My Post', slug: 'my-post', ...overrides };
}

// Resolve one URL out of a metadata object exactly as a consumer of the head
// would. Metadata that cannot resolve its own URLs — the regression these
// checks exist for — reports a failed check instead of aborting the script.
function resolvedIn(md: Metadata, value: unknown): string {
  try {
    return new URL(String(value), md.metadataBase ?? undefined).href;
  } catch {
    return 'unresolvable';
  }
}

const bareItem = itemMetadata(makeItem(), BASE, 'article');
check(
  'an item with no override canonicalizes to its own URL on the deployed origin',
  resolvedIn(bareItem, bareItem.alternates?.canonical) === `${BASE}/my-post`,
);
const relativeItem = itemMetadata(
  makeItem({ canonicalUrl: '/my-post', ogImageUrl: '/img/cover.png' }),
  BASE,
  'article',
);
check(
  "an item's relative self-canonical resolves to the URL the sitemap judges it against",
  resolvedIn(relativeItem, relativeItem.alternates?.canonical) ===
    `${BASE}/my-post` &&
    !canonicalPointsElsewhere('/my-post', itemUrl(BASE, 'my-post'), BASE),
);
check(
  "an item's relative OG image resolves onto the deployed origin",
  resolvedIn(
    relativeItem,
    (relativeItem.openGraph as { images?: { url: string }[] })?.images?.[0]
      ?.url,
  ) === `${BASE}/img/cover.png`,
);
const syndicatedItem = itemMetadata(
  makeItem({ canonicalUrl: 'https://medium.example/syndicated-post' }),
  BASE,
  'article',
);
check(
  "an item's absolute canonical override reaches the head untouched",
  syndicatedItem.alternates?.canonical ===
    'https://medium.example/syndicated-post' &&
    resolvedIn(syndicatedItem, syndicatedItem.alternates?.canonical) ===
      'https://medium.example/syndicated-post',
);

// --- JSON-LD: verbatim round-trip ------------------------------------------

// A realistic seeded block: real-world assertions (address, phone, hours) that
// must round-trip exactly — never be regenerated or approximated.
const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Example Flooring Co.',
  telephone: '+1-555-010-0100',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St',
    addressLocality: 'Oswego',
  },
  openingHours: 'Mo-Fr 09:00-17:00',
};
const nav = { '@type': 'SiteNavigationElement', name: 'Home', url: '/' };

check('no JSON-LD when none stored', pageJsonLdBlocks(makePage()).length === 0);
check(
  'a stored array round-trips verbatim',
  JSON.stringify(
    pageJsonLdBlocks(makePage({ seo: { jsonLd: [localBusiness, nav] } })),
  ) === JSON.stringify([localBusiness, nav]),
);
check(
  'a single stored object is served as one block',
  JSON.stringify(
    pageJsonLdBlocks(makePage({ seo: { jsonLd: localBusiness } })),
  ) === JSON.stringify([localBusiness]),
);
check(
  'JSON text stored by the admin editor round-trips as blocks',
  JSON.stringify(
    pageJsonLdBlocks(
      makePage({ seo: { jsonLd: JSON.stringify([localBusiness, nav]) } }),
    ),
  ) === JSON.stringify([localBusiness, nav]),
);
check(
  'unparseable JSON text yields no blocks',
  pageJsonLdBlocks(makePage({ seo: { jsonLd: 'not json {' } })).length === 0,
);
const escaped = jsonLdScriptHtml({ name: 'x</script><script>alert(1)' });
check('script HTML contains no raw "<"', !escaped.includes('<'));
check(
  'escaped JSON parses back to the identical value',
  (JSON.parse(escaped) as { name: string }).name ===
    'x</script><script>alert(1)',
);

// --- verdict ---------------------------------------------------------------

if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('page-metadata contract OK');
