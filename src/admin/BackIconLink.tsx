'use client';

import { buttonVariants } from '@appsmithorg/kite-ui/components/button';
import { Icon } from '@appsmithorg/kite-ui/components/icon';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

// The one "go back up" control in this admin, shared by the two views that
// need one: a collection's list (back to the dashboard) and a document's edit
// view (back to its list, via BackToParent). One component so the two cannot
// drift into two different-looking back buttons.
//
// Icon-only, with the destination carried as the accessible name and the
// tooltip — an unlabelled arrow would be a mystery to a screen reader.
//
// `next/link`, NOT a raw anchor: admin views all resolve to one catch-all
// route, so a client-side transition keeps the booted Payload SPA mounted; a
// full-document load would tear down and re-boot the whole admin inside its
// iframe.

export function BackIconLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className={buttonVariants({
        variant: 'ghost',
        size: 'icon-sm',
        className: 'kite-back-link shrink-0 rounded-full',
      })}
      href={href}
      aria-label={label}
      title={label}
    >
      <Icon icon={ArrowLeftIcon} size="sm" aria-hidden />
    </Link>
  );
}
