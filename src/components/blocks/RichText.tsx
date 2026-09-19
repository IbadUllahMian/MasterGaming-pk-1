import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react';
import type { RichTextBlock as RichTextBlockType } from '@/payload-types';
import { Section } from './Section';

export function RichText({ content, background }: RichTextBlockType) {
  if (!content) return null;
  return (
    <Section
      background={background}
      fallback="light"
      innerClassName="max-w-3xl"
    >
      {({ dark }) => (
        <div
          className={`prose max-w-none ${dark ? 'prose-invert' : 'prose-neutral'}`}
        >
          <LexicalRichText data={content} />
        </div>
      )}
    </Section>
  );
}
