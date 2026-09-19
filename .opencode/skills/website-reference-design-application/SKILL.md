---
name: website-reference-design-application
description: Use this skill when a website should adopt visual direction from a public reference, whether for initial concepts, a design-option refinement, or a scoped existing-site change. Apply the reference as design evidence while preserving the target brand and unrelated website behavior. Use Design research, not direct imitation, when no portable reference specification exists.
mode: sandbox
---

# Website reference design application

Reference application succeeds when the requested visual idea lands in the
target site without importing the source site's identity or widening scope.

## Purpose

Web Developer owns the website outcome. Design owns the reference evidence.
This skill connects those contracts without owning design generation, code
editing, verification, or task topology.

## Inputs

Resolve the target website, requested operation, visible outcome, and
target-brand constraints first. Removing a stored section override requires
the exact existing PascalCase section name but no new reference artifact; use
the stored section state and skip Design research. Every add, replace, or
visual application requires a Design-owned `reference-visual-spec.md` whose
source and scope match the request. When that evidence is initially absent,
commission Design through `work-delegation` and continue once its result is
usable. Stop only when that attempt fails or returns mismatched or incomplete
evidence. The artifact is the dependency; whether it arrives from a sibling or
descendant task is not part of this contract.

## Output

Deliver the website artifact appropriate to its current state: comparable
design options for an unselected site, or a reviewable verified draft for a
selected site. Report which reference rules were applied, what remained
unchanged, and any evidence that could not be implemented.

## Operating rules

**Route mechanics to their owners.** Load `website-design-creation` for initial
options or pre-selection remix. Load `website-code-writing` and
`website-change-verification` for a selected site's draft. Follow those skills'
generation, editing, and proof contracts instead of reproducing them here.

**Treat the spec as a ranked constraint.** The current user request, target
brand, accessibility, and functional correctness outrank the external
reference. Use the spec to decide composition and visual language; do not copy
source text, brand marks, or identifying media.

**Persist only the requested scope.** A whole-site direction belongs in the
global visual spec. A section direction belongs in one PascalCase section
override. Inspect stored overrides with
`kite-websites get-visual-sections <website_id>`, then use the operation that
matches the requested outcome:

- `kite-websites set-visual-section <website_id> <PascalCaseName> <spec_file> add`
  inserts or updates the named section while preserving other overrides;
- `kite-websites set-visual-section <website_id> <PascalCaseName> <spec_file> replace`
  makes the supplied section the complete override set;
- `kite-websites remove-visual-section <website_id> <PascalCaseName>` removes
  the exact named override after confirming it exists.

Removing a stored override does not remove or restyle rendered code. Change the
rendered section only when the user requested that visible outcome.

**Keep lifecycle choices flexible.** Apply the relevant global or section
contract through the owning generation or editing capability. Change only the
requested design slots, pages, or sections and preserve every unrelated state.

## Verification

Before returning, confirm that the artifact source and scope match the request,
the target brand still wins, the requested scope is observable in generated
screenshots or the draft preview, and unrelated website areas remain unchanged.
One verification pass covers the requested desktop and mobile states.

## Failure handling

After the Design recovery attempt, stop when the reference artifact remains
missing, mismatched, or too incomplete to support the requested decision. Name
the missing evidence or conflicting scope instead of re-inspecting the source
as Web Developer. Report unsupported visual rules individually; a partial
application is valid only when the user can see what landed and what did not.
