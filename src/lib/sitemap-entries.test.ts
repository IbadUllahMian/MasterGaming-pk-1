// Contract for what `/sitemap.xml` actually advertises (lib/sitemap-entries.ts).
// The emission rule this pins hardest: a site with no documents still advertises
// its root. A freshly generated site has zero `Pages` docs and ships
// `generatedCollections` empty, so both passes contribute nothing and the list
// comes back empty through no fault of any document — serving an empty
// `<urlset>` there hides the whole site from search engines. The opposite case
// must survive too: a homepage that withdrew ITSELF (the noindex switch, carried
// robots, or a canonical pointing elsewhere) must not be re-advertised against
// its own head.
//
// The template ships no unit-test runner, so this is a self-contained tsx
// script (run in CI by nextjs-template-code-quality.yml, like the pages
// metadata contract beside it). Exits non-zero on any failure.
//
// Run locally: pnpm exec tsx src/lib/sitemap-entries.test.ts

import type { MetadataRoute } from 'next';
import { sitemapEntries } from './sitemap-entries';
import type { SitemapPageDoc } from './sitemap-entries';
import type { ContentItem } from './related';

const BASE = 'https://example-site.kite.space';

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

// Only the URLs decide what a crawler sees, so that is what these assert.
const urls = (entries: MetadataRoute.Sitemap): string[] =>
  entries.map((entry) => entry.url);

function build({
  indexablePages = [],
  noindexPageSlugs = [],
  collectionItems = [],
}: {
  indexablePages?: SitemapPageDoc[] | null;
  noindexPageSlugs?: string[];
  collectionItems?: ContentItem[][];
} = {}): MetadataRoute.Sitemap {
  return sitemapEntries({
    baseUrl: BASE,
    indexablePages,
    noindexPageSlugs,
    collectionItems,
  });
}

// --- the site root survives an empty site ----------------------------------

check(
  'a site with no documents at all still advertises its root',
  JSON.stringify(urls(build())) === JSON.stringify([BASE]),
);
check(
  'a site whose only page withdrew itself still advertises its root, because that page is not the homepage',
  JSON.stringify(
    urls(
      build({
        indexablePages: [
          { slug: 'about', seo: { canonicalUrl: 'https://elsewhere.example' } },
        ],
      }),
    ),
  ) === JSON.stringify([BASE]),
);
check(
  'a site whose only content item canonicalizes elsewhere still advertises its root',
  JSON.stringify(
    urls(
      build({
        collectionItems: [
          [
            {
              id: 1,
              slug: 'my-post',
              canonicalUrl: 'https://medium.example/syndicated-post',
            },
          ],
        ],
      }),
    ),
  ) === JSON.stringify([BASE]),
);
check(
  'a failed indexable-pages query advertises the root rather than emitting nothing',
  JSON.stringify(urls(build({ indexablePages: null }))) ===
    JSON.stringify([BASE]),
);

// --- a homepage that withdrew ITSELF is not re-advertised ------------------

check(
  'the noindex switch on `home` withdraws the root, and the fallback does not put it back',
  JSON.stringify(urls(build({ noindexPageSlugs: ['home'] }))) ===
    JSON.stringify([]),
);
check(
  'carried robots noindex on `home` withdraws the root',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home', seo: { robots: 'noindex, follow' } }],
      }),
    ),
  ) === JSON.stringify([]),
);
check(
  'a `home` canonicalizing elsewhere withdraws the root',
  JSON.stringify(
    urls(
      build({
        indexablePages: [
          {
            slug: 'home',
            seo: { canonicalUrl: 'https://elsewhere.example/home' },
          },
        ],
      }),
    ),
  ) === JSON.stringify([]),
);

// --- ordinary emission is unchanged ----------------------------------------

check(
  'home is the bare origin and other pages keep their path, with no extra root entry',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home' }, { slug: 'about' }],
      }),
    ),
  ) === JSON.stringify([BASE, `${BASE}/about`]),
);
check(
  'a redundant self-canonical on `home` keeps it advertised exactly once',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home', seo: { canonicalUrl: BASE } }],
      }),
    ),
  ) === JSON.stringify([BASE]),
);
check(
  'a page shadows a same-slug content item, which is advertised once',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home' }, { slug: 'guides' }],
        collectionItems: [
          [
            { id: 1, slug: 'guides' },
            { id: 2, slug: 'flooring-101' },
          ],
        ],
      }),
    ),
  ) === JSON.stringify([BASE, `${BASE}/guides`, `${BASE}/flooring-101`]),
);
check(
  'a noindex page reserves its slug, so a same-slug item stays unadvertised',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home' }],
        noindexPageSlugs: ['secret'],
        collectionItems: [[{ id: 1, slug: 'secret' }]],
      }),
    ),
  ) === JSON.stringify([BASE]),
);
check(
  'a noindex content item is not advertised',
  JSON.stringify(
    urls(
      build({
        indexablePages: [{ slug: 'home' }],
        collectionItems: [[{ id: 1, slug: 'draftish', noindex: true }]],
      }),
    ),
  ) === JSON.stringify([BASE]),
);

// --- verdict ---------------------------------------------------------------

if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('sitemap-entries contract OK');
