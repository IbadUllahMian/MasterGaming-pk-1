---
name: website-sitemap-management
description: >
  Use this skill when adding, moving, renaming, or deleting a page or route, or
  when a change needs a redirect — for example "add a pricing page", "move
  /blog to /resources", or "remove this route". Select the owner of the
  requested route or document, not one owner for the whole site. Update
  repository-owned sitemap membership in the same change, including explicit
  repository routes on CMS-backed sites. Preflight redirect-dependent moves
  and renames, and report the exact blocked requirement before editing.
mode: sandbox
---

# Per-target ownership dispatcher

Resolve the owner of the requested route or document before taking any action.
CMS presence is a site-level signal, not proof that the CMS owns every route.
Inspect the named route, its page file or catch-all, and its data flow; then
choose exactly one branch for each requested value. When one request spans
owners, establish an executable path for every part before editing any part.

1. **External CMS notice:** First honor any **External CMS** notice that names
   the current site. It remains authoritative even when
   `src/payload.config.ts` exists, and `cms-management` never applies to that
   user-owned provider.
   - A route listed as repository-owned, or whose route and data flow prove it
     is repository-owned, continues into **Repository-owned route workflow**.
     Repository code owns its route lifecycle, metadata, sitemap membership,
     and redirect preflight.
   - A route listed as provider-supplied is owned by that provider for document
     lifecycle, slug, and index membership. Report the required provider change
     and do not edit a repository sitemap or CMS seed as a substitute. The
     provider also owns that document's old-URL redirect and search-index
     exclusion. Code, layout, and styling changes remain repository-owned and
     may proceed only when they do not leave the request partially complete. End
     this skill after reporting a provider-only route lifecycle change.
   - For a mixed or unclassified route, trace each requested value to its source.
     Enter the repository workflow only for values proven repository-owned. If
     the requested lifecycle change needs both provider and repository changes
     and the provider change cannot be made here, stop before either change and
     report the provider-owned requirement.
2. **Kite embedded CMS:** Without a matching External CMS notice,
   `src/payload.config.ts` identifies the embedded CMS, but not the owner of the
   requested route.
   - A CMS document rendered by the baked catch-all or a collection route goes
     to `cms-management`. It owns creation, removal, slug, and index membership
     through the canonical page-vs-item noindex field. An existing slug move, or
     a deletion that explicitly requires a replacement redirect, reaches
     **Redirect preflight** first; after a permitted preflight, return to
     `cms-management` for the edit. End this skill after `cms-management`
     completes or reports that CMS-document change.
   - An explicit repository page route continues into
     **Repository-owned route workflow**. Its route lifecycle and metadata stay
     in code, and this skill owns that route's sitemap membership while
     preserving every CMS-derived entry.
3. **File-based Next.js:** When neither CMS branch matches, continue into
   **Repository-owned route workflow**. The route and sitemap are code-owned.

# Repository-owned route workflow

This workflow applies only to a target the dispatcher proved repository-owned:
an ordinary file-based route, a repository-owned route named by an External CMS
notice, or an explicit repository page alongside Kite's embedded CMS. It never
edits provider-owned documents or CMS-derived entries.

## The sitemap target

Edit only `src/app/sitemap.ts`. Next.js serves it at `/sitemap.xml`
automatically, so a `public/sitemap.xml` alongside it would be dead code that
drifts — leave the route file as the single source of truth. When a stale
`frontend/public/sitemap.xml` is present from a pre-migration layout, leave it
alone; it is not served.

## Next.js sitemap (`src/app/sitemap.ts`)

### Create the file if it is missing

On a file-based site, if `src/app/sitemap.ts` does not exist (older sandbox,
partial migration), first confirm `src/lib/site-url.ts` exists. Never rewrite
an existing deploy-URL helper. When it is absent, use this creation-only
exception to create the canonical helper exactly as shown:

```ts
// src/lib/site-url.ts
export function getBaseUrl(): string {
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4321';
}
```

