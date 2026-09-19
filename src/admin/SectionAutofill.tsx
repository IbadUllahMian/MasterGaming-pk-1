'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Block, Field } from 'payload';
import { Skeleton } from '@appsmithorg/kite-ui/components/skeleton';
import { toast, useForm, useFormFields } from '@payloadcms/ui';
import { layoutBlocks } from '@/payload/blocks';
import {
  SECTION_CONTENT_REQUEST,
  SECTION_CONTENT_RESPONSE,
} from './bridgeProtocol';
import { requestFromParent } from './parentRpc';

// Auto-fills a layout block with AI content right after it's added via the CMS's
// native "Add Layout", and shows Payload's native shimmer over that block's
// fields while it generates. Generation runs platform-side (the sandbox admin
// can't reach it directly), so this bridges a request up to the parent window
// (the platform content tab), which calls the platform and posts the generated
// field values back. The values are then written into the live block here.

// Clear a block's generating shimmer if the parent never replies within this
// window (platform error, content tab navigated away, dropped message). Generous
// because the parent round-trip includes LLM + image generation.
const SECTION_FILL_TIMEOUT_MS = 60_000;

// Dispatched on window (detail = whether a fill is in flight) so SaveControls
// can disable Save while a freshly added block is still generating. A newly
// added block's required fields (e.g. Hero -> Heading) start empty, and
// Payload validates the whole form on submit — saving mid-fill would surface a
// spurious "field is invalid" toast for a block the editor never touched.
export const SECTION_FILL_PENDING_EVENT = 'kite:section-fill-pending';

type SerializedField = {
  name: string;
  type: string;
  required?: boolean;
  options?: unknown[];
  isImage?: boolean;
  fields?: SerializedField[];
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function isImageField(field: Field): boolean {
  if (!('name' in field) || field.type !== 'text') return false;
  // `imageUrlField()` tags image fields with `admin.custom.isImage` — the
  // authoritative signal. The `Url`-suffix check is a fallback for any image
  // text field authored without the helper.
  if (field.admin?.custom?.isImage === true) return true;
  return /url$/i.test(field.name);
}

function serializeFields(fields: Field[]): SerializedField[] {
  const out: SerializedField[] = [];
  for (const field of fields) {
    if (field.type === 'ui' || !('name' in field)) continue;
    const s: SerializedField = { name: field.name, type: field.type };
    if ('required' in field && field.required) s.required = true;
    if ('options' in field && Array.isArray(field.options))
      s.options = field.options;
    if (isImageField(field)) s.isImage = true;
    if (
      (field.type === 'group' || field.type === 'array') &&
      'fields' in field
    ) {
      s.fields = serializeFields(field.fields);
    }
    out.push(s);
  }
  return out;
}

const BLOCKS_BY_SLUG = new Map(
  (layoutBlocks as Block[]).map((b) => [b.slug, b]),
);

// Overlays the design system's loading skeleton over the generating block's
// fields, so a section being written by the agent looks the same as any other
// pending surface in the product. Each block row is `#layout-row-${index}`
// (Payload BlockRow); we cover its `.collapsible__content` so the row's header
// stays visible.
function RowShimmer({ index }: { index: number }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const row = document.getElementById(`layout-row-${index}`);
    if (!row) return;
    const content =
      row.querySelector<HTMLElement>('.collapsible__content') ?? row;
    setHost(content);
    const prevPosition = content.style.position;
    const prevMinHeight = content.style.minHeight;
    if (!prevPosition || prevPosition === 'static')
      content.style.position = 'relative';
    content.style.minHeight = '220px';
    return () => {
      content.style.position = prevPosition;
      content.style.minHeight = prevMinHeight;
    };
  }, [index]);

  if (!host) return null;
  return createPortal(
    <div className="bg-bg absolute inset-0 z-5 flex flex-col gap-3.5 py-1">
      <Skeleton className="h-9 w-2/5" />
      <Skeleton className="h-9" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-[150px]" />
    </div>,
    host,
  );
}

