// Pure derivation behind SaveControls: what the badge says and whether Save is
// enabled, given the form signals the control can observe. Kept free of React
// and Payload so the contract test can drive every state directly.

export type SaveState = 'saving' | 'error' | 'unsaved' | 'saved';

export type SaveSignals = {
  // Payload's form is mid-submit.
  processing: boolean;
  // The last submit threw (network failure); cleared when the editor retries.
  saveFailed: boolean;
  // Some field's value differs from the value it initialised with — the real
  // dirty check (Payload's `modified` is a set-once latch, see SaveControls).
  dirty: boolean;
  // Payload's `modified` latch: true from the first edit until a save resets it.
  modified: boolean;
  // This control's own submit resolved with a success status since it was last
  // clicked. The only signal that survives a create: Payload never refreshes a
  // create form's field state (so `dirty` stays stuck true) and instead relies on
  // a redirect to the edit view that this control does not own.
  justSaved: boolean;
  // A freshly added block is still generating its content (SectionAutofill);
  // saving now would trip validation on its still-empty required fields.
  fillPending: boolean;
  // Payload's `operation`: an existing document (or a global), not a create form.
  isUpdate: boolean;
  // A document id or global slug exists — false only on a create form.
  hasDocument: boolean;
};

export type SaveControlsView = {
  state: SaveState;
  saveDisabled: boolean;
  // Hidden on a pristine create form: nothing typed and nothing saved yet, so
  // there is no save state to report.
  showBadge: boolean;
};

export function deriveSaveControls(s: SaveSignals): SaveControlsView {
  // The submit this control fired succeeded and nothing has been edited since.
  // Reported from the control's own state rather than inherited from a form
  // refresh, so a create — where the refresh never comes — still reads Saved
  // and disables Save instead of inviting a second, duplicate submit.
  const settled = s.justSaved && !s.modified;

  const state: SaveState = s.processing
    ? 'saving'
    : s.saveFailed
      ? 'error'
      : settled || !s.dirty
        ? 'saved'
        : 'unsaved';

  // A create form that has already created its document but not yet been
  // redirected to it: another submit here can only POST a duplicate (rejected
  // by the unique slug) and would drop the pending edit when the redirect
  // rehydrates the form — so the edit reads Unsaved changes, but Save waits.
  const awaitingRedirect = s.justSaved && !s.hasDocument;

  // An existing document with no real changes has nothing to save (Payload's
  // native SaveButton disables on the `modified` latch here, but that leaves
  // Save enabled after a manual revert — hence `dirty`); a create form stays
  // enabled until its submit succeeds. `processing` is load-bearing: Payload's
  // own FormSubmit used to force a disabled state while a submit was in flight
  // and this button does not, so it is the only thing stopping a fast
  // double-click from firing a second concurrent submit.
  const saveDisabled =
    (s.isUpdate && !s.dirty) ||
    settled ||
    awaitingRedirect ||
    s.processing ||
    s.fillPending;

  // `processing` keeps "Saving" on screen through the submit: Payload resets
  // its `modified` latch as soon as the response lands, a frame before it
  // clears `processing`, and a create form has no `id` to hold the badge up.
  const showBadge = s.hasDocument || s.modified || s.justSaved || s.processing;

  return { state, saveDisabled, showBadge };
}