Then create the sitemap with this canonical shape before editing — it ships the
homepage entry.

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  return staticRoutes;
}
```

Then continue to the relevant subsection below.

On an embedded-CMS site, a missing `src/app/sitemap.ts` is a broken template,
not permission to recreate its CMS query from memory. Stop and report the
missing baked sitemap instead.

The sitemap is code, so static routes are listed and data-driven routes are mapped from their data source. Both live in the same file.

### Preserve CMS-derived entries

On an embedded-CMS site, read the existing sitemap before editing it. Preserve
its Payload queries, collection mappings, and return order exactly. Add a
separate `repositoryRoutes: MetadataRoute.Sitemap` list for explicit
repository-owned routes if no such list exists, and concatenate it with the
existing CMS-derived entries in the return value. Never put a CMS document in
that list and never remove or rewrite a CMS-derived entry to complete a
repository route change.

### Adding a static page

For a file-based site, a new static route lives at
`src/app/<slug>/page.tsx`. For an embedded-CMS site, an explicit
repository-owned route lives at `src/app/(frontend)/<slug>/page.tsx` under the
existing frontend route-group layout. Append one entry to the repository-owned
route list: `staticRoutes` on a file-based site or `repositoryRoutes` beside
the preserved CMS entries on an embedded-CMS site. When the route's metadata
is `noindex`, do not add it to the sitemap.

```ts
{
  url: `${baseUrl}/<slug>`,
  lastModified,
  changeFrequency: 'monthly',
  priority: 0.8,
}
```

- Use `${baseUrl}/<slug>` — never a hardcoded origin. The `getBaseUrl()` helper resolves the deploy URL at runtime.
- Reuse the shared `lastModified` constant already defined in the file; do not introduce a per-entry literal date.
- `changeFrequency: 'monthly'` and `priority: 0.8` are the defaults for content pages. The homepage stays at `priority: 1.0` and `changeFrequency: 'weekly'`.

### Adding a dynamic route segment

When a new dynamic route lives at `src/app/<segment>/[<param>]/page.tsx` (e.g. `src/app/blog/[slug]/page.tsx`), drive it from its data source instead of listing each entry by hand:

```ts
import posts from '../../public/content/blog.json';

const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
  url: `${baseUrl}/blog/${post.slug}`,
  lastModified: new Date(post.updatedAt ?? post.publishedAt),
  changeFrequency: 'monthly',
  priority: 0.6,
}));

return [...staticRoutes, ...blogRoutes];
```

- Import from the same JSON file the route's `generateStaticParams` reads. One source of truth — adding a blog post to the JSON updates both the route set and the sitemap.
- If the data source has no per-item timestamp, fall back to the shared `lastModified`.
- Concatenate dynamic groups into the returned array; leave `staticRoutes` unchanged.

### Changing a page's URL

Only after the redirect preflight below permits the change, update the matching
`url:` value and add any required row under **Applying a redirect** in the same
change. The shared `lastModified` already reflects "today".

### Deleting a page

Remove the entry, plus any `import` that was the only consumer of its data
source. A deletion may intentionally return `404` or `410` and does not require
a redirect. If the task explicitly requires the removed URL to redirect to a
replacement, treat it as a move and apply the redirect preflight below.

# Redirect preflight

Preflight every route move or rename, including an embedded-CMS slug change,
before touching the route, slug, or sitemap. There is no authoritative
publication-status query, so treat every route that existed before this coding
run as published and redirect it. Skip the redirect only when this run created
the route, the request states no redirect is needed because the route was
created earlier in the same request, or the requester explicitly accepts that
the old URL will stop resolving. That decision must appear in `website_changes`
or the current task description; never reconstruct it from history or ask
mid-run on a headless surface. A `noindex` marker does not waive the redirect.
Deletions follow **Deleting a page** and need no redirect.

A required redirect makes the move one change: route or slug edit, sitemap
edit, and `redirects.csv` row together. If the row cannot be written, leave the
route untouched and report the blocker with the exact row.

# Applying a redirect

`redirects.csv` is the site's only redirect owner and lives in the app's
project root beside `next.config.*` (the app subdirectory on an imported
monorepo). `middleware.ts`, `vercel.ts`, and `vercel.json` are
platform-protected; never put a redirect there, and never add a page-level
`redirect()` for something a row can express. Use Vercel's standard bulk
redirects CSV: `source,destination,statusCode,caseSensitive,preserveQueryParams`.

- Paths are site-relative; an external `destination` only when the request
  states it.
- `301` permanent, `302` temporary, `308`/`307` when the method must be
  preserved. Default `caseSensitive=false`, `preserveQueryParams=true`.
- Read before writing. One row per `source`; replace an existing row only when
  the request changes it. No self-redirects, chains, or loops — point at the
  final destination. Do not redirect a `source` that still resolves, and add,
  remove, or change only the rows the request names.
- Create the file with its header if missing; plain CSV, no comments or blank
  rows.
- Remove any `next.config.*` rule for the same `source`. If `middleware.ts`
  redirects it, write the CSV row and report the overlap.

# Redirect verification

- Exactly one row for the requested `source`, with the requested destination
  and an allowed status; no other row changed.
- No self-redirect, chain, or loop; no `source` still resolves to a live route.
- Header first and unchanged; five fields per row.
- If the row could not be written, no route, slug, or sitemap file changed and
  the result carries the exact row.

# Repository-route verification

These checks apply after the repository-owned route workflow:

- The only sitemap edit was `src/app/sitemap.ts`; edits owned by the calling
  workflow, such as a page's `noindex` metadata, are outside this check.
- Every repository-owned indexable live route appears exactly once. Every
  repository-owned route intentionally excluded from search (including
  noindexed ad landing pages) and every removed repository route is absent.
- On an embedded-CMS site, the prior CMS queries and CMS-derived sitemap entries
  are unchanged.
- The sitemap code type-checks.
