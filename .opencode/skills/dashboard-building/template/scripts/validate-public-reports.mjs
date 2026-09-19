import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const pages = JSON.parse(
  readFileSync('src/config/pages.generated.json', 'utf8')
);

// Which public reports this build is answerable for. A portal is one build,
// so without a scope one stale page would block every later publish for the
// team; the platform gates a submit only on the routes it changed (a shared
// file under src/ changes them all). The deploy snapshot names those routes
// in a generated file; a sandbox build (no such file) treats every route with
// a file newer than the inbound mirror stamp as changed; with neither signal
// every public report is validated.
const VALIDATION_SCOPE_FILE =
  'src/config/public-report-validation.generated.json';
const MIRROR_STAMP = join('..', '.kite-mirror-stamp');

function newestMtimeMs(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtimeMs(path));
    else if (entry.isFile()) newest = Math.max(newest, statSync(path).mtimeMs);
  }
  return newest;
}

function reportSlugsInScope() {
  if (existsSync(VALIDATION_SCOPE_FILE)) {
    const scope = JSON.parse(readFileSync(VALIDATION_SCOPE_FILE, 'utf8'));
    const slugs = scope.changedReportSlugs;
    return slugs === null || slugs === undefined
      ? { slugs: null, label: 'all' }
      : {
          slugs: new Set(slugs),
          label: 'changed by this submit, or owed from a rejected deploy',
        };
  }
  if (existsSync(MIRROR_STAMP)) {
    const stampMs = statSync(MIRROR_STAMP).mtimeMs;
    const changed = new Set();
    for (const page of pages) {
      const routeDir = join('src', 'app', page.slug);
      if (existsSync(routeDir) && newestMtimeMs(routeDir) > stampMs)
        changed.add(page.slug);
    }
    return {
      slugs: changed,
      label:
        'touched since the last file sync; reports owed from a rejected deploy are checked at deploy time',
    };
  }
  return { slugs: null, label: 'all' };
}

const { slugs: scope, label: scopeLabel } = reportSlugsInScope();
const publicReports = pages.filter(
  page => page.kind === 'report' && page.visibility === 'public'
);
const inScope =
  scope === null ? publicReports : publicReports.filter(p => scope.has(p.slug));
console.error(
  `Validating ${inScope.length} of ${publicReports.length} public report(s) (${scopeLabel})`
);

function elementContentById(html, id) {
  const tags = /<(\/?)([a-z][\w:-]*)\b[^>]*>/gi;
  for (const match of html.matchAll(tags)) {
    if (match[1] || !new RegExp(`\\bid=["']${id}["']`, 'i').test(match[0])) {
      continue;
    }
    const tag = match[2].toLowerCase();
    const contentStart = match.index + match[0].length;
    let depth = 1;
    const nestedTags = new RegExp(tags.source, tags.flags);
    nestedTags.lastIndex = contentStart;
    for (const nested of html.matchAll(nestedTags)) {
      if (nested[2].toLowerCase() !== tag || nested[0].endsWith('/>')) continue;
      depth += nested[1] ? -1 : 1;
      if (depth === 0) return html.slice(contentStart, nested.index);
    }
    return undefined;
  }
  return undefined;
}

function attributeValue(tag, name) {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i')
  );
  return match
    ?.slice(1)
    .find(value => value !== undefined)
    ?.trim();
}

function hasAttribute(tag, name) {
  const attributes = tag.replace(/"[^"]*"|'[^']*'/g, '');
  return new RegExp(`\\s${name}(?=\\s|=|/?>)`, 'i').test(attributes);
}

