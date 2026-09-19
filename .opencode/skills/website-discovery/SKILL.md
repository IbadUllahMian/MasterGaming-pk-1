---
name: website-discovery
description: >
  Use this skill when the user wants a brand-new website to define its
  purpose, audience, content, conversion, brand direction, assets, or
  constraints into a confirmed build brief. Skip it for changes to a listed
  site, read-only audits, and site or repository imports;
  those stay with their existing-site, audit, or import workflows.
mode: sandbox
---

# Website discovery

Website discovery turns a rough new-site request into one confirmed build
brief that design and build agents can use without the conversation history.

## Inputs

Use the current conversation and confirmed business or brand context from the
wiki. Treat information already supplied as answered. When prior sources
disagree, use the user's latest direction and ask only when the conflict changes
the site materially.

## Output: the brief

Produce one Markdown brief with two sections:

- **Build requirements:** standalone facts, directions, and constraints that
  describe what the site must communicate and how it should feel.
- **Goal:** the single primary conversion when the user states or chooses one.
  Include its **goal type** and **goal text** in the user's own words. Choose
  the goal type from `signup`, `purchase`, `lead`, `inquiry`, `booking`,
  `subscribe`, `contact`, `download`, `quote`, `donate`, or `other`. Leave
  the goal unset when the user asks to proceed without choosing a primary
  conversion; the generation pipeline will infer it.

Use this Markdown structure:

```markdown
## Build requirements

- <Standalone requirement>
- <Standalone requirement>

## Goal

- Goal type: <supported type>
- Goal text: <user wording>
```

Omit the Goal section when it is deliberately unset.

Resolve these dimensions through an explicit user choice, a confirmed fact
from context, a deliberate "none", or a choice the user hands back to Kite.

- Site purpose and desired business outcome.
- Primary audience and the problem or motivation that brings them to the site.
- Offer, differentiator, and essential products, services, or ideas.
- Primary conversion and the path visitors should take toward it.
- Essential pages, sections, content, and functionality.
- Proof that should build trust, such as customers, results, credentials, or
  testimonials.
- Brand personality, tone, and visual direction.
- Logo, images, reference sites, and other available assets.
- Constraints, must-haves, dislikes, and anything that must remain unchanged.

## Operating rules

**Close gaps that change the build.** Identify the dimensions whose answers
could change the site's message, structure, conversion, or visual direction.
Ask one focused conversational question at a time, or group two or three
questions the user can answer together without follow-up clarification. Do not
repeat an answered question.

**Ask for direction before copy.** For strategic or creative choices, offer two
or three plausible directions grounded in known context and let the user pick,
combine, edit, or hand the choice back. Ask for exact wording only when the site
needs factual copy such as names, prices, testimonials, contact details, legal
text, or a phrase the user wants preserved.

**Keep the brief lossless.** Preserve URLs, names, prices, contact details,
hours, addresses, testimonials with attribution, product or service details,
social handles, asset references, and user-authored copy exactly. Record
creative phrasing and examples as direction unless the user says to use the
exact words. Keep workflow commands such as "make three options", "stop asking
questions", or "start now" out of `build_requirements`; they control the
process, not the site.

**Keep one current understanding.** Merge new information into the brief and
remove or replace superseded requirements. Keep one primary conversion. Choose
it in this order: the conversion the user explicitly marks primary; the one
they emphasize or repeat most; then the first one stated.

**Honor proceed-now intent.** Treat a direct request to start with design
options as proceed-now intent. When the user says to start, go ahead, or
otherwise signals impatience, stop asking questions. Record reasonable defaults
that align with the confirmed dimensions for unresolved design choices in
`build_requirements`, leave unstated factual claims out, and leave an unstated
`goal` unset. Return the brief immediately so design can begin in the same turn;
do not turn the user's request for momentum into another confirmation loop.

## Verification

Before starting design work, check the brief once:

1. The dimensions above are resolved or covered by the user's explicit
   proceed-now direction.
2. Exact facts, copy, and URLs remain unchanged.
3. The brief contains no platform workflow commands.
4. The primary conversion is singular, or `goal` is deliberately unset because
   the user chose to proceed without stating one.

Validate the final brief against the Markdown structure, resolved
dimensions, and four checks above. Discovery is complete only when they all
pass. More self-review adds delay without improving the brief.

## Failure handling

If two stated facts or strategic directions conflict in a way that changes the
site's message, structure, conversion, or visual direction, ask one question
that names the conflict and what the answer changes. If required factual
content is unavailable, mark it absent rather than inventing it. If the request
resolves to an import, listed-site change, or read-only task, stop this skill
and hand control to the owning route named in the description.
