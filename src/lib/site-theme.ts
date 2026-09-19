// Site Settings → CSS custom properties / Google Fonts URL.
// Pure helpers consumed by `(frontend)/layout.tsx` so sanitizers stay
// testable and typed against the generated Payload `SiteSetting` shape
// (not a hand-rolled parallel of colors/fonts fields).

import type { CSSProperties } from 'react';
import type { SiteSetting } from '@/payload-types';

export type SiteColors = SiteSetting['colors'];
export type SiteFonts = SiteSetting['fonts'];

// Allow only safe CSS color literals from the CMS Site Settings global —
// anything else is dropped so a crafted value cannot inject arbitrary CSS
// into <html>.
const CSS_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/]+\))$/;

// Google Font family names: letters/digits, spaces, hyphens. Reject anything
// else so a CMS value cannot break font-family or craft a hostile URL.
const FONT_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

// CSS generic families — not loadable from Google Fonts; must not appear in
// the css2?family=… URL or the whole batch request fails with 400.
const GENERIC_FONT_FAMILIES = new Set([
  'inherit',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
]);

function sanitizeCssColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return CSS_COLOR_RE.test(trimmed) ? trimmed : undefined;
}

function sanitizeFontName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (GENERIC_FONT_FAMILIES.has(trimmed.toLowerCase())) return undefined;
  return FONT_NAME_RE.test(trimmed) ? trimmed : undefined;
}

function fontStack(name: string): string {
  return `'${name}', ui-sans-serif, system-ui, sans-serif`;
}

function monoStack(name: string): string {
  return `'${name}', ui-monospace, monospace`;
}

export type SiteTheme = {
  style?: CSSProperties;
  hasFontVars: boolean;
};

export function siteThemeStyle(
  colors: SiteColors | undefined,
  fonts: SiteFonts | undefined,
): SiteTheme {
  const vars: Record<string, string> = {};
  const primary = sanitizeCssColor(colors?.primary);
  const accent = sanitizeCssColor(colors?.accent);
  if (primary) vars['--brand-primary'] = primary;
  if (accent) vars['--brand-accent'] = accent;

  const heading = sanitizeFontName(fonts?.heading);
  const body = sanitizeFontName(fonts?.body);
  const display = sanitizeFontName(fonts?.display);
  const mono = sanitizeFontName(fonts?.mono);
  if (heading) vars['--brand-font-heading'] = fontStack(heading);
  if (body) vars['--brand-font-body'] = fontStack(body);
  if (display) vars['--brand-font-display'] = fontStack(display);
  if (mono) vars['--brand-font-mono'] = monoStack(mono);

  return {
    style: Object.keys(vars).length ? (vars as CSSProperties) : undefined,
    hasFontVars: Boolean(heading || body || display || mono),
  };
}

export function googleFontsHref(fonts: SiteFonts | undefined): string | null {
  const names = [fonts?.heading, fonts?.body, fonts?.display, fonts?.mono]
    .map(sanitizeFontName)
    .filter((n): n is string => n !== undefined);
  const unique = [...new Set(names)];
  if (unique.length === 0) return null;
  const families = unique
    .map(
      (n) =>
        `family=${encodeURIComponent(n).replace(/%20/g, '+')}:wght@400;500;600;700`,
    )
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// Element-level rules so CMS fonts apply on migrated classic sites that never
// registered Tailwind `font-heading` / `font-body` utilities. Vars are set on
// <html>; these rules only fire when the matching var is present.
export const BRAND_FONT_ELEMENT_CSS = `
body { font-family: var(--brand-font-body, inherit); }
h1, h2, h3, h4, h5, h6 { font-family: var(--brand-font-heading, inherit); }
.font-display { font-family: var(--brand-font-display, inherit); }
code, pre, kbd, samp { font-family: var(--brand-font-mono, ui-monospace, monospace); }
`.trim();
