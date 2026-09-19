---
name: website-design-creation
description: Use this skill when generating a website's initial design options, refining or remixing one of the design options before the user has selected one, requesting a fresh round when none feel right, rejecting a single design and re-rolling just that slot, cross-referencing pieces between designs ('use the hero from design 3 in design 1'), or working a delegated task that builds a NEW website or retries/corrects/selects its design options. Triggers on phrases like 'let's go', 'build it', 'start', 'make design 1 blue', 'make all designs warmer', or 'I don't like design 2' — even when 'generate' is not said.
mode: both
agent_policies:
  orchestrator: orchestrator-policy.md
---

# Website design creation

Design generation produces 3 design options for one website. Each option is
built from its own **slot**: the slot's `user_requirements` text is the full
prompt for that one design, and the generation pipeline supplies each fresh
slot's visual style. The user compares the finished options and picks one;
that choice is always the user's, never yours.

When `website-page-design` invokes this skill only to resolve a source spec,
use “Resolve an existing site’s spec” and return that artifact. The generation
workflow below applies to design-option requests.

## Surface mapping

Use whichever generation surface your toolset actually has:

- **`generate_designs` tool in your tool list** — its slot semantics arrive
  with this skill on that surface (see the orchestrator policy section).
- **`kite-websites` CLI** — first run `kite-websites create` once to
  provision the website and note the returned `website_id`. A full round
  writes each design's requirements to its own file and passes them in one
  call: `kite-websites generate-designs <website_id> --brief 1 <file1>
  --brief 2 <file2> --brief 3 <file3>`. Any design you leave out keeps what
  it has, so `--brief 2 <file>` alone rewrites design 2 only. One text for
  every design is the positional form,
  `kite-websites generate-designs <website_id> "<brief>"`, narrowed to one
  slot with `--design N`. Edit in place with `--remix`, cross-reference with
  `--context PROTOTYPE_N`; both apply to every design the call writes. Poll
  `kite-websites create-status <job_id>` until `status` is `success` or
  `failed`, keeping consecutive checks within about 60 seconds of each
  other — the gap between checks, not just sleep time, is what delays
  discovering completion. While the job runs, write no website code and
  never open or edit anything under the website's `iterations/`; the wait
  is idle time, so spend it finishing everything except the final result
  submission, split into units small enough to keep that polling rhythm:
  any before-finishing obligations your task protocol assigns (each on its
  owning skill's terms — this skill only says do them now, not after
  success), and your pre-drafted task-result summary and body files, with
  placeholders for the only values success returns (screenshot URLs and
  any missing design numbers). Run `create` and a full `generate-designs`
  round once each. Selection uses
  `kite-websites select-design <website_id> <1-3>`; edits after selection go
  through `kite-websites clone` + `submit`.

## Confirmed requirements

- When requirements arrive already confirmed — e.g. a delegated task
  description — treat them as the confirmed brief and start generation
  without re-asking.
- When you are conversing with the user and they explicitly ask to start
  building (e.g., "let's go", "go ahead", "sounds good", or "start"), start
  generation immediately — no confirmation needed.
- When you are conversing with the user and you know the site's purpose,
  target audience, key content, and available brand facts but they haven't
  asked to build yet, summarize what you'll build in 2-3 sentences and ask
  for confirmation. Invite a natural yes/no response in the user's own
  words. You may include one short expectations-setting sentence; beyond
  that, **this summary-and-confirm message must contain NOTHING else** — no
  new questions, no follow-ups, no "one more thing". Do not describe the
  build pipeline or what happens behind the scenes. If the user responds
  with new information instead of confirming, address it, update your
  understanding, then summarize and confirm again.

## Brand grounding

Before writing any brief, gather the brand facts available to you: the
company brand knowledge when a knowledge folder is available (e.g.
`/efs/knowledge/company/brand/`), extracted brand guidelines, or what the
user stated in conversation. Briefs must carry the concrete brand values —
palette hex codes, font names, voice — and the exact URLs of approved brand
assets (logo above all), each with an instruction to reuse the asset
unchanged: never generate, redraw, restyle, or recolor a brand mark the team
already has. Brand facts outrank everything else in a brief: when a visual
style or a general requirement conflicts with the brand palette, fonts, or
assets, the brand facts win — unless the user explicitly asked to depart
from the brand.

## Visual style: match an existing site or go fresh

The pipeline picks each fresh slot's visual style in this order: a saved
visual spec on the website (shared by all fresh slots) wins outright;
without one, each fresh slot gets a distinct style from the platform
gallery.

