// Contract for the SiteSettings bindings the footer must render (V2-7538).
// The `contact` group was editable in the admin ("Brand & Navigation" →
// Contact), saved cleanly, and was read by nothing: the footer is the only
// site-wide surface fed the global, and it bound tagline/copyright/links/
// socials only. An editor filling in phone and address changed nothing
// anywhere on the site. These checks pin every binding, so dropping one
// during a restyle fails here rather than silently orphaning a field.
//
// Renders to a static HTML string rather than a DOM: the template ships no
// unit-test runner, and jsdom would add dependency surface to a package every
// generated customer site is seeded from. Self-contained tsx script, run in CI
// by nextjs-template-code-quality.yml. Exits non-zero on any failure.
//
// Boundary for contract tests in this template — this is the first one that
// targets a file agents own. Every generated site is seeded from this whole
// directory, so a test left in the site's type-check scope can fail that
// customer's `next build` once an agent legitimately reshapes the component it
// imports. `tsconfig.json` therefore excludes `**/*.test.ts(x)` from the app's
// scope, and `tsconfig.test.json` (`pnpm typecheck:tests`) type-checks them
// separately, so the exclusion costs no coverage. Both halves are required:
// exclude a new test from the app scope, and it stays checked.
//
// Run locally: pnpm exec tsx src/components/Footer.test.tsx

// Explicit React import, not the automatic JSX runtime the app uses: this file
// sits outside `tsconfig.json`'s scope (see the boundary note above), so the
// runner falls back to the classic `React.createElement` transform for it.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Footer } from './Footer';
import type { SiteSetting } from '../payload-types';

function makeSettings(overrides: Partial<SiteSetting> = {}): SiteSetting {
  return {
    id: 1,
    brandName: 'Northwind Studio',
    updatedAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-09-10T00:00:00.000Z',
    ...overrides,
  };
}

function render(settings: SiteSetting): string {
  return renderToStaticMarkup(<Footer settings={settings} />);
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

// --- contact: the regression -----------------------------------------------

const withContact = render(
  makeSettings({
    contact: {
      email: 'hi@northwind.studio',
      phone: '+1 555 0100',
      address: '12 Harbour Road\nBristol BS1 4RN',
    },
  }),
);

check(
  'phone saved in the global reaches the page',
  withContact.includes('+1 555 0100'),
);
check(
  'address saved in the global reaches the page',
  withContact.includes('12 Harbour Road'),
);
check(
  'every line of a multi-line address reaches the page',
  withContact.includes('Bristol BS1 4RN'),
);
check(
  'email saved in the global reaches the page',
  withContact.includes('hi@northwind.studio'),
);
check('phone is dialable', withContact.includes('href="tel:+1 555 0100"'));
check(
  'email is mailable',
  withContact.includes('href="mailto:hi@northwind.studio"'),
);
// The rendered output, not the Tailwind utility that achieves it — a restyle
// that preserves the break some other way must still pass.
check(
  'a multi-line address keeps its line breaks',
  withContact.includes('12 Harbour Road\nBristol BS1 4RN'),
);

// An unset group must not render an empty block — the global ships every
// contact field optional, and most sites fill in none of them.
const noContact = render(makeSettings());
check(
  'no contact details renders no address element',
  !noContact.includes('<address'),
);

const partialContact = render(
  makeSettings({ contact: { phone: '+1 555 0100' } }),
);
check(
  'a partially-filled group renders only what is set',
  partialContact.includes('+1 555 0100') && !partialContact.includes('mailto:'),
);

// --- the bindings that already worked, pinned against regression -----------

const full = render(
  makeSettings({
    footer: {
      tagline: 'Design for the long haul',
      copyright: '© 2026 Northwind Studio',
      links: [{ id: 'a', label: 'Privacy', href: '/privacy' }],
    },
    socialLinks: [
      { id: 'b', platform: 'LinkedIn', href: 'https://example.com' },
    ],
  }),
);

check('brand name renders', full.includes('Northwind Studio'));
check('tagline renders', full.includes('Design for the long haul'));
check('copyright renders', full.includes('© 2026 Northwind Studio'));
check(
  'footer links render',
  full.includes('/privacy') && full.includes('Privacy'),
);
check('social links render', full.includes('LinkedIn'));

// --- verdict ---------------------------------------------------------------

if (failures > 0) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('Footer bindings contract OK');
