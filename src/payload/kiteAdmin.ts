import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { KITE_FIELD_COMPONENTS } from './fields';

// Applies the design-system admin UI across the WHOLE config, in one place.
//
// WHY CENTRAL AND NOT PER-FIELD: the alternative is spreading
// `KITE_FIELD_COMPONENTS` onto every field by hand, which only ever covers the
// files someone remembered to edit. That left the two hand-edited configs
// (Pages, SiteSettings) on the design system while the layout blocks — the
// primary page-editing surface — and every `makeCollection` content collection
// kept Payload's stock inputs, so a single form mixed both control styles. It
// also cannot cover `collections/generated.ts` and `blocks/generated.ts` at all,
// since those are authored per-site by the generation pipeline and never see
// this repo's edits.
//
// Applying it here instead makes "every text / textarea / checkbox in the admin
// is a design-system control" true by construction rather than by convention.
//
// NOT COVERED, deliberately: `select`, `date`, `number`, `richText` and the
// array/blocks row chrome have no kite-ui counterpart wired up yet, so they
// keep Payload's own UI. Adding one is a matter of writing the renderer and
// adding a line to the map below — no call sites change.

// Field types that have a design-system renderer, keyed by Payload's `type`.
const FIELD_COMPONENTS_BY_TYPE: Record<
  string,
  (typeof KITE_FIELD_COMPONENTS)[keyof typeof KITE_FIELD_COMPONENTS]
> = {
  checkbox: KITE_FIELD_COMPONENTS.switch,
  text: KITE_FIELD_COMPONENTS.text,
  textarea: KITE_FIELD_COMPONENTS.textarea,
};

const KITE_LIST_VIEW = '/admin/KiteListView#KiteListView';
const BACK_TO_PARENT = '/admin/BackToParent#BackToParent';

// Container field types nest their children differently: most use `fields`,
// a `blocks` field holds `blocks[].fields`, and `tabs` holds `tabs[].fields`.
// All three are walked so a field is converted wherever it lives — including
// inside a layout block, an array row or a group.
function withKiteField(field: Field): Field {
  // Payload's `Field` is a wide union whose members nest children under
  // different keys, and spreading a union member loses the discriminant as far
  // as TypeScript is concerned. The rewritten parts are therefore assembled as
  // a plain record and merged over the original field, which keeps every
  // property the union member had at runtime.
  const source = field as Field & {
    fields?: Field[];
    blocks?: { fields: Field[] }[];
    tabs?: { fields: Field[] }[];
    admin?: { components?: Record<string, unknown> };
  };

  const rewritten: Record<string, unknown> = {};

  if (Array.isArray(source.fields)) {
    rewritten.fields = source.fields.map(withKiteField);
  }
  if (Array.isArray(source.blocks)) {
    rewritten.blocks = source.blocks.map((block) => ({
      ...block,
      fields: block.fields.map(withKiteField),
    }));
  }
  if (Array.isArray(source.tabs)) {
    rewritten.tabs = source.tabs.map((tab) => ({
      ...tab,
      fields: tab.fields.map(withKiteField),
    }));
  }

  const components = FIELD_COMPONENTS_BY_TYPE[field.type];
  // A field that already names its own `Field` component wins: `imageUrlField`
  // pairs its renderer with an `afterInput` thumbnail, and a bespoke renderer
  // added later must not be silently replaced by the generic one.
  if (components && !source.admin?.components?.Field) {
    rewritten.admin = {
      ...source.admin,
      components: { ...source.admin?.components, ...components },
    };
  }

  if (Object.keys(rewritten).length === 0) return field;

  return { ...field, ...rewritten } as Field;
}

// The design-system list view replaces Payload's DefaultListView. It reads the
// collection's labels, `useAsTitle` and column state from config rather than
// hardcoding a collection, so it is applied to every collection here — a
// site's generated content collections must not land the editor on a
// differently-designed list one click away from Pages. This is also what makes
// DefaultListView unreachable, so none of its markup needs skinning.
export function withKiteAdmin(collection: CollectionConfig): CollectionConfig {
  const existingViews = collection.admin?.components?.views;
  const existingEdit = collection.admin?.components?.edit;

  return {
    ...collection,
    admin: {
      ...collection.admin,
      components: {
        ...collection.admin?.components,
        views: {
          ...existingViews,
          // Same precedence rule as fields: an explicit override wins.
          list: existingViews?.list ?? { Component: KITE_LIST_VIEW },
        },
        edit: {
          ...existingEdit,
          // The Back control is applied centrally for the same reason as the
          // list view: admin-skin.css hides the breadcrumb trail for the whole
          // admin, so a collection without this slot would leave the editor on
          // a document with no way back to its list — and a site's generated
          // content collections never opt in by hand.
          beforeDocumentControls: existingEdit?.beforeDocumentControls ?? [
            BACK_TO_PARENT,
          ],
        },
      },
    },
    fields: collection.fields.map(withKiteField),
  };
}

// Globals have no list view, but they do have an edit view — so they take the
// same Back control, from the same owner, on the same explicit-override-wins
// rule. (A global's edit slots live under `admin.components.elements`, not
// `.edit` as on a collection.)
export function withKiteAdminGlobal(global: GlobalConfig): GlobalConfig {
  const existingElements = global.admin?.components?.elements;

  return {
    ...global,
    admin: {
      ...global.admin,
      components: {
        ...global.admin?.components,
        elements: {
          ...existingElements,
          beforeDocumentControls: existingElements?.beforeDocumentControls ?? [
            BACK_TO_PARENT,
          ],
        },
      },
    },
    fields: global.fields.map(withKiteField),
  };
}
