'use client';

import { useConfig, useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BackIconLink } from './BackIconLink';
import { labelToString } from './payloadLabel';

// The edit view's way back out: an icon-only control sitting immediately left
// of the document title. It replaces Payload's breadcrumb trail, which
// admin-skin.css hides along with the whole app header — in an admin embedded
// in a single tab that trail spent a header line restating the title rendered
// directly below it, while burying the only useful part, getting back to the
// list.
//
// The destination is computed rather than `history.back()`: this admin is
// entered through a token redirect (/admin-login -> /admin/...), so the
// previous history entry is not reliably the list the editor came from.
//
// PORTAL, and why: Payload exposes no slot beside the document title. The
// component is mounted from `beforeDocumentControls` (the one per-document
// slot that carries document context) and portals itself next to the title,
// tagging that row with `data-kite-title-row` so admin-skin.css can lay the
// two out on one line. Rendering in place instead would strand the control in
// the controls strip, away from the title it belongs to.
//
// `next/link`, NOT a raw anchor, for the same reason as Dashboard.tsx: admin
// views all resolve to one catch-all route, so a client-side transition keeps
// the booted Payload SPA mounted; a full-document load would tear down and
// re-boot the whole admin inside its iframe.

export const BackToParent = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo();
  const { config, getEntityConfig } = useConfig();
  const adminRoute = config.routes.admin;
  const [titleRow, setTitleRow] = useState<HTMLElement | null>(null);

  // The title is rendered by Payload outside this slot's subtree, so the row
  // is located after mount. Re-run per document so a client-side navigation
  // to another document re-attaches to that document's title.
  useEffect(
    function attachToDocumentTitle() {
      const heading = document.querySelector<HTMLElement>(
        '.doc-header h1, .collection-edit h1, .global-edit h1',
      );
      const row = heading?.parentElement ?? null;
      if (row) row.setAttribute('data-kite-title-row', '');
      setTitleRow(row);
    },
    [collectionSlug, globalSlug],
  );

  // A collection document goes back to its list; a global has no list, so it
  // goes to the dashboard — titled "Content", which is what the label says.
  const collection = collectionSlug
    ? getEntityConfig({ collectionSlug })
    : undefined;
  const href = collection
    ? `${adminRoute}/collections/${collectionSlug}`
    : adminRoute;
  const label = collection
    ? `Back to ${labelToString(collection.labels?.plural, collectionSlug ?? '')}`
    : 'Back to content';

  // Nothing to go back to on a view that owns neither (defensive: the slot is
  // only ever mounted from a collection or global config).
  if (!collectionSlug && !globalSlug) return null;
  if (!titleRow) return null;

  // A portal always appends, so admin-skin.css orders it left of the title.
  return createPortal(<BackIconLink href={href} label={label} />, titleRow);
};
