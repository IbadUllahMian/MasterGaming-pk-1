'use client';

import { useRowLabel } from '@payloadcms/ui';

type BlockRowData = {
  blockType?: string;
  heading?: string;
  eyebrow?: string;
};

// Humanize a block slug for display: "featureGrid" -> "Feature Grid",
// "cta" -> "Cta", "collectionList" -> "Collection List".
function humanizeBlockType(slug?: string): string {
  if (!slug) return 'Block';
  const spaced = slug.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Custom label for each block row in the Pages `layout` field (wired via each
// block's `admin.components.Label`). Payload's default row shows the block type
// plus an editable block-name input whose empty state reads "Untitled" — which
// is noise. We disable that input (`admin.disableBlockName`) and instead show
// "<Block Type> — <heading>" so collapsed rows are identifiable at a glance.
// Falls back to just the block type for blocks without a heading (e.g. richText).
//
// The label is the sole flex child of Payload's `.blocks-field__block-header`
// (inline-flex, width: 100%, overflow: hidden); `min-w-0` lets the flex item
// shrink below its content so `truncate`'s text-overflow can engage instead of
// the label wrapping onto a second line.
export const BlockRowLabel = () => {
  const { data } = useRowLabel<BlockRowData>();
  const type = humanizeBlockType(data?.blockType);
  const title = data?.heading?.trim() || data?.eyebrow?.trim();
  return (
    <span className="block min-w-0 truncate">
      {title ? `${type} — ${title}` : type}
    </span>
  );
};
