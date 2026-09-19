'use client';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@appsmithorg/kite-ui/components/field';
import { Input } from '@appsmithorg/kite-ui/components/input';
import { Switch } from '@appsmithorg/kite-ui/components/switch';
import { Textarea } from '@appsmithorg/kite-ui/components/textarea';
import { useField } from '@payloadcms/ui';
import type {
  CheckboxFieldClientComponent,
  TextareaFieldClientComponent,
  TextFieldClientComponent,
} from 'payload';
import React from 'react';
import { descriptionText, labelText } from './payloadLabel';

// Design-system replacements for Payload's own text / textarea / checkbox field
// UIs. They are wired via `admin.components.Field` by `withKiteAdmin`
// (src/payload/kiteAdmin.ts), which walks the whole config once — so these
// render wherever such a field lives, including inside layout blocks and
// generator-authored collections.
//
// Why replace rather than skin: everything else in `admin-skin.css` repaints
// Payload markup that has no design-system counterpart (the list table, the
// doc-controls strip). These three do have counterparts — kite-ui's Input,
// Textarea and Switch — so skinning them means maintaining an imitation that
// drifts the moment the real component changes. The noindex control was the
// clearest case: it was a Payload *checkbox* CSS-morphed into a pill switch,
// with the DS switch's "36x20 track, 16px thumb, 16px travel" geometry copied
// by hand. Now it is the switch.
//
// Payload's form runtime stays: `useField` owns the value, validation state and
// dirty tracking, exactly as it does for the stock fields. Only the markup is
// ours.

// Payload applies `admin.width` by setting a `--field-width` custom property on
// the FIELD COMPONENT'S OWN ROOT (see `mergeFieldStyles` in @payloadcms/ui) —
// not on a wrapper around it. The row layout then reads it back via
// `.field-type.row .row__fields > * { flex: 0 1 var(--field-width) }`. So a
// custom Field that doesn't reproduce this silently loses the two-column
// layout — which is what lays Title and Slug side by side. `mergeFieldStyles`
// is not exported from the client bundle, so it is replicated here, including
// the `flex: 1 1 auto` fallback: `flex: 0 1 var(--field-width)` is invalid when
// the property is unset, so the declaration would be dropped entirely.
function useFieldWidthStyle(admin?: {
  style?: React.CSSProperties;
  // Payload types this as CSS `Width<string | number>`, so a bare number is
  // legal here even though every call site in this template passes '50%'.
  width?: React.CSSProperties['width'];
}): React.CSSProperties {
  return React.useMemo(
    () => ({
      ...(admin?.style ?? {}),
      ...(admin?.width
        ? ({ '--field-width': String(admin.width) } as React.CSSProperties)
        : { flex: '1 1 auto' }),
      ...(admin?.style?.flex ? { flex: admin.style.flex } : {}),
    }),
    [admin?.style, admin?.width],
  );
}

// Payload's own id convention (`field-` + path with dots doubled to
// underscores). Kept identical so `<label for>` still targets the control and
// anything addressing a field by id — Payload's error-summary links, e2e
// selectors — keeps working.
function fieldId(path: string): string {
  return `field-${path.replace(/\./g, '__')}`;
}

type ShellProps = {
  children: React.ReactNode;
  /** Rendered inline with the control (switch) rather than above it. */
  inline?: boolean;
  id: string;
  label: string | null;
  required?: boolean;
  description?: React.ReactNode;
  errorMessage?: string;
  showError?: boolean;
  style: React.CSSProperties;
  beforeInput?: React.ReactNode;
  afterInput?: React.ReactNode;
};

