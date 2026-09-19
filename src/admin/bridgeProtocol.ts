// Single source of truth (template side) for the postMessage protocol between the
// embedded Payload admin and the platform content tab. The two halves can't share
// a build — the platform declares the SAME strings in
// frontend/src/pages/AppDetails/pages/ContentPage/cmsBridgeProtocol.ts — so renaming
// either side silently breaks the bridge at runtime (stuck splash / never-resolving
// autofill). Keep the values byte-identical across both files.

// Section-content bridge: the admin asks the parent to generate on-brand content for
// a newly added layout block; the parent replies with the field values.
export const SECTION_CONTENT_REQUEST = 'kite:request-section-content';
export const SECTION_CONTENT_RESPONSE = 'kite:section-content';

// Session-keepalive bridge: the admin asks the parent for a fresh auto-login token to
// slide the session cookie before it expires; the parent replies with the token.
export const CMS_TOKEN_REQUEST = 'kite:request-cms-token';
export const CMS_TOKEN_RESPONSE = 'kite:cms-token';
