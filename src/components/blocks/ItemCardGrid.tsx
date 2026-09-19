import type { ContentItem } from '../../lib/related';

// THE projection of exactly the fields these cards read — the listing blocks
// pass it as `select` so a card query never drags full richText bodies over
// the wire. Payload always returns `id` regardless of select, so it is not
// listed. Kept next to the component so the projection can't drift from what
// the cards actually render.
export const itemCardSelect: Record<string, true> = {
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
};

// The item-card grid shared by the listing blocks (CollectionList,
// RelatedItems): image / title / excerpt cards linking to each item's page.
// Not a registered block itself — a layout primitive like `Section`.
export function ItemCardGrid({ items }: { items: ContentItem[] }) {
  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a key={item.id} href={`/${item.slug}`} className="group block">
          {item.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.featuredImage}
              alt=""
              className="aspect-[16/9] w-full rounded-lg object-cover"
            />
          ) : null}
          <h3 className="mt-4 text-lg font-medium group-hover:underline">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="mt-1 text-sm opacity-70">{item.excerpt}</p>
          ) : null}
        </a>
      ))}
    </div>
  );
}
