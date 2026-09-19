import { redirect } from 'next/navigation';

// Payload's account screen, replaced by a bounce back to the dashboard.
//
// The screen edits the admin user itself: its email, a "Force Unlock" control
// and Payload's own language/reset-preferences panel. None of that is the
// editor's to manage here — this admin authenticates through a platform-minted
// token against a machine-provisioned user (`admin@kite.local`, created by the
// seed), so the account has no password to change and no identity the editor
// would recognise as theirs. Changing its email would break nothing visibly and
// help no one; resetting preferences would silently undo the live-preview
// default this template seeds.
//
// A redirect rather than a hidden link: the link is already gone with the app
// header, and a route that still renders is one a stray URL or a Payload
// internal redirect can land on.
export function AccountRedirect() {
  redirect('/admin');
}
