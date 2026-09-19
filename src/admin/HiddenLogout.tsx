// Removes the Payload admin "Log out" button. The platform Content tab embeds
// this admin in an iframe and authenticates it with a short-lived, platform-
// minted auto-login token — there is no in-iframe login UI. Logging out here
// would clear that session and strand the editor with no way back in, so the
// logout control is replaced with a no-op render. Wired via
// `admin.components.logout.Button` in `payload.config.ts`.
export const HiddenLogout = () => null;