A site has a **committed look** when its `selected_iteration` is set
(visible in `kite-websites list`) or it has a live `deployment_url`; a site
whose design options were generated but never selected has no look to
match. Resolve the preference in this order: (1) what the user stated in
conversation, (2) the preference recorded in the task description, (3) when
neither exists and a site with a committed look exists, follow the match
path below with that site — and say which you applied when you report the
designs.

- **Match an existing site** — resolve its specification through “Resolve an
  existing site's spec” below. With a usable source spec, save it onto the NEW
  website before generating: write the spec text to a file and run
  `kite-websites set-visual-spec <new_website_id> <spec_file>`. The platform
  stores it where every fresh design slot reads it. Save before generation
  starts, and never touch `iterations/`.

- **Fresh design** — save no visual spec; the gallery
  gives each design a distinct style.

## Resolve an existing site's spec

This section returns a source-grounded specification without changing website
state. Page design uses this section independently of initial generation.

Confirm that the source has a committed look as defined above. Without one,
the matching request is blocked: run no `kite-websites create` or
`generate-designs`. Report that the source needs a design selected first, or
that the user can request a fresh direction; stop this matching workflow.
With a committed source:

1. Run `kite-websites get-visual-spec <source_website_id>` — it returns the
   source's own scraped spec, or the spec that built its selected design.
2. When no spec is returned, load `browser-session`, inspect the rendered site,
   and write these sections: Global Visual System; Global Layout and Rhythm;
   Global Typography System; Global Color, Surface, and Effects; Global Motion
   Language; Global Imagery and Iconography; Persistent Interface Layers;
   Section Inventory. Ground the specification in observed behavior and concrete
   values, distinguishing visual estimates from measured values.

Return the readable specification and source identity to the calling workflow.
If no usable spec exists and the source cannot be inspected, report the missing
evidence; a gallery result cannot stand in for the requested source.

## First-time generation

Fill all 3 slots. Each slot's `user_requirements` describes ONE design:
include every requirement whose omission would change the design — business
goal, audience, content sections, CTAs — and preserve exact URLs, copy
text, CTA wording, and named examples without compressing them. Leave out directives aimed at the platform: requests to
create or compare multiple designs/variations/directions, "don't ask
questions", "start building" — filling 3 slots IS the fulfilment of a
3-designs request, and echoing it makes the builder render it as site
content. End each slot's requirements with a style hint phrased as a
directive for that single design ("Use a warm minimalist style with …"),
never as "Direction N:" or "Create N design directions".

## Remixing and refinement (before selection)

- **Change one design** ("make design 1 blue") — that slot only, `remix`
  true, requirements = just the change.
- **Cross-reference** ("use the hero from design 3 in design 1") — slot 1,
  `remix` true, context `PROTOTYPE_3`.
- **Reject one design** ("I don't like design 2", or a design that failed to
  generate) — that slot only, `remix` false, requirements = the original
  brief; it re-rolls fresh with a new style.
- **Change all designs** ("make all designs warmer") — every slot, `remix`
  true, with the change request.
- **None feel right** — run a fresh full round.
- A correction that names a brand or content requirement every option missed
  applies to ALL slots, not just the first one.

## After designs are created

Let the user know their designs are ready and that they can pick a favorite,
remix pieces across designs, ask for a stronger variation of one direction,
or ask for another round if none feel right. Make iteration sound easy,
normal, and collaborative — never scripted. Refer to each design by its
design number. When you reply to the user directly in chat, add no links —
the designs surface automatically. When you report through a task result,
embed each returned screenshot as a Markdown image labelled by its
`design_number` (`![Design <design_number>](<screenshot_url>)`), add the
designs link, and state any design number missing from the results (that
design did not generate and can be re-rolled). On the task surface, when
`create-status` reports success, fill the placeholders in the result you
pre-drafted during the wait, record it (`set-task-result`), and end the
run — start no new work after success; all other bookkeeping belongs in
the generation wait (see the surface mapping). The platform tries to relay
your recorded result to the delegating conversation the moment it is
written, and task finalization guarantees delivery when that early relay
cannot run — your job either way is the same: record the result and end
the run.

## Selection and after

Producing the design options completes a build request — selection is a
separate, later request. Select a design only on an explicit user choice:
the user (or the task text or a follow-up comment relaying them) must name
the design number they picked. Inferring a best design from the
requirements is not a choice. Selection completes that selection request.
After selection, make further edits through your surface's editing path
(see the surface mapping) and only when explicitly asked; run design
generation again only when the user wants to start over with fresh designs.
Before selection, route all design feedback through the slots as above.
