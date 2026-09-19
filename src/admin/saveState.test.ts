// Contract for the SaveControls state derivation (KITE-7581). The pin that
// matters: on a CREATE form, a successful submit must read "Saved" and disable
// Save from the control's own state. Payload never refreshes a create form's
// field state (it redirects to the edit view instead), so `dirty` stays true
// and `id` stays unset until that redirect lands — deriving from those alone
// hid the badge and re-enabled Save right after the editor clicked it.
//
// The template ships no unit-test runner, so this is a self-contained tsx
// script (run in CI by nextjs-template-code-quality.yml). Exits non-zero on
// any failure.
//
// Run locally: pnpm exec tsx src/admin/saveState.test.ts

import { deriveSaveControls, type SaveSignals } from './saveState';

let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}${detail ? `\n        ${detail}` : ''}`);
  }
}

function expectView(
  name: string,
  signals: SaveSignals,
  expected: ReturnType<typeof deriveSaveControls>,
): void {
  const actual = deriveSaveControls(signals);
  check(
    name,
    actual.state === expected.state &&
      actual.saveDisabled === expected.saveDisabled &&
      actual.showBadge === expected.showBadge,
    `expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`,
  );
}

const CREATE: SaveSignals = {
  processing: false,
  saveFailed: false,
  dirty: false,
  modified: false,
  justSaved: false,
  fillPending: false,
  isUpdate: false,
  hasDocument: false,
};
const UPDATE: SaveSignals = { ...CREATE, isUpdate: true, hasDocument: true };

function main(): void {
  console.log('SaveControls derivation contract');

  console.log('create form');
  expectView(
    'pristine: no badge, Save enabled (nothing to report yet)',
    CREATE,
    {
      state: 'saved',
      saveDisabled: false,
      showBadge: false,
    },
  );
  expectView(
    'edited: Unsaved changes, Save enabled',
    { ...CREATE, dirty: true, modified: true },
    { state: 'unsaved', saveDisabled: false, showBadge: true },
  );
  expectView(
    'submitting: Saving, Save disabled',
    { ...CREATE, dirty: true, modified: true, processing: true },
    { state: 'saving', saveDisabled: true, showBadge: true },
  );
  // Payload resets its `modified` latch the moment the response lands, one
  // frame before it clears `processing`; the badge must not blink out there.
  expectView(
    'response landed, still processing: Saving stays on screen',
    { ...CREATE, dirty: true, modified: false, processing: true },
    { state: 'saving', saveDisabled: true, showBadge: true },
  );
  // The KITE-7581 window: the POST succeeded (Payload reset `modified`), but the
  // redirect to the edit view has not landed — `dirty` is stale-true, no `id`.
  expectView(
    'created, redirect pending: Saved, Save disabled, badge shown',
    { ...CREATE, dirty: true, modified: false, justSaved: true },
    { state: 'saved', saveDisabled: true, showBadge: true },
  );
  // Another submit from the create form can only POST a duplicate (the slug is
  // unique) and would lose this edit when the redirect rehydrates the form.
  expectView(
    'created, then edited before the redirect: Unsaved changes, but Save waits',
    { ...CREATE, dirty: true, modified: true, justSaved: true },
    { state: 'unsaved', saveDisabled: true, showBadge: true },
  );
  expectView(
    'redirect landed, then edited: Unsaved changes, Save enabled',
    { ...UPDATE, dirty: true, modified: true, justSaved: true },
    { state: 'unsaved', saveDisabled: false, showBadge: true },
  );
  expectView(
    'redirect landed (now an update, state refreshed): Saved, Save disabled',
    { ...UPDATE, justSaved: true },
    { state: 'saved', saveDisabled: true, showBadge: true },
  );

  console.log('update form');
  expectView('opened, untouched: Saved, Save disabled', UPDATE, {
    state: 'saved',
    saveDisabled: true,
    showBadge: true,
  });
  expectView(
    'edited: Unsaved changes, Save enabled',
    { ...UPDATE, dirty: true, modified: true },
    { state: 'unsaved', saveDisabled: false, showBadge: true },
  );
  // V2-5802: every edit reverted by hand — Payload's latch stays true, the
  // real diff is clean.
  expectView(
    'edited then reverted by hand: Saved, Save disabled',
    { ...UPDATE, dirty: false, modified: true },
    { state: 'saved', saveDisabled: true, showBadge: true },
  );
  expectView(
    'saved (Payload refreshed state): Saved, Save disabled',
    { ...UPDATE, justSaved: true },
    { state: 'saved', saveDisabled: true, showBadge: true },
  );
  expectView(
    'save rejected by the server: still Unsaved changes, Save enabled',
    { ...UPDATE, dirty: true, modified: false, justSaved: false },
    { state: 'unsaved', saveDisabled: false, showBadge: true },
  );
  expectView(
    'save threw: Could not save, Save enabled for retry',
    { ...UPDATE, dirty: true, saveFailed: true },
    { state: 'error', saveDisabled: false, showBadge: true },
  );

  console.log('precedence');
  expectView(
    'processing wins over everything',
    {
      ...UPDATE,
      dirty: true,
      saveFailed: true,
      justSaved: true,
      processing: true,
    },
    { state: 'saving', saveDisabled: true, showBadge: true },
  );
  expectView(
    'a pending section fill disables Save without changing the badge',
    { ...UPDATE, dirty: true, modified: true, fillPending: true },
    { state: 'unsaved', saveDisabled: true, showBadge: true },
  );
  expectView(
    'a pending section fill disables Save on a create form too',
    { ...CREATE, dirty: true, modified: true, fillPending: true },
    { state: 'unsaved', saveDisabled: true, showBadge: true },
  );

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('\nall checks passed');
}

main();
