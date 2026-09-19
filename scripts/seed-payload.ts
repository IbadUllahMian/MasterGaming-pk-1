/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { getPayload } from 'payload';
import type { Field, SanitizedConfig, Where } from 'payload';
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import config from '../src/payload.config';
import { markdownDoc, markdownEditorConfig } from '../src/payload/lexical';

// Idempotent seed: applies explicit deletions, upserts the SiteSettings global
// and one Pages doc per entry (keyed by `slug`), and ensures one admin user
// exists. Re-seeding never duplicates content.
//
// Source of the manifest, in order of precedence:
//   1. CLI arg:        `tsx scripts/seed-payload.ts path/to/seed.json`
//   2. env SEED_FILE:  absolute or cwd-relative path to a seed.json
//   3. built-in default (a single placeholder home page) so the template
//      renders out of the box during a standalone smoke test.
//
// Required env: APP_DATABASE_URL, PAYLOAD_SECRET, PAYLOAD_SCHEMA.

type SeedDoc = Record<string, unknown> & { slug: string };
type SeedManifest = {
  siteSettings?: Record<string, unknown>;
  pages?: SeedDoc[];
  // Repeating content collections keyed by collection slug (e.g. `posts`).
  collections?: Record<string, SeedDoc[]>;
  deletions?: {
    pages?: string[];
    collections?: Record<string, string[]>;
  };
};

const DEFAULT_MANIFEST: SeedManifest = {
  siteSettings: {
    brandName: 'Untitled Site',
  },
  pages: [
    {
      slug: 'home',
      title: 'Home',
      layout: [
        {
          blockType: 'hero',
          heading: 'Welcome',
          subheading: 'This site is powered by an embedded CMS.',
        },
      ],
    },
  ],
};

// Walk a list of Payload field configs alongside a data object and convert any
// `richText` field whose seed value is a plain string into a Lexical document
// (treating the string as markdown). Seed content may author long-form bodies as
// markdown strings; Payload's Local API rejects a string for richText, so this
// converts in place before upsert. Mirrors the validator's `dataFields`
// flattening so presentational wrappers (row/collapsible/unnamed group/tabs)
// share the parent's data namespace.
function convertRichTextStrings(
  fields: Field[] | undefined,
  data: unknown,
  editorConfig: SanitizedServerEditorConfig,
): void {
  if (!fields || data === null || typeof data !== 'object') return;
  const obj = data as Record<string, unknown>;
  for (const f of fields) {
    if (!f || typeof f !== 'object') continue;
    const type = (f as { type?: string }).type;
    const name = (f as { name?: string }).name;
    const sub = (f as { fields?: Field[] }).fields;
    if (type === 'ui') continue;
    // Presentational wrappers: children live in the parent's namespace.
    if (
      type === 'row' ||
      type === 'collapsible' ||
      (type === 'group' && !name)
    ) {
      convertRichTextStrings(sub, obj, editorConfig);
      continue;
    }
    if (type === 'tabs') {
      for (const tab of (f as { tabs?: { name?: string; fields?: Field[] }[] })
        .tabs ?? []) {
        if (tab.name) {
          convertRichTextStrings(tab.fields, obj[tab.name], editorConfig);
        } else {
          convertRichTextStrings(tab.fields, obj, editorConfig);
        }
      }
      continue;
    }
    if (!name) continue;
    const value = obj[name];
    if (type === 'richText') {
      if (typeof value === 'string') {
        obj[name] = markdownDoc(editorConfig, value);
      }
    } else if (type === 'group') {
      convertRichTextStrings(sub, value, editorConfig);
    } else if (type === 'array') {
      if (Array.isArray(value)) {
        for (const item of value)
          convertRichTextStrings(sub, item, editorConfig);
      }
    } else if (type === 'blocks') {
      if (Array.isArray(value)) {
        const bySlug = new Map(
          (
            (f as { blocks?: { slug: string; fields?: Field[] }[] }).blocks ??
            []
          ).map((b) => [b.slug, b]),
        );
        for (const item of value) {
          const block = bySlug.get(
            (item as { blockType?: string })?.blockType ?? '',
          );
          if (block) convertRichTextStrings(block.fields, item, editorConfig);
        }
      }
    }
  }
}

