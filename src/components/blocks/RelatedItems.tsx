import config from '@payload-config';
import { getPayload } from 'payload';
import type { RelatedItemsBlock as RelatedItemsBlockType } from '@/payload-types';
import { getRelated } from '../../lib/related';
import { ItemCardGrid, itemCardSelect } from './ItemCardGrid';
import { Section } from './Section';

// Related-by-tag listing. Renders items from `collection` sharing the
// reference item's (`fromSlug`) topicCluster. Queries Payload at render time via
// the shared `getRelated` primitive, so the listing stays in sync without
// duplicating item content in the seed.
export async function RelatedItems({
  heading,
  collection,
  fromSlug,
  limit,
  background,
}: RelatedItemsBlockType) {
  if (!collection || !fromSlug) return null;
  const payload = await getPayload({ config });
  // Card projection: this block only feeds ItemCardGrid, so the related query
  // must not fetch richText bodies (RenderItem's related path, which feeds
  // open-ended item layouts, stays unprojected).
  const items = await getRelated(
    payload,
    collection,
    fromSlug,
    limit ?? 3,
    itemCardSelect,
  );
  if (items.length === 0) return null;

  return (
    <Section
      background={background}
      fallback="muted"
      innerClassName="max-w-6xl"
    >
      {heading ? (
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      ) : null}
      <ItemCardGrid items={items} />
    </Section>
  );
}