function decodeText(content) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };
  const decodeCodePoint = (entity, value, radix) => {
    const codePoint = Number.parseInt(value, radix);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  };

  return content
    .replace(/&#(\d+);/g, (entity, value) => decodeCodePoint(entity, value, 10))
    .replace(/&#x([\da-f]+);/gi, (entity, value) =>
      decodeCodePoint(entity, value, 16)
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name) => namedEntities[name.toLowerCase()] ?? entity
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlTokens(content) {
  const tokens = [];
  let cursor = 0;

  while (cursor < content.length) {
    if (content[cursor] !== '<') {
      const tagStart = content.indexOf('<', cursor);
      const end = tagStart === -1 ? content.length : tagStart;
      tokens.push(content.slice(cursor, end));
      cursor = end;
      continue;
    }

    if (content.startsWith('<!--', cursor)) {
      const commentEnd = content.indexOf('-->', cursor + 4);
      const end = commentEnd === -1 ? content.length : commentEnd + 3;
      tokens.push(content.slice(cursor, end));
      cursor = end;
      continue;
    }

    let quote;
    let tagEnd = cursor + 1;
    for (; tagEnd < content.length; tagEnd += 1) {
      const character = content[tagEnd];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        tagEnd += 1;
        break;
      }
    }
    tokens.push(content.slice(cursor, tagEnd));
    cursor = tagEnd;
  }

  return tokens;
}

function visibleReportHeadings(content) {
  const ignoredTags = new Set(['canvas', 'script', 'style', 'svg', 'template']);
  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);
  const stack = [];
  const headings = [];

  for (const token of htmlTokens(content)) {
    if (!token.startsWith('<')) {
      if (!stack.at(-1)?.hidden) {
        stack.findLast(entry => entry.tag === 'h1')?.text.push(token);
      }
      continue;
    }
    if (token.startsWith('<!--')) continue;

    const tagMatch = token.match(/^<\/?([a-z][\w:-]*)/i);
    if (!tagMatch) continue;
    const tag = tagMatch[1].toLowerCase();
    if (token.startsWith('</')) {
      const index = stack.findLastIndex(entry => entry.tag === tag);
      if (index >= 0) {
        const [entry] = stack.splice(index);
        if (entry.tag === 'h1' && !entry.hidden) {
          headings.push(decodeText(entry.text.join('')));
        }
      }
      continue;
    }

    const style =
      attributeValue(token, 'style')?.replace(/\s+/g, '').toLowerCase() || '';
    const hidden =
      Boolean(stack.at(-1)?.hidden) ||
      ignoredTags.has(tag) ||
      hasAttribute(token, 'hidden') ||
      attributeValue(token, 'aria-hidden')?.toLowerCase() === 'true' ||
      /(?:^|;)display:none(?:!important)?(?:;|$)/.test(style) ||
      /(?:^|;)visibility:hidden(?:!important)?(?:;|$)/.test(style) ||
      /(?:^|;)content-visibility:hidden(?:!important)?(?:;|$)/.test(style);
    if (!voidTags.has(tag) && !token.endsWith('/>'))
      stack.push({ tag, hidden, text: [] });
  }

  return headings;
}

for (const page of inScope) {
  const outputPath = join('.next', 'server', 'app', `${page.slug}.html`);
  if (!existsSync(outputPath)) {
    throw new Error(
      `Public report ${page.slug} must produce static HTML and remain usable without JavaScript`
    );
  }

  const rendered = readFileSync(outputPath, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const reportContent = elementContentById(rendered, 'portal-content');
  if (reportContent === undefined) {
    throw new Error(`Public report ${page.slug} is missing #portal-content`);
  }
  const title = typeof page.title === 'string' ? decodeText(page.title) : '';
  const headings = visibleReportHeadings(reportContent);
  if (/<\s*kite-[a-z][\w-]*(?=[\s/>])/i.test(reportContent)) {
    throw new Error(
      `Public report ${page.slug} renders a live Kite component; use a build-time snapshot`
    );
  }
  if (!title || !headings.includes(title)) {
    const observed = headings.length
      ? headings.map(heading => JSON.stringify(heading)).join(', ')
      : 'none';
    throw new Error(
      `Public report ${page.slug} must render a visible, server-rendered h1 whose normalized text exactly matches page.json title; expected ${JSON.stringify(page.title)}, found ${observed}`
    );
  }
}
