// Coercion for Payload's label/description shapes, shared by every admin
// component that renders one.
//
// Payload types these as a plain string, a localized `Record<string, string>`,
// or (for field labels) `false` to hide the label. Dashboard, KiteListView and
// KiteField each grew their own coercer and drifted to three different answers
// for the record case — one of them `String(label)`, which renders
// "[object Object]" in the UI. They all call this now, so the record case
// resolves the same way everywhere.
//
// This deliberately does not pull in @payloadcms/translations to pick the
// active locale: it is not a direct dependency of the template, and this admin
// ships a single language. `language` is honoured when a caller has it to hand
// (Payload's own nav props carry it) and the first value is used otherwise.

function localizedString(value: unknown, language?: string): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = language ? record[language] : undefined;
    if (typeof preferred === 'string') return preferred;
    const first = Object.values(record).find((v) => typeof v === 'string');
    if (typeof first === 'string') return first;
  }
  return null;
}

/** A label that must render something — headings, column names, nav entries. */
export function labelToString(
  label: unknown,
  fallback: string,
  language?: string,
): string {
  return localizedString(label, language) ?? fallback;
}

/**
 * A field label. `false` hides it; an absent label is filled in by Payload's
 * config sanitisation (it derives one from the field name), so `null` here
 * means "render no label" rather than "label missing".
 */
export function labelText(label: unknown): string | null {
  if (label === false || label == null) return null;
  return localizedString(label);
}

/**
 * `admin.description`, i.e. Payload's `StaticDescription`. The function form is
 * resolved before it reaches the client, so anything still unrenderable here is
 * dropped rather than stringified.
 */
export function descriptionText(description: unknown): string | null {
  return localizedString(description);
}
