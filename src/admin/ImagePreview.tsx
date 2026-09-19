'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@appsmithorg/kite-ui/components/dialog';
import { useField } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

// Admin-only field add-on: renders a thumbnail of the Cloudinary URL held by a
// text image field, so editors see the actual image without leaving the form.
// The thumbnail opens a click-to-zoom lightbox; inside it, clicking the image
// toggles between fit-to-screen and actual size. Wired via
// `admin.components.afterInput` on every image-URL field (see
// `src/payload/fields.ts`). Image fields are plain text URLs, not uploads.
//
// The lightbox is the platform design system's Dialog rather than a hand-rolled
// `createPortal` overlay, which means the overlay, radius, shadow and
// enter/exit animation all match every other modal in the product — and Radix
// supplies the portal, focus trap, scroll lock and Escape-to-close that this
// component previously wired up by hand.
type Props = { path: string };

export const ImagePreview = ({ path }: Props) => {
  const { value } = useField<string>({ path });
  const [actualSize, setActualSize] = useState(false);
  // The thumbnail's card chrome must never outrun the image: painted before
  // the bytes arrive (a cold CDN transform can take seconds) it reads as an
  // empty grey strip under the field, and on a URL that never loads it stays
  // one forever. Keep the card hidden until the image has real pixels, and
  // drop it entirely when the load fails.
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const thumbRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A cached image can be complete before React attaches the load handler.
    const el = thumbRef.current;
    if (el?.complete) {
      setLoadState(el.naturalWidth > 0 ? 'ready' : 'error');
    } else {
      setLoadState('loading');
    }
  }, [value]);

  if (!value || typeof value !== 'string') return null;
  if (loadState === 'error') return null;

  return (
    <Dialog onOpenChange={(open) => !open && setActualSize(false)}>
      <div
        className="bg-bg-neutral border-bd-neutral-subtle mt-2 rounded-md border p-2"
        hidden={loadState !== 'ready'}
      >
        <DialogTrigger
          title="Click to zoom"
          aria-label="Zoom image"
          className="block w-full cursor-zoom-in rounded-sm border-none p-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={thumbRef}
            src={value}
            alt=""
            onLoad={() => setLoadState('ready')}
            onError={() => setLoadState('error')}
            className="block max-h-[200px] w-full rounded-sm object-contain"
          />
        </DialogTrigger>
      </div>

      {/* Strip DialogContent's card chrome (background, border, padding, the
          centred fixed-width box) so the image itself is the modal, sized to the
          viewport. The close button DialogContent renders stays.
          The `sm:` duplicate is required: DialogContent's base caps width at
          `sm:max-w-lg`, and tailwind-merge only collapses conflicts within the
          same variant group — an unprefixed max-width does not displace an
          `sm:`-prefixed one, so without it the image is clipped at 512px on any
          screen wider than the `sm` breakpoint.
          Both axes are bounded to the viewport rather than left unbounded:
          DialogContent is a translate-centred fixed box, so an image wider than
          the screen would extend equally off BOTH edges with nothing to scroll
          (Radix locks page scroll while the dialog is open) — "View actual size"
          on a wide asset would crop it irrecoverably. Capped at the viewport,
          `overflow-auto` scrolls it in both axes instead. */}
      <DialogContent
        className="max-h-dvh w-auto max-w-[100dvw] overflow-auto border-none bg-transparent p-8 shadow-none sm:max-w-[100dvw]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          onClick={() => setActualSize((prev) => !prev)}
          title={actualSize ? 'Fit to screen' : 'View actual size'}
          className={
            actualSize
              ? 'block cursor-zoom-out rounded-md'
              : 'block max-h-[90vh] max-w-[90vw] cursor-zoom-in rounded-md object-contain'
          }
        />
      </DialogContent>
    </Dialog>
  );
};
