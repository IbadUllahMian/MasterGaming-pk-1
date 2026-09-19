---
name: website-discoverability
description: >
  Use this skill when the work concerns the product discoverability score of a
  managed team website: produce and report the stored scorecard losslessly,
  and when fixes are wanted, hand the findings over as a lossless remediation
  brief for a separate website-change task. Generic or manual website/SEO
  audits → website-audit; answer-engine visibility → ai-search-visibility;
  implementing the fixes is an ordinary website-change task, not this skill.
mode: sandbox
---

# Website Discoverability

## Shared rules

**One score: the product's.** The product discoverability score is the single
source of truth for a managed team website. The stored result measured the
accepted source, not an unsubmitted draft. A score refresh is always a later
run of the analyze lane after the draft is accepted; verify changed behavior
directly in the preview instead.

**Authority split.** This skill creates a report
of what the analyzed website measured. Fixes are a separate website-change task, 
briefed from the remediation handoff below and grounded
in the report generated. This skill doesn't edit, clone, or submit the
website, and doesn't executes generic SEO strategy or task topology.

**The lossless issue record.** Every issue contains its severity,
category, title, location, problem, impact, and recommendation, plus the
user's selected priorities. The platform's discoverability analysis agent
(`product/discoverability_analysis_agent`) produces this shape and owns the
field list; the analyze lane and its handoff preserve it unchanged so the
website-change task can decide executability without reopening the analysis.

## Lane: analyze

Entry: an effective Research task asks for the score, category breakdown, or
issues of a managed team website. The platform authorizes analysis only for a
Research task; the scoring logic lives behind the product CLI. If the target
is not a managed team website or the task lacks Research authority, report
that boundary before analysis.

Resolve one managed team website and the requested analysis or remediation
scope through `work-delegation`, then run discoverability analysis using `kite-websites` CLI.

Preserve and return the response from `$TASK_ARTIFACTS_DIR/discoverability-analysis.json`.

## Operating rules:

- **Preserve the authoritative result.** Report returned values as one stored
  analysis of one website revision. Keep absent fields absent; don't
  substitute weighted, estimated, browser-derived, or generic-SEO replacement
  scores — a substituted number is a second score (see Shared rules).
- **Lossless remediation handoff.** When fixes are requested, the task
  result carries a remediation brief the delegating agent forwards verbatim
  into one Web Developer website-change task; an analysis-only request ends
  with the scorecard. The brief holds the stored result ID and original
  scores; the full issue records (Shared rules field list) with the user's
  selected priorities and severity scope; and the consumer's rules, stated
  because a coding agent left to itself will re-audit and re-score:
  - Change only the requested findings whose remedy is executable in website
    code or managed metadata; keep unrelated content and design stable.
  - Return one reviewable draft, don't published implicitly, reporting every
    requested issue against its original title as `fixed`, `blocked`, or
    `not attempted`, with verification evidence, the preview URL, and the
    remaining issue records intact. A blocked issue keeps its original
    fields and names the missing capability, permission, or evidence; a
    narrower honest draft beats claiming an unsupported fix.
- **Stay read-only.** Explain and prioritize findings; the website itself is
  Web Developer's. Conversation-backed tasks publish the existing scorecard
  event through the product interface; standalone tasks report that event
  delivery is not applicable.

Verify once: the artifact and the task result must match on result IDs,
website IDs, scores, returned categories, issue records, creation time, and
event status; the result describes the analyzed revision and names any
requested remediation handoff without claiming a website change.

An analysis error is terminal for that invocation — an automatic retry can
duplicate long-running product work. Return the exact blocker; don't invent a
partial score or substitute another audit.
