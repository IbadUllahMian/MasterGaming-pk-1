import type { GalleryBlock as GalleryBlockType } from '@/payload-types';
import { Section } from './Section';

export function Gallery({ heading, images, background }: GalleryBlockType) {
  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-6xl"
    >
      {heading ? (
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {heading}
        </h2>
      ) : null}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {(images ?? []).map((image) => (
          <figure key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.imageUrl}
              alt={image.alt ?? ''}
              className="aspect-[4/3] h-full w-full rounded-lg object-cover"
            />
            {image.caption ? (
              <figcaption className="mt-2 text-center text-sm opacity-60">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </Section>
  );
}
