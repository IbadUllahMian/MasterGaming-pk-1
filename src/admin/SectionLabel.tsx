import { Icon } from '@appsmithorg/kite-ui/components/icon';
import { FileTextIcon, LayersIcon, SearchIcon } from 'lucide-react';
import React from 'react';

// Inline header label for each edit-view section card (Page Details / SEO /
// Layout), wired via `admin.components.Label` on the group/blocks field in
// Pages.ts. Replaces an earlier CSS `::before` icon that rendered detached above
// the header — a real component renders the icon and text on one line, inside
// the field's own header element, which is what Payload's group/blocks layout
// expects.
//
// Glyphs and typography come from the platform design system (lucide icons via
// the DS `Icon` wrapper, design-token utilities for color and weight). These are
// presentational (no hooks), so they render fine as server components.
function SectionLabel({
  icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="text-fg-normal inline-flex items-center gap-2.5 text-base font-semibold">
      <Icon icon={icon} size="md" aria-hidden />
      {text}
    </span>
  );
}

export const PageDetailsLabel = () => (
  <SectionLabel text="Page Details" icon={FileTextIcon} />
);

export const SeoLabel = () => <SectionLabel text="SEO" icon={SearchIcon} />;

export const LayoutLabel = () => (
  <SectionLabel text="Layout" icon={LayersIcon} />
);
