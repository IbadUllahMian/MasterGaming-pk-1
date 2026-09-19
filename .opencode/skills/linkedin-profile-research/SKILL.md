---
name: linkedin-profile-research
description: Use this skill when a named person's or company's LinkedIn presence should ground website content, positioning, expertise, or media choices. Return structured public profile and recent-post evidence with source lineage and honest media durability. For generic web research without a named LinkedIn subject, use the relevant research capability instead.
mode: sandbox
---

# LinkedIn profile research

LinkedIn evidence is useful only when identity, provenance, and media durability
survive the handoff.

## Purpose

Research owns a provider-independent evidence artifact for Content, Design, CMO,
and Web Developer. It does not own publishable copy, visual direction, or
website implementation.

## Inputs

Resolve one person or company, its LinkedIn URL, the evidence needed, and any
requested post bound. Ask for a discriminator when several identities remain
plausible; combining records would make every downstream claim unreliable.

A managed target website is optional. Research persists reusable media as task
artifacts; the website worker resolves its own target and decides where each
artifact belongs.

## Output

Write `$TASK_ARTIFACTS_DIR/linkedin-research.json` with this stable domain
shape. Keep provider-specific fields under `raw_fields`.

```json
{
  "schema_version": "1",
  "subject": {
    "kind": "person | company",
    "name": "...",
    "profile_url": "...",
    "retrieved_at": "ISO-8601"
  },
  "profile": {
    "headline": null,
    "about": null,
    "location": null,
    "current_role": null,
    "experience": [],
    "expertise": [],
    "raw_fields": {}
  },
  "recent_posts": [
    {
      "published_at": null,
      "url": null,
      "text": null,
      "topics": [],
      "engagement": {},
      "asset_ids": []
    }
  ],
  "assets": [
    {
      "id": "asset-1",
      "role": "profile_photo | company_logo | employer_logo | institution_logo",
      "label": "...",
      "source_url": "...",
      "artifact_path": null,
      "hosted_url": null,
      "asset_status": "hosted_artifact | source_only",
      "mime_type": null,
      "width": null,
      "height": null,
      "target_page": null,
      "target_element": null
    }
  ],
  "evidence": [],
  "limitations": []
}
```

Register `linkedin-research.json` in `artifact-meta.json` as an `internal`
research deliverable. Register each hosted media file separately as described
below so downstream agents can discover evidence and media without inferring
one from the other.

## Operating rules

**Use structured capability discovery.** Load `tool-discovery-execution` for
catalog selection, inspection, execution, checkpointing, and fallback. Do not
read LinkedIn pages directly or duplicate that skill's provider mechanics.

**Preserve one identity.** Keep profile fields and posts tied to the exact
subject and source. Bound recent posts to the user's request; when no bound is
given, retain at most eight representative posts. Support every synthesized
expertise label with profile text or post evidence.

**Make media durability conditional.** Persist the profile, employer, and
institution media that materially supports the requested outcome when it can be
downloaded and hosted safely. Load `images` and use its upload contract rather
than inventing a storage route. Save each deliverable under
`$TASK_ARTIFACTS_DIR`, record its relative `artifact_path` and complete returned
`hosted_url`, and add an `artifact-meta.json` entry with `class`, `label`, and
the same semantic `role`. Otherwise retain the source URL,
`asset_status: source_only`, and the exact blocker. Research remains useful
when one media slice cannot be made durable.

**Return evidence, not placement instructions.** Research records what it
retrieved and persisted. The website worker discovers durable task artifacts
from the team's artifact tree, matches them by subject and role, and owns page
placement. Do not create a delegation manifest or treat a provider public ID as
a cross-task contract.

**Keep evidence distinct from copy.** Preserve post text as source material and
describe voice or themes as evidence-backed observations. Downstream Content
decides publishable wording.

## Verification

Run one contract pass. Confirm that the subject and URL are exact, claims point
to evidence, every asset has a semantic role and honest durability status,
hosted media has a corresponding task file and metadata entry, and the task
result names the artifact plus the limitations each consumer must preserve.

## Failure handling

Stop on unresolved identity ambiguity. On provider, download, or upload
failure, return the supported evidence and isolate the failed slice in
`limitations`; do not upgrade source-only media into a persisted handoff. If no
usable profile evidence is available, report that boundary instead of producing
website claims from memory.
