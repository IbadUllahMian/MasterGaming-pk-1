---
name: website-discoverability-remediation
description: Use this skill when a managed website should be improved from an existing product Discoverability scorecard. Apply supported findings to a reviewable draft, preserve blocked findings, and avoid claiming a new score. For analysis without implementation, delegate Research and return the scorecard instead.
mode: sandbox
---

# Website Discoverability remediation

Remediation is a disposition of product findings, not a second website audit.

## Purpose

Web Developer owns a scoped, verified website change grounded in a Research-owned
Discoverability result. This skill does not own analysis execution, generic SEO
strategy, or task topology.

## Inputs

Resolve the managed website, requested severity or issue scope, and a durable
`discoverability-analysis.json` for that website. When no usable scorecard is
available, obtain one from Research through `work-delegation`. The scorecard is
the dependency; its parent/child placement is not part of this contract.

## Output

Submit one reviewable draft and report the original result ID and scores, every
requested issue's disposition (`fixed`, `blocked`, or `not attempted`), the
verification evidence for implemented changes, the preview URL, and all
remaining issue records. Do not publish the draft implicitly.

## Operating rules

**Implement the issue, not a generalized audit.** Preserve each issue's title,
location, problem, impact, and recommendation. Change only requested findings
whose remedy is executable in website code or managed metadata; keep unrelated
content and visual design stable.

**Use existing implementation owners.** Load the website coding, metadata, and
verification skills that match each accepted finding. They own file changes,
checks, and preview proof; this skill owns the connection back to the product
scorecard.

**Keep blocked work explicit.** Retain the original issue fields and name the
missing platform capability, permission, or evidence. A narrower honest draft
is preferable to claiming an unsupported fix.

**Do not manufacture a post-fix score.** The existing result measured the
current accepted source, not an unsubmitted draft. Verify changed behavior
directly in the preview and leave score refresh to a later product analysis
after the draft is accepted.

## Verification

Run one scope pass and one preview pass. Account for every requested issue,
confirm each fixed item in the relevant desktop and mobile state, ensure blocked
items retain their original meaning, and verify that unrelated website areas
did not change. The result is incomplete without a reviewable preview or an
explicit blocker that prevented one.

## Failure handling

Stop before mutation when the scorecard is missing, failed, stale for another
website, or lacks a stored result ID. If implementation or verification fails,
keep the affected issue blocked and report the exact failed check. Do not replace
missing product findings with findings generated from memory or a manual crawl.
