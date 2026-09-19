import { BoxIcon } from 'lucide-react';
import React from 'react';

// Replaces the cube glyph in the admin step-nav (breadcrumb home link) via
// `admin.components.graphics.Icon`. The embedded admin never shows the login
// screen, so the matching `graphics.Logo` is intentionally left as default —
// only this small breadcrumb mark is product-facing.
//
// Uses the design system's icon set (lucide `box`) instead of a hand-inlined
// path; `currentColor` (lucide's default stroke) lets the step-nav's own color
// rules drive it.
//
// Sizes to `100%` (like Payload's default `PayloadIcon`) so it fills its
// `.step-nav__home` slot instead of overflowing it — a hardcoded pixel size
// larger than that slot gets clipped, which is what cut off the top of the
// mark. The slot itself is sized in admin-skin.css (`.step-nav__home`).
export const KiteIcon = () => (
  <BoxIcon className="size-full" strokeWidth={1.7} aria-hidden />
);
