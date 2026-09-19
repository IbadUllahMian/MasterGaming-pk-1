import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const appDir = join(process.cwd(), 'src', 'app');
const outputPath = join(process.cwd(), 'src', 'config', 'pages.generated.json');
const routingContract = JSON.parse(
  await readFile(new URL('./page-routing.generated.json', import.meta.url))
);
const slugPattern = new RegExp(routingContract.slugPattern);
const reservedSlugs = Object.fromEntries(
  Object.entries(routingContract.reservedSlugs).map(([kind, slugs]) => [
    kind,
    new Set(slugs),
  ])
);

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function discoverPages(parent, kind, excludedNames = new Set()) {
  let entries;
  try {
    entries = await readdir(parent, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const pages = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    if (!entry.isDirectory() || excludedNames.has(entry.name)) {
      continue;
    }
    const routeDir = join(parent, entry.name);
    const [pageSource, metadataSource] = await Promise.all([
      readOptional(join(routeDir, 'page.tsx')),
      readOptional(join(routeDir, 'page.json')),
    ]);
    if (pageSource === null && metadataSource === null) {
      continue;
    }
    if (pageSource === null || metadataSource === null) {
      throw new Error(
        `${kind} route ${entry.name} must contain both page.tsx and page.json`
      );
    }
    if (!slugPattern.test(entry.name)) {
      throw new Error(
        `${kind} route folder ${entry.name} must use lowercase kebab-case`
      );
    }
    if (reservedSlugs[kind].has(entry.name)) {
      throw new Error(`${kind} slug ${entry.name} is reserved`);
    }
    const metadata = JSON.parse(metadataSource);
    if (
      metadata === null ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata)
    ) {
      throw new Error(
        `${kind} route ${entry.name} page.json must be an object`
      );
    }
    if ('slug' in metadata || 'kind' in metadata) {
      throw new Error(
        `${kind} route ${entry.name} page.json must not define slug or kind`
      );
    }
    pages.push({
      ...metadata,
      visibility:
        metadata.visibility ?? (kind === 'report' ? 'public' : 'domain'),
      extraViewerDomains: metadata.extraViewerDomains ?? [],
      slug: entry.name,
      kind,
    });
  }
  return pages;
}

const pages = [
  ...(await discoverPages(appDir, 'report', new Set(['dashboards']))),
  ...(await discoverPages(join(appDir, 'dashboards'), 'dashboard')),
];

await writeFile(outputPath, `${JSON.stringify(pages, null, 2)}\n`);
