---
name: website-reference-visual-spec
description: Use this skill when a public website should inform another site's visual direction, such as “make our pricing feel like this page” or “use this site as a design reference.” Produce portable whole-site or section guidance from rendered evidence. Leave website implementation to Web Developer.
mode: sandbox
---

# Website reference visual spec

A reference is evidence for design decisions, not a template to copy.

## Purpose

Design owns a portable visual contract that another agent can apply without
reopening the reference. Capture the reference's composition and visual
language while preserving the target site's identity, content, and product
requirements.

## Inputs

Resolve the reference URL, target brand, requested scope, and intended visible
outcome. Use the smallest scope that satisfies the request: one named section
when the user names one, otherwise the whole-site system.

A request to remove an existing reference rule needs no new visual research.
Return the exact stored section name and supplied source so the website owner
can remove the right rule.

## Output

Write `$TASK_ARTIFACTS_DIR/reference-visual-spec.md` and name it in the task
result.

For a whole-site artifact, use this machine-readable shape:

```markdown
# Visual Design Spec
Source: <reference URL>
Scope: whole-site
Observed: <UTC timestamp>

## Global Visual System
## Global Layout and Rhythm
## Global Typography System
## Global Color, Surface, and Effects
## Global Motion Language
## Global Imagery and Iconography
## Persistent Interface Layers
## Section Inventory
## Evidence and Inferences
```

For one section, emit exactly one block:

```markdown
## Section: <PascalCaseName>
Source: <reference URL>
Observed: <UTC timestamp>

### Composition
### Responsive behavior
### Typography and color
### Surface, media, and motion
### Implementation constraints
### Evidence and inferences
```

## Operating rules

**Inspect the rendered behavior.** Load `browser-session` and observe enough
desktop and mobile states to explain the requested design decisions. Whole-site
work should capture repeated rules and materially distinct page patterns;
section work should capture its surrounding context and responsive changes.
Depth follows the decision being supported, not a fixed page quota.

**Separate evidence from judgment.** Record source URLs and label visual
estimates as implementation targets or inferences. Describe layout hierarchy,
rhythm, type roles, colors, surfaces, media treatment, motion, and responsive
transitions concretely enough to implement.

**Keep identity with the target.** Borrow composition and interaction language,
not the reference's logo, trademarks, proprietary copy, or identifying imagery.
Explicit target-brand facts and accessibility needs outrank the reference.

**Keep the artifact implementation-neutral.** Specify observable design
behavior rather than framework code so it remains useful across generation,
remix, and existing-site work.

## Verification

Run one evidence pass before returning. Confirm that the source and scope are
unambiguous, every visual claim is observed or labeled as inference, the target
identity remains intact, and the artifact matches the grammar above. A section
artifact is complete only when it contains one matching section block.

## Failure handling

If the reference cannot be inspected, report the inaccessible states and avoid
filling them from memory. If the requested section cannot be identified
uniquely, return the observed candidates and the distinction needed to choose.
Do not present a partial observation as a complete portable spec.