export const SectionAutofill = () => {
  const { addFieldRow, dispatchFields, getDataByPath, setModified } = useForm();
  const rows = useFormFields(([fields]) => fields?.layout?.rows);
  // Block-row ids accounted for (present on load + ones we've filled).
  const seen = useRef<Set<string> | null>(null);
  // In-flight fills, in state so the shimmer renders/clears reactively. `key` is
  // a per-fill id, distinct from the bridge requestId owned by requestFromParent.
  const [pending, setPending] = useState<{ key: string; index: number }[]>([]);

  const writeFields = useCallback(
    (value: unknown, dataPath: string, schemaPath: string) => {
      if (Array.isArray(value)) {
        value.forEach((_, i) =>
          addFieldRow({ path: dataPath, schemaPath, rowIndex: i }),
        );
        value.forEach((row, i) => {
          if (isObject(row)) {
            for (const [k, v] of Object.entries(row)) {
              writeFields(v, `${dataPath}.${i}.${k}`, `${schemaPath}.${k}`);
            }
          }
        });
        return;
      }
      if (isObject(value) && !('root' in value)) {
        for (const [k, v] of Object.entries(value)) {
          writeFields(v, `${dataPath}.${k}`, `${schemaPath}.${k}`);
        }
        return;
      }
      dispatchFields({ type: 'UPDATE', path: dataPath, value });
    },
    [addFieldRow, dispatchFields],
  );

  // Ask the parent for on-brand content for one block, show its shimmer until the
  // reply lands (or the request times out), then write the values in.
  const fillBlock = useCallback(
    async (index: number, blockType: string, def: Block) => {
      const key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${blockType}-${index}`;
      setPending((p) => [...p, { key, index }]);
      try {
        // Brand context steers the copy; its absence is non-fatal.
        let brandContext: Record<string, unknown> = {};
        try {
          const res = await fetch('/cms-api/globals/site-settings?depth=0');
          const data = res.ok ? await res.json() : null;
          if (isObject(data)) brandContext = data;
        } catch {
          // leave brandContext empty
        }

        const reply = await requestFromParent(
          SECTION_CONTENT_REQUEST,
          SECTION_CONTENT_RESPONSE,
          { blockType, fieldSchema: serializeFields(def.fields), brandContext },
          SECTION_FILL_TIMEOUT_MS,
        );

        // `null` = the parent never answered within the window; error/no-values =
        // it failed. Both leave the block empty, so tell the editor rather than
        // just clearing the shimmer — a silent empty fill is indistinguishable
        // from a real one and looks like the generation worked.
        if (!reply || reply.error || !isObject(reply.values)) {
          toast.error(
            'Could not generate section content — edit the fields manually or try again.',
          );
          return;
        }

        for (const [field, value] of Object.entries(reply.values)) {
          writeFields(
            value,
            `layout.${index}.${field}`,
            `layout.${blockType}.${field}`,
          );
        }
        // Mark the form dirty so the save-state badge flips to "Unsaved changes"
        // and the editor knows to Save the generated content.
        setModified(true);
      } finally {
        setPending((p) => p.filter((x) => x.key !== key));
      }
    },
    [writeFields, setModified],
  );

  // Detect newly-added blocks and fill them.
  useEffect(() => {
    const ids = (rows ?? [])
      .map((r) => r.id)
      .filter((id): id is string => typeof id === 'string');
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    ids.forEach((id) => {
      if (seen.current!.has(id)) return;
      seen.current!.add(id);
      const layout =
        (getDataByPath('layout') as { id?: string; blockType?: string }[]) ??
        [];
      // Resolve the row's true position in the layout array by id. The index in
      // the filtered id list is NOT authoritative — it diverges if any row lacks
      // a string id — and this index is the write target (`layout.<index>`), so a
      // mismatch would fill the wrong block. Bail if the row can't be located.
      const layoutIndex = layout.findIndex((b) => b?.id === id);
      if (layoutIndex < 0) return;
      const blockType = layout[layoutIndex]?.blockType;
      const def = blockType ? BLOCKS_BY_SLUG.get(blockType) : undefined;
      if (!def || !blockType) return;
      void fillBlock(layoutIndex, blockType, def);
    });
  }, [rows, getDataByPath, fillBlock]);

  // Let SaveControls know whether it's safe to save right now.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(SECTION_FILL_PENDING_EVENT, {
        detail: pending.length > 0,
      }),
    );
  }, [pending.length]);

  if (pending.length === 0) return null;
  return (
    <>
      {pending.map((p) => (
        <RowShimmer key={p.key} index={p.index} />
      ))}
    </>
  );
};
