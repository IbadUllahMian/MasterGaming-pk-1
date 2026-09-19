---
name: linkedin-website-import
description: Use this skill when a person or company LinkedIn profile should inform a new website, a design refinement, or an existing-site update—for example, “build an About page from this profile.” Compose grounded research, copy, design, and implementation as the outcome needs. For evidence only, delegate Research without starting website work.
mode: sandbox
---

# LinkedIn website import

A LinkedIn profile is evidence for a website, not a website specification.

## Purpose

CMO owns a grounded website outcome while each specialist retains its normal
function. This skill defines the evidence dependencies and quality boundary;
`work-delegation` owns task mechanics and the planner chooses the smallest
reliable graph.

## Inputs

Resolve the exact LinkedIn subject, requested website outcome, target audience,
content scope, and target website state. For an unmatched or brand-new website,
load `website-setup`; its `website-discovery` brief remains the build contract.
LinkedIn evidence enriches that brief rather than replacing purpose, audience,
conversion, brand, or constraints.

## Output

Deliver the website artifact the user requested: initial design options, a
scoped refinement, or a reviewable existing-site draft. The final result names
the LinkedIn source, supported claims and assets used, unresolved evidence
gaps, and the review surface. Publishing remains a separate user decision.

## Operating rules

**Make evidence available before deriving from it.** Commission Research to
produce the `linkedin-profile-research` artifact before any contribution relies
on profile facts, posts, expertise, or media. Preserve the artifact's subject,
citations, limitations, and durability statuses across task boundaries. This is
a data dependency, not a required parent/child topology.

**Commission only useful specialist work.** Use Content when publishable copy
is part of the outcome, Design when visual direction or media treatment needs a
decision, and Web Developer when website state changes. A contributor may be a
sibling or descendant task; require its usable result rather than a fixed task
count or sequence.

**Keep ownership intact.** Research gathers evidence, Content authors copy,
Design decides visual treatment, and Web Developer changes the site. Do not ask
downstream agents to rediscover LinkedIn or let one role silently fill another
role's evidence gap.

**Discover assets at the website boundary.** Research writes durable media and
semantic roles into its task artifact folder. Before generating or replacing a
brand image, the Web Developer resolves the selected target, inspects
`kite-websites assets <website_id>`, and inspects the team's task artifacts and
their `artifact-meta.json` sidecars. Prefer a subject-and-role match with a
complete `hosted_url`; keep placement intent in the task brief and website
code. Do not create or emulate a per-task asset manifest.

**Treat durable media as an enhancement, not an intake gate.** Keep source-only
or unmatched media visible as a limitation. A fresh site can still proceed from
grounded textual evidence; once a Web Developer has selected or created its
target, the same discovery behavior decides which hosted artifact is usable.

**Respect the website lifecycle owner.** Initial options and pre-selection
refinements follow `website-design-creation`; selected-site changes follow the
normal draft, code, and verification skills. This workflow adds LinkedIn
evidence but does not redefine those mechanics.

## Verification

Before returning, check that every website claim traces to the Research
artifact, copy and visual choices preserve the stated limitations, durable
assets retain their semantic roles, and the requested website state is visible
on the appropriate review surface. Confirm that no source-only URL is reported
as a hosted artifact and nothing was published implicitly.

## Failure handling

If identity or evidence is insufficient, ask for the missing discriminator or
deliver a narrower supported outcome. If a specialist contribution fails,
account for that gap and decide whether the remaining evidence can still
produce an honest partial result; otherwise stop before website mutation.
