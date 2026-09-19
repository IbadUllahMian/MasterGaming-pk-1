import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical';
import type {
  DefaultTypedEditorState,
  SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical';
import type { SanitizedConfig } from 'payload';

// Builds a minimal lexical richText document from plain-text paragraphs. A
// Payload `richText` value is a lexical JSON tree (`{ root: { ... } }`), never a
// plain string — seed content and field `defaultValue`s use this helper so the
// shape always matches what the admin's lexical editor reads and writes.
//
//   lexicalDoc('First paragraph.', 'Second paragraph.')
export function lexicalDoc(...paragraphs: string[]): DefaultTypedEditorState {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })),
    },
  } as DefaultTypedEditorState;
}

// Resolve the editor config the markdown→Lexical converter needs. Built once per
// seed run (it's the expensive part) and reused across every `markdownDoc` call.
export async function markdownEditorConfig(
  config: SanitizedConfig,
): Promise<SanitizedServerEditorConfig> {
  return editorConfigFactory.default({ config });
}

// Convert a long-form markdown string into a Lexical richText document, so seed
// content can be authored as markdown (headings, lists, quotes, links, bold)
// rather than hand-built node trees — `lexicalDoc` only carries plain-text
// paragraphs and silently drops every other markdown construct. Runs at seed
// time; the admin still stores/edits real Lexical, so it round-trips on re-seed.
export function markdownDoc(
  editorConfig: SanitizedServerEditorConfig,
  markdown: string,
): DefaultTypedEditorState {
  return convertMarkdownToLexical({
    editorConfig,
    markdown,
  }) as unknown as DefaultTypedEditorState;
}
