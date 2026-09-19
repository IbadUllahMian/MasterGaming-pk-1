// Side-effect import of the admin's entire stylesheet. `admin-ds.css` brings in
// the Kite design system (@appsmithorg/kite-ui — the same package the platform
// frontend uses) and then imports the three admin sheets that build on it:
// the hidden-nav grid fix, the Payload theming map, and the view skin. It rides
// this always-mounted component, so no extra importMap/config wiring is needed.
import './admin-ds.css';

// Removes the Payload admin navigation sidebar (the Collections/Globals list).
// The platform Content tab embeds this admin in an iframe scoped to content
// editing, so the in-admin nav is redundant chrome. Replacing the `Nav` with a
// no-op render hides the whole sidebar (and its collapse toggle). Wired via
// `admin.components.Nav` in `payload.config.ts`.
export const HiddenNav = () => null;