function loadManifest(): SeedManifest {
  const fromArg = process.argv[2];
  const fromEnv = process.env.SEED_FILE;
  const file = fromArg ?? fromEnv;
  if (file) {
    const resolved = path.isAbsolute(file) ? file : path.resolve(file);
    if (!fs.existsSync(resolved)) {
      throw new Error(`seed file not found: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf-8')) as SeedManifest;
  }
  return DEFAULT_MANIFEST;
}

function mergeNestedFields(
  patch: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const existing = current[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      merged[key] = {
        ...(existing as Record<string, unknown>),
        ...mergeNestedFields(
          value as Record<string, unknown>,
          existing as Record<string, unknown>,
        ),
      };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

async function main() {
  const manifest = loadManifest();
  const payload = await getPayload({ config });

  // Build the markdown→Lexical editor config once; seed docs may carry richText
  // bodies as markdown strings, which are converted in place before upsert.
  const sanitizedConfig = payload.config as unknown as SanitizedConfig;
  const editorConfig = await markdownEditorConfig(sanitizedConfig);
  const fieldsForCollection = (slug: string): Field[] | undefined =>
    sanitizedConfig.collections?.find((c) => c.slug === slug)?.fields;
  const fieldsForGlobal = (slug: string): Field[] | undefined =>
    sanitizedConfig.globals?.find((g) => g.slug === slug)?.fields;

  // Ensure an admin user exists for the platform-token strategy to resolve.
  // No password: the local email/password strategy is disabled on the Users
  // collection, so the signed platform cookie is the only way to authenticate.
  const existingUsers = await payload.count({ collection: 'users' });
  if (existingUsers.totalDocs === 0) {
    const email = process.env.PAYLOAD_ADMIN_EMAIL ?? 'admin@kite.local';
    await payload.create({ collection: 'users', data: { email } });
    console.log(`seeded admin user: ${email}`);
  }

  for (const slug of manifest.deletions?.pages ?? []) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      await payload.delete({
        collection: 'pages',
        id: existing.docs[0].id,
      });
      console.log(`deleted page: ${slug}`);
    }
  }

  for (const [collection, slugs] of Object.entries(
    manifest.deletions?.collections ?? {},
  )) {
    for (const slug of slugs) {
      const existing = await payload.find({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: collection as any,
        where: { slug: { equals: slug } },
        limit: 1,
      });
      if (existing.docs[0]) {
        await payload.delete({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: collection as any,
          id: existing.docs[0].id,
        });
        console.log(`deleted ${collection}: ${slug}`);
      }
    }
  }

  if (manifest.siteSettings) {
    convertRichTextStrings(
      fieldsForGlobal('site-settings'),
      manifest.siteSettings,
      editorConfig,
    );
    const current = await payload.findGlobal({ slug: 'site-settings' });
    const update = mergeNestedFields(
      manifest.siteSettings,
      current as unknown as Record<string, unknown>,
    );
    await payload.updateGlobal({
      slug: 'site-settings',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: update as any,
    });
    console.log('upserted site-settings global');
  }

  const pagesFields = fieldsForCollection('pages');
  for (const page of manifest.pages ?? []) {
    convertRichTextStrings(pagesFields, page, editorConfig);
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      const update = mergeNestedFields(
        page,
        existing.docs[0] as unknown as Record<string, unknown>,
      );
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: update as any,
      });
      console.log(`updated page: ${page.slug}`);
    } else {
      await payload.create({
        collection: 'pages',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: page as any,
      });
      console.log(`created page: ${page.slug}`);
    }
  }

  // Repeating content collections (blog posts, etc.). Upsert by slug exactly
  // like pages, so re-seeding never duplicates items.
  for (const [collection, docs] of Object.entries(manifest.collections ?? {})) {
    const collectionFields = fieldsForCollection(collection);
    for (const doc of docs) {
      convertRichTextStrings(collectionFields, doc, editorConfig);
      const existing = await payload.find({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: collection as any,
        where: { slug: { equals: doc.slug } },
        limit: 1,
      });
      if (existing.docs[0]) {
        const update = mergeNestedFields(
          doc,
          existing.docs[0] as Record<string, unknown>,
        );
        await payload.update({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: collection as any,
          id: existing.docs[0].id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: update as any,
        });
        console.log(`updated ${collection}: ${doc.slug}`);
      } else {
        await payload.create({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: collection as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: doc as any,
        });
        console.log(`created ${collection}: ${doc.slug}`);
      }
    }
  }

  // Last, and never fatal: this is a cosmetic editor preference, while the
  // seed above is the site's entire content. A throw here would exit non-zero,
  // which the platform reads as a failed seed and fails the whole design
  // iteration — trading every page on the site for the preview pane's default
  // position.
  try {
    await defaultEditViewsToLivePreview(payload);
  } catch (err) {
    console.warn('could not default edit views to live preview:', err);
  }

  console.log('seed complete');
  process.exit(0);
}

/**
 * Open the preview-enabled edit views in Live Preview by default.
 *
 * Payload has no config option for the initial edit-view mode: the Document
 * RSC reads the entity's row of `payload-preferences` (`collection-{slug}` /
 * `global-{slug}`) and only renders the preview pane when its `editViewType`
 * is `live-preview`. Seeding that row is therefore the only way to make the
 * preview the first thing an editor sees — a client-side flip would paint the
 * form-only layout first and jump.
 *
 * Two constraints this respects:
 *  - **Write only when unset.** The same row records the editor's own toggle,
 *    so overwriting it would re-force the preview open every seed for someone
 *    who deliberately closed it.
 *  - **Preserve the rest of `value`.** The key is shared with the entity's
 *    other view state (e.g. the Pages list view's columns, sort, limit); a
 *    wholesale write would reset those.
 *
 * Seed only entities opted into `admin.livePreview` (payload.config.ts) —
 * for any other key the split layout would render with an empty pane.
 */
async function defaultEditViewsToLivePreview(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<void> {
  const admin = await payload.find({
    collection: 'users',
    limit: 1,
    sort: 'createdAt',
  });
  const adminUser = admin.docs[0];
  if (!adminUser) return;

  for (const key of ['collection-pages', 'global-site-settings']) {
    // The same where-clause shape Payload's own preferences update uses, so the
    // row this matches is exactly the one the Document view later reads.
    const where: Where = {
      and: [
        { key: { equals: key } },
        { 'user.value': { equals: adminUser.id } },
        { 'user.relationTo': { equals: 'users' } },
      ],
    };

    const existing = await payload.find({
      collection: 'payload-preferences',
      where,
      limit: 1,
    });
    const currentValue = (existing.docs[0]?.value ?? {}) as Record<
      string,
      unknown
    >;
    if (currentValue.editViewType) continue; // the editor's own choice wins

    // `db.upsert` rather than the Local API: the preferences collection's
    // `user` field is required and filled by a `beforeValidate` hook from
    // `req.user`, which a script has none of. With no matching row it inserts.
    await payload.db.upsert({
      collection: 'payload-preferences',
      data: {
        key,
        user: { relationTo: 'users', value: adminUser.id },
        value: { ...currentValue, editViewType: 'live-preview' },
      },
      where,
    });
    console.log(`defaulted ${key} to live preview`);
  }
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
