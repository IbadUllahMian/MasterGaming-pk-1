import { buttonVariants } from '@appsmithorg/kite-ui/components/button';
import { Card } from '@appsmithorg/kite-ui/components/card';
import { Icon } from '@appsmithorg/kite-ui/components/icon';
import { Gutter } from '@payloadcms/ui';
import {
  BoxIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FileTextIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminViewServerProps, CollectionSlug } from 'payload';
import React from 'react';
import { labelToString } from './payloadLabel';

// Custom admin dashboard (the `/admin` homepage), wired via
// `admin.components.views.dashboard` in payload.config.ts. Replaces Payload's
// stock widget dashboard with the Kite card layout: a "Collections" section and
// a "Globals" section, each a grid of entity cards (brand icon tile, label,
// item count + open/create action). The nav sidebar is hidden in this embedded
// admin, so this dashboard is the editor's entry point for switching between
// content types.
//
// Built from the platform design system (`@appsmithorg/kite-ui`) — Card for the
// surface, `buttonVariants` for the row action, lucide glyphs via the DS Icon
// wrapper, and design-token utilities for everything else — so the Content tab
// reads as the same product as the rest of the app. `Gutter` stays Payload's: it
// is the layout wrapper the admin grid expects, not a visual component.
//
// Cards navigate with `next/link`, NOT raw `<a href>`: admin views all resolve
// to the single `/admin/[[...segments]]` catch-all, so a client-side transition
// is just a param change that keeps the booted admin shell mounted. A plain
// anchor would do a full-document reload of the cross-origin iframe, tearing
// down and re-booting the whole Payload SPA — which stalls on the loading
// splash and can hang the embedded admin entirely.
//
// This is a React Server Component. Payload's DashboardView passes `navGroups`
// (the same Collections/Globals grouping the default nav builds) plus the
// `payload` Local API instance alongside the documented AdminViewServerProps,
// so we read the entity list from `navGroups` and the per-collection counts
// from `payload.count` — no coupling to Payload's internal widget components.
// The design-system pieces used here are all hook-free and render fine in an
// RSC; nothing on this view needs a client boundary.

type NavEntity = {
  slug: string;
  type: 'collections' | 'globals';
  label: Record<string, string> | string;
};

type NavGroup = {
  label: Record<string, string> | string;
  entities: NavEntity[];
};

// `navGroups` is injected by DashboardView on top of AdminViewServerProps.
type DashboardProps = AdminViewServerProps & { navGroups?: NavGroup[] };

// `navGroups` labels are pre-resolved by Payload's groupNavItems — usually a
// plain string, but a localized label config passes through as a record. The
// coercion is shared with the other admin components that render a Payload
// label; see src/admin/payloadLabel.ts.
function resolveLabel(
  label: Record<string, string> | string,
  language: string,
): string {
  return labelToString(label, '', language);
}

// Per-entity glyph. Falls back to the generic cube for any generation-authored
// collection we don't have a specific icon for.
const ENTITY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  users: UsersIcon,
  'site-settings': SettingsIcon,
  pages: FileTextIcon,
};

export async function Dashboard(props: DashboardProps) {
  const { navGroups, payload, i18n } = props;
  const groups = navGroups ?? [];
  const language = i18n?.language ?? 'en';

  // Resolve a per-collection document count once, server-side. Globals are a
  // single document, so they read "1 item".
  const counts = new Map<string, number>();
  await Promise.all(
    groups.flatMap((group) =>
      group.entities
        .filter((entity) => entity.type === 'collections')
        .map(async (entity) => {
          try {
            const result = await payload.count({
              collection: entity.slug as CollectionSlug,
            });
            counts.set(entity.slug, result.totalDocs);
          } catch {
            // A collection that can't be counted (permissions, transient DB)
            // just renders without a count rather than failing the dashboard.
          }
        }),
    ),
  );

  return (
    <Gutter>
      {/* Title block: flex column with a gap rather than a margin on the h1.
          `box-trim` strips the font's leading, so a margin-bottom measures from
          the untrimmed box and reads inconsistently; the gap measures from the
          trimmed one. Same structure the platform uses. */}
      {/* Same top margin as the list view: the app header that used to sit
          above this is gone, so 8px read as cramped against the pane edge. */}
      <header className="mt-6 mb-7 flex flex-col gap-2">
        <h1 className="text-fg-normal text-3xl font-semibold tracking-tight">
          Content
        </h1>
        <p className="text-fg-subtle text-sm">
          Manage your collections and global content types.
        </p>
      </header>

      {groups.map((group) => {
        const groupLabel = resolveLabel(group.label, language);
        return (
          <section className="mb-8" key={groupLabel}>
            <h2 className="text-fg-normal mb-3 text-sm font-semibold">
              {groupLabel}
            </h2>
            <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-0">
              {group.entities.map((entity) => {
                const label = resolveLabel(entity.label, language);
                const isCollection = entity.type === 'collections';
                const href = isCollection
                  ? `/admin/collections/${entity.slug}`
                  : `/admin/globals/${entity.slug}`;
                const count = counts.get(entity.slug);
                const countLabel = isCollection
                  ? `${count ?? 0} ${count === 1 ? 'item' : 'items'}`
                  : '1 item';
                // The row's trailing button as one value rather than three
                // parallel `isCollection` ternaries inline in the JSX: a
                // collection's button creates a new item, a global's just opens
                // it, and target/label/glyph have to agree about which. Derived
                // together, they cannot drift apart in a later edit.
                const rowAction = isCollection
                  ? {
                      href: `/admin/collections/${entity.slug}/create`,
                      label: `Create ${label}`,
                      icon: PlusIcon,
                    }
                  : { href, label: `Open ${label}`, icon: ChevronRightIcon };

                return (
                  <li key={entity.slug}>
                    <Card className="hover:border-bd-neutral flex-row items-center gap-0 py-0 transition-colors">
                      <Link
                        className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4 no-underline"
                        href={href}
                        aria-label={`Open ${label}`}
                      >
                        <span className="bg-bg-primary/12 text-fg-primary grid size-11 shrink-0 place-items-center rounded-md">
                          <Icon
                            icon={ENTITY_ICONS[entity.slug] ?? BoxIcon}
                            size="lg"
                            aria-hidden
                          />
                        </span>
                        <span className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-fg-normal truncate font-semibold">
                            {label}
                          </span>
                          <span className="text-fg-subtle inline-flex items-center gap-1.5 text-xs">
                            <Icon icon={DatabaseIcon} size="xs" aria-hidden />
                            {countLabel}
                          </span>
                        </span>
                      </Link>
                      {/* Styled with `buttonVariants` rather than
                          `<Button asChild>` — the same pattern the platform uses
                          for a link that looks like a button (see
                          frontend/src/components/link-button.tsx). `asChild`
                          also works as of kite-ui 0.1.2; this stays on
                          `buttonVariants` to match the platform, not because
                          `asChild` is unavailable. */}
                      <Link
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'icon-sm',
                          className: 'mr-4 shrink-0 rounded-full',
                        })}
                        href={rowAction.href}
                        aria-label={rowAction.label}
                      >
                        <Icon icon={rowAction.icon} size="sm" aria-hidden />
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Gutter>
  );
}
