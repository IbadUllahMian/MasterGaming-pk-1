import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react';
import type { ItemLayoutProps } from './RenderItem';

// Neutral fallback item layout: a centered title/date header over the body
// prose. Used for any content collection without a custom layout. Generated
// designs restyle this or author a per-collection layout; the template
// keeps it brand-agnostic. Reads only the standard `collectionMeta` fields, so
// non-article collections still render the fields they have.
export function DefaultItemLayout({
  title,
  publishDate,
  featuredImage,
  body,
}: ItemLayoutProps) {
  return (
    <main>
      <header className="px-6 pb-10 pt-20 md:px-12 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl">
            {title}
          </h1>
          {publishDate ? (
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-neutral-500">
              {/* Date-only ISO strings parse as UTC midnight; render in UTC so
                  a negative-offset server TZ can't show the previous day. */}
              {new Date(publishDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
              })}
            </p>
          ) : null}
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        {featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={featuredImage}
            alt=""
            className="mb-10 aspect-[16/9] w-full rounded-xl object-cover"
          />
        ) : null}
        {body ? (
          <div className="prose prose-neutral max-w-none">
            <LexicalRichText data={body} />
          </div>
        ) : null}
      </article>
    </main>
  );
}
