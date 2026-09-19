---
name: website-versioning
description: "Use this skill whenever changing a website's code or content in a task clone, so the user can return to each meaningful state; also use it when the user wants to inspect or return to an earlier website state, including undo, revert, roll back, or 'the last change broke it.' A platform-level settings action that creates no draft takes precedence over the change trigger and does not use this skill. Site imports, exports, publishing, merging, and discarding belong to the task-execution protocol's website commands."
mode: sandbox
---

Website versions are forward-only commits: each user-meaningful commit after
`kite-baseline` becomes a Restore row whose label is the commit subject.

## Inputs and output

Work in the clone returned by `kite-websites clone`. Versioning needs its
`website_id`, Git history, and the `draft_id` returned by submit. It produces a
clean, additive commit history and, when useful, a machine-filled version
picker in the task result.

The clone can produce versions only when `git rev-parse kite-baseline^`
succeeds. A missing or root `kite-baseline` means the clone does not share the
site's repository history. The draft can still be submitted, but its commits
cannot become Restore rows; report that limitation and omit a draft-scoped
picker. A go-back request may still offer the live-site picker described below.

## Create useful versions

Use one commit per independently reversible change, not per file or attempt.
For example, a pricing tier and an unrelated headline are separate versions;
one responsive hero change spanning several files is one version.

Write a one-line subject in the user's terms, such as `Add the enterprise
pricing tier`. Subjects label the Restore rows, so implementation labels such
as `wip`, `fix`, or `update components` are unusable.

The clone has no persistent Git identity. Prefix every commit-writing command
with:

```
git -c user.name="Kite Web Developer" -c user.email=web-developer@kite.ai
```

This prefix is `git*` below. Keep submitted history additive: do not reset,
rebase, or amend an earlier version, because rewriting a recorded commit leaves
its Restore row pointing at missing history.

## Resolve an undo or restore

Inspect versions with Git; there is no website versions command:

```
git log --format='%H %cI %s' kite-baseline..HEAD
git log --max-count=20 --format='%H %cI %s' kite-baseline^
```

The first command shows this clone's versions. The second shows earlier site
history. Match relative-time requests by timestamp and named changes by
subject. Start only from a clean working tree so unrelated edits cannot enter
the restoration.

Before either mutation, list every affected path and compare it with the
shared coding prompt's `# Protected files` contract. That contract is the
single permission authority, including protected files inside otherwise
editable directories. Git bypasses the `edit` and `write` enforcement, so if
any path matches, change nothing, name the blocked path, and offer the picker.

- **Undo one change** while preserving everything after it. Inspect
  `git diff --name-only <sha>^ <sha>`, save the current HEAD, then run
  `git* revert --no-edit <sha>` and reword only that fresh revert with
  `git* commit --amend -m "Undo: <subject>"`. A conflict means later work
  depends on the change; abort the revert and offer the picker instead of
  resolving it by guesswork. The undo passes when the new commit's parent is
  the saved HEAD and the working tree is clean.
- **Restore a state** while retaining every version in history. Inspect
  `git diff --name-only <sha> HEAD`, save the current HEAD, restore the complete
  tracked tree from the target with
  `git restore --source=<sha> --staged --worktree -- .` (it also stages the
  removal of files the target lacks), then run
  `git* commit -m "Restored: <subject>"`. The restore passes when the
  new commit's parent is the saved HEAD, `git diff --quiet <sha> HEAD`
  succeeds, and the working tree is clean.

If the request has no unique matching commit, change nothing. State the
ambiguity in one sentence and offer the picker; guessing can remove work the
user meant to keep.

## Offer the picker

The platform, not the model, fills the rows. Emit this exact block once as the
last content in the task result:

```
<kite-checkpoint-list>
{"website_id": "<website_id>", "draft_id": "<draft_id>"}
</kite-checkpoint-list>
```

Offer it after submitting more than one version, when the user asks to see
earlier versions (change nothing; the picker is the answer), or when an
undo/restore stops because the target is ambiguous, protected, or conflicting.
Include `draft_id` only when the picker should list that draft's own versions.
Omit it when the picker should list the site's live versions: no draft exists,
or the clone had no shared history. Do not duplicate those rows in prose.

## Verification

Before submit, require a clean `git status --porcelain` and review
`git log --format='%s' kite-baseline..HEAD`: every independently reversible
change has one user-readable subject. Finish when submit returns a `draft_id`
and the task result ends with the picker exactly when the rules above require
it.