// Shared chrome for all three fields. Carries `field-type` so Payload's own
// `.render-fields > .field-type` vertical rhythm still applies — the spacing
// between fields is Payload's concern, not the design system's, and matching it
// keeps a converted field indistinguishable in layout from an unconverted one.
//
// `beforeInput`/`afterInput` are rendered explicitly: Payload injects those
// slots into the stock field component, so a custom Field that ignores them
// silently drops whatever they hold. In this template that is the image
// thumbnail on URL fields (`imageUrlField` in src/payload/fields.ts).
function FieldShell({
  children,
  inline,
  id,
  label,
  required,
  description,
  errorMessage,
  showError,
  style,
  beforeInput,
  afterInput,
}: ShellProps) {
  // kite-ui's Label sets no colour of its own — it inherits. In the platform
  // frontend that inherits the app's near-black body text; inside Payload's
  // admin document it inherited Payload's grey, so labels read washed-out
  // against the same component in the product. Pin it to the DS token the
  // platform effectively resolves to (fg-emphasis = gray-900).
  const labelNode = label ? (
    <FieldLabel className="text-fg-normal" htmlFor={id}>
      {/* Label and required marker are wrapped together on purpose: FieldLabel
          is `flex items-center gap-2`, so leaving the asterisk as a sibling put
          a full 8px gap between it and the text. Inside one span the gap no
          longer applies, and the marker sits at Payload's own 4-5px offset. */}
      <span>
        {label}
        {required ? (
          <span aria-hidden className="text-fg-negative ml-1">
            *
          </span>
        ) : null}
      </span>
    </FieldLabel>
  ) : null;

  // One subtitle style across the admin: `text-fg-subtle text-sm`, matching the
  // page subtitle on the dashboard and the list view. FieldDescription is
  // already `text-sm`; the colour is pinned here because its own
  // `text-muted-foreground` resolves via the compat mapping in admin-ds.css,
  // which is tuned for input placeholders rather than help text.
  const descriptionNode = description ? (
    <FieldDescription className="text-fg-subtle">
      {description}
    </FieldDescription>
  ) : null;

  const errorNode = showError ? (
    <FieldError errors={[{ message: errorMessage }]} />
  ) : null;

  // Horizontal (switch): label + description on the LEFT, control pushed to the
  // right edge — the platform's ordering in both places it does this
  // (SettingsPage.tsx's `justify-between` badge toggle, and McpServerFormModal's
  // `Field orientation="horizontal"` with the text block before the Switch).
  // FieldContent is `flex-1`, so it takes the remaining width and the control
  // lands hard right without needing `justify-between`.
  //
  // Vertical: label above, description and error below the control.
  if (inline) {
    return (
      <div className="field-type" style={style}>
        <Field data-invalid={showError || undefined} orientation="horizontal">
          <FieldContent>
            {labelNode}
            {descriptionNode}
            {errorNode}
          </FieldContent>
          {/* Same slots as the vertical branch — an inline field that accepted
              `beforeInput`/`afterInput` and rendered neither would drop them
              exactly as the stock-component note above warns. */}
          {beforeInput}
          {children}
          {afterInput}
        </Field>
      </div>
    );
  }

  return (
    <div className="field-type" style={style}>
      <Field data-invalid={showError || undefined}>
        {labelNode}
        {beforeInput}
        {children}
        {afterInput}
        {descriptionNode}
        {errorNode}
      </Field>
    </div>
  );
}

// The three field components differ only in their control. Everything around it
// — Payload's form binding, the id, the width style, and the ten props
// FieldShell takes — is identical, so it is derived once here. Anything a
// control needs that is specific to its field type (`placeholder`, `rows`) is
// read at the call site, where the field is still narrowed to its own type.
function useKiteField<T>(
  field:
    | {
        admin?: {
          description?: unknown;
          style?: React.CSSProperties;
          width?: React.CSSProperties['width'];
        };
        label?: unknown;
        required?: boolean;
      }
    | undefined,
  path: string,
) {
  const {
    customComponents,
    disabled,
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<T>({ path });
  const id = fieldId(path);
  const style = useFieldWidthStyle(field?.admin);

  return {
    setValue,
    value,
    control: {
      'aria-invalid': showError || undefined,
      disabled,
      id,
      name: path,
    },
    shell: {
      afterInput: customComponents?.AfterInput,
      beforeInput: customComponents?.BeforeInput,
      description:
        customComponents?.Description ??
        descriptionText(field?.admin?.description),
      errorMessage,
      id,
      label: labelText(field?.label),
      required: field?.required,
      showError,
      style,
    },
  };
}

export const KiteTextField: TextFieldClientComponent = ({ field, path }) => {
  const { control, setValue, shell, value } = useKiteField<string>(field, path);

  return (
    <FieldShell {...shell}>
      <Input
        {...control}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          typeof field?.admin?.placeholder === 'string'
            ? field.admin.placeholder
            : undefined
        }
        value={value ?? ''}
      />
    </FieldShell>
  );
};

export const KiteTextareaField: TextareaFieldClientComponent = ({
  field,
  path,
}) => {
  const { control, setValue, shell, value } = useKiteField<string>(field, path);

  return (
    <FieldShell {...shell}>
      <Textarea
        {...control}
        onChange={(e) => setValue(e.target.value)}
        rows={field?.admin?.rows}
        value={value ?? ''}
      />
    </FieldShell>
  );
};

// `variant="neutral"` — the same variant the platform uses for its own toggles
// (SettingsPage.tsx, the workflow Webhook switch), giving a dark `fg-emphasis`
// track when on rather than a brand fill.
//
// This supersedes PR #14796 §5, which made the brand fill a deliberate product
// exception for noindex. Reverted on a side-by-side comparison with the
// platform: an orange track here read as a different control from the same
// switch everywhere else in the product, and consistency won over emphasis.
export const KiteSwitchField: CheckboxFieldClientComponent = ({
  field,
  path,
}) => {
  const { control, setValue, shell, value } = useKiteField<boolean>(
    field,
    path,
  );

  return (
    <FieldShell {...shell} inline>
      {/* No unchecked override needed: the neutral variant already renders
          `bg-bg-neutral-soft` when off, which is what the brand variant had to
          be patched to (its own off state is a half-opacity orange). */}
      <Switch
        {...control}
        checked={Boolean(value)}
        onCheckedChange={(checked) => setValue(checked)}
        variant="neutral"
      />
    </FieldShell>
  );
};
