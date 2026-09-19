import type { TextField } from 'payload';

// Design-system field renderers (src/admin/KiteField.tsx). Spread into a
// field's `admin.components` so the control is kite-ui's Input / Textarea /
// Switch instead of Payload's own — see the rationale at the top of
// KiteField.tsx. Declared once here so every collection and global references
// the same component paths; a typo'd path resolves to nothing at runtime
// rather than failing the build.
export const KITE_FIELD_COMPONENTS = {
  switch: { Field: '/admin/KiteField#KiteSwitchField' },
  text: { Field: '/admin/KiteField#KiteTextField' },
  textarea: { Field: '/admin/KiteField#KiteTextareaField' },
} as const;

// A text field holding a Cloudinary image URL, with the admin ImagePreview
// thumbnail wired in via `afterInput`. Use this for every image/logo/avatar/
// og-image field so editors see the actual image in the admin. The component
// path resolves through the config importMap (baseDir = src).
export function imageUrlField(
  name: string,
  opts: { label?: string; required?: boolean; width?: string } = {},
): TextField {
  return {
    name,
    type: 'text',
    label: opts.label,
    required: opts.required,
    admin: {
      width: opts.width,
      // Single source of truth for "this text field holds an image URL".
      // Readers (e.g. the admin section-autofill serializer) consult this
      // marker instead of sniffing the afterInput component reference.
      custom: { isImage: true },
      components: {
        ...KITE_FIELD_COMPONENTS.text,
        // KiteTextField renders `customComponents.AfterInput` explicitly, so
        // the thumbnail survives the Field override. A custom Field that
        // forgot to would drop this slot silently.
        afterInput: ['/admin/ImagePreview#ImagePreview'],
      },
    },
  };
}
