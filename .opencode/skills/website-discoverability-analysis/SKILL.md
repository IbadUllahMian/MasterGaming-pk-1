---
name: website-discoverability-analysis
description: Use this skill when someone asks for the product Discoverability score, category breakdown, or issues for a managed team website. Return the stored product result and a lossless remediation handoff. For a generic manual website or SEO audit, use the corresponding audit capability instead.
mode: sandbox
---

# Website Discoverability analysis

The product score is the source of truth; a parallel manual score would create
two incompatible answers for the same website.

## Purpose

Research owns a durable, lossless scorecard. It reports what the analyzed
revision measured and leaves website changes to Web Developer.

## Inputs

Resolve one managed team website and the user's requested analysis or
remediation scope through `work-delegation`. The platform authorizes this
analysis only for an effective Research task.

## Output

Run the stable product interface:

```bash
kite-websites analyze-discoverability <website_id>
```

Preserve its response in
`$TASK_ARTIFACTS_DIR/discoverability-analysis.json`. Return the stored result
ID, website ID, overall score, every returned category score, creation time,
highlights, issues, quick wins, technical details, and scorecard-event status.

## Operating rules

**Preserve the authoritative result.** Report returned values as one stored
analysis of one website revision. Keep absent fields absent and avoid weighted,
estimated, browser-derived, or generic SEO replacement scores.

**Keep remediation records lossless.** When fixes are requested, preserve each
issue's severity, category, title, location, problem, impact, and recommendation
plus the user's selected priorities. Web Developer needs those fields to decide
what is executable without reopening the analysis.

**Keep ownership read-only.** Research may explain and prioritize findings but
does not edit, clone, or submit the website. Conversation-backed tasks publish
the existing scorecard event through the product interface; standalone tasks
report that event delivery is not applicable.

## Verification

Compare the artifact and task result once. Their result IDs, website IDs,
scores, returned categories, issue records, creation time, and event status must
match. Confirm that the result describes the analyzed revision and names any
requested remediation handoff without claiming a website change.

## Failure handling

Treat an analysis error as terminal for that invocation because an automatic
retry can duplicate long-running product work. Return the exact blocker without
inventing a partial score or substituting another audit. If the target is not a
managed team website or the task lacks Research authority, report that boundary
before analysis.
