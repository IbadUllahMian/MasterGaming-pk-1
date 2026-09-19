'use client';

import { Badge } from '@appsmithorg/kite-ui/components/badge';
import { Button } from '@appsmithorg/kite-ui/components/button';
import { Spinner } from '@appsmithorg/kite-ui/components/spinner';
import {
  useDocumentInfo,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useOperation,
} from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import { deriveSaveControls, type SaveState } from './saveState';
import { SECTION_FILL_PENDING_EVENT } from './SectionAutofill';

// Save control for the embedded admin, mounted in the SaveButton slot (which
// lives in Payload's sticky `.doc-controls` strip). Editors change fields
// freely — nothing persists until they click Save. Renders two pieces, in one
// flex item that CSS `order` floats to the near-left of the controls row: at
// `-1` it sorts after BackToParent (`order-first`) and ahead of every default
// -order control — the live-preview toggle and the preview button — so the
// save state stays in view while scrolling a long page:
//   - a save-state badge (Saved / Unsaved changes / Saving / Couldn't save),
//     using the design system's Badge so it reads like every other status pill
//     in the product.
//   - a Save button, the design system's filled Button. It submits with
//     `disableSuccessStatus` so the badge is the single source of save feedback
//     — no duplicate "Updated successfully" toast. Used for pages (drafts off,
//     so Save writes straight to the live page) and the Site Settings global
//     alike.
//
// Payload's own form hooks stay: they are context, not UI. The state
// derivation itself lives in saveState.ts (pure, contract-tested).

const STATE_LABELS: Record<SaveState, string> = {
  saving: 'Saving',
  error: "Couldn't save",
  unsaved: 'Unsaved changes',
  saved: 'Saved',
};

// Design-system Badge variants per state. `add` is the DS's positive pill — a
// soft green tint, not a shout — which is the settled-success convention, so it
// carries "Saved"; `destructive` is its negative counterpart for "Couldn't
// save". "Unsaved changes" and "Saving" both take the neutral `secondary` fill
// deliberately: the Save button rendered beside this badge is brand-filled, and
// in the `unsaved` state it is enabled (see `saveDisabled`), so it is already
// the thing signalling the action the editor still owes. A brand badge next to it
// would compete with that affordance rather than reinforce it — which is why
// the brand `default` variant is not in this union at all. `saving` carries a
// spinner of its own on top of the neutral fill.
const STATE_VARIANTS: Record<SaveState, 'add' | 'destructive' | 'secondary'> = {
  saving: 'secondary',
  error: 'destructive',
  unsaved: 'secondary',
  saved: 'add',
};

export const SaveControls = () => {
  const { id, globalSlug } = useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  // Payload's `modified` is a set-once latch: the first field edit flips it to
  // true and it only clears on save/reset — it's never recomputed by comparing
  // values, so reverting every edit by hand leaves it stuck true (V2-5802).
  // Derive the real dirty state instead by diffing each field's current value
  // against the value it initialised with (Payload preserves `initialValue`
  // across edits and updates it after a successful save).
  //
  // The comparison must stay DEEP. A reference check alone would report a
  // richText or array field dirty forever once touched, because Lexical rebuilds
  // its value object on every edit — deep-equal to the initial value after a
  // manual revert, but never identical. That is V2-5802's symptom again, moved
  // out of Payload's latch and into this selector.
  //
  // The identity check below is only a fast path, not the comparison: equal
  // references serialise identically by definition, so skipping them cannot
  // change the result. It keeps unchanged fields — nearly all of them, and all
  // the scalars — out of the stringify, which this selector runs across the
  // whole form on every form-state update. `FormState` is a flat path->field
  // map, so blocks and arrays arrive already split into small per-path entries;
  // the value worth not serialising per keystroke is a long richText document.
  const dirty = useFormFields(([fields]) =>
    Object.values(fields).some((field) => {
      if (field?.value === field?.initialValue) return false;
      return (
        JSON.stringify(field?.value) !== JSON.stringify(field?.initialValue)
      );
    }),
  );
  const processing = useFormProcessing();
  const operation = useOperation();
  // Tracks a failed submit so the badge can surface it distinctly — otherwise
  // a failed save is indistinguishable from a not-yet-saved edit (the form
  // stays modified either way). Cleared on the next successful save, or as soon
  // as the editor clicks Save again (not on further field edits — the doc is
  // still the same unsaved batch either way, so the badge deliberately keeps
  // surfacing that the last attempt failed until the editor retries).
  const [saveFailed, setSaveFailed] = useState(false);
  // Tracks that this control's own submit succeeded. Payload refreshes the
  // form state after an UPDATE (so `dirty` clears on its own), but never after
  // a CREATE: the create path relies on redirecting to the new document's edit
  // view, a route transition this control does not own. Until that lands —
  // seconds on a slow sandbox — `dirty` stays stuck true and `id` is still
  // unset, so without this flag the badge vanished and Save re-enabled right
  // after the editor clicked it, inviting a duplicate submit (KITE-7581).
  // Paired with Payload's `modified` latch in the derivation: the next real
  // edit flips `modified` back on and the flag stops mattering.
  const [justSaved, setJustSaved] = useState(false);
  // Set while a newly added block's content is still generating (see
  // SectionAutofill) — saving now would submit that block's still-empty
  // required fields and trip Payload's validation.
  const [fillPending, setFillPending] = useState(false);

  useEffect(() => {
    const onFillPending = (e: Event) => {
      setFillPending((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(SECTION_FILL_PENDING_EVENT, onFillPending);
    return () =>
      window.removeEventListener(SECTION_FILL_PENDING_EVENT, onFillPending);
  }, []);

  const { state, saveDisabled, showBadge } = deriveSaveControls({
    processing,
    saveFailed,
    dirty,
    modified,
    justSaved,
    fillPending,
    isUpdate: operation === 'update',
    hasDocument: Boolean(id || globalSlug),
  });

  const handleSave = () => {
    setSaveFailed(false);
    setJustSaved(false);
    submit({ disableSuccessStatus: true })
      .then((result) => {
        setSaveFailed(false);
        // `submit` resolves for handled server errors too (Payload toasts them
        // and returns), so success is the response status, not the resolution.
        setJustSaved(Boolean(result?.res && result.res.status < 400));
      })
      .catch(() => setSaveFailed(true));
  };

  return (
    <div className="-order-1 flex shrink-0 items-center gap-3">
      {showBadge && (
        <Badge
          variant={STATE_VARIANTS[state]}
          role="status"
          aria-live="polite"
          className="gap-1.5"
        >
          {state === 'saving' && (
            // The badge already carries `role="status"`, so the spinner is
            // decoration here — keep it out of the accessibility tree rather
            // than announcing a second live region inside the first.
            <Spinner aria-hidden role="presentation" className="size-3" />
          )}
          {STATE_LABELS[state]}
        </Badge>
      )}
      {/* No `isPending` on the button: the badge is the single source of save
          feedback, and a button spinner would duplicate the badge's. */}
      <Button
        id="action-save"
        type="button"
        size="sm"
        disabled={saveDisabled}
        onClick={handleSave}
      >
        Save
      </Button>
    </div>
  );
};
