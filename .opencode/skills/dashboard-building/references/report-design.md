# Report design and data presentation

Load this file before implementing a findings page, dashboard, or internal
tool. `SKILL.md` owns content, evidence, access, publication, and verification.
This file owns how the interface makes that content legible.

## Goal

A reader who opens the page on a phone between meetings gets the answer from
the first screen, trusts each number without asking where it came from, and can
forward the page without narrating it. Comprehension and familiar controls
outrank visual novelty; the interface recedes behind the evidence.

## Foundation

Link `assets/report-theme.css`; never fork or inline it. It carries the
editorial column, type scale, spacing, status colors, source lines, list rows,
bar rows, and table wrapper, and it is brand-neutral: the team's brand reaches
it through `portal.json` per `SKILL.md`, and page-local token overrides exist
only for an explicitly requested subject brand. Compose from those primitives
and write page-specific CSS only for a shape the kit lacks.

## Decide like an editor

Settle these from the brief and the evidence, not from habit, before laying out
the page:

- Who reads first, on what device, with how much time, and what will they do
  next? That sets what the first screen carries and how much depth follows.
- What one claim must each section prove? A metric, chart, or table earns its
  space only when it makes that claim faster than a sentence; the same evidence
  may be a sentence in one report and a chart in another.
- What comparison gives each number its meaning, and what could mislead: an
  unstated denominator, a truncated axis, a mixed window, a modeled value shown
  as measured, a missing value shown as zero? Show the comparison, and put the
  caveat beside the number.
- Which entries must the reader compare across several fields at once? Those
  belong in a table; other row data reads better as rows and prose on a phone.
- Is this a recurring report? Keep what readers use to orient — the title,
  metric names, status words — and let the lead, order, and emphasis follow
  what changed.
- What would make a reader distrust the page: equal-weight card grids,
  decorative gauges, dual axes, invented precision, color as the only signal,
  content that needs a hover? Leave those out; they add salience the evidence
  does not support.

The evidence sets the composition, so two reports rarely share a layout.

## Non-negotiables

Readable on a phone and at 200% zoom. Bars start at zero and small multiples
share a scale. Body text meets 4.5:1 contrast, every color-coded state also
carries text, every informative image has equivalent text, keyboard focus stays
visible, and interactive controls have tap targets of at least 44 px.

## Verify once

At desktop and phone widths, read only the headings, prominent numbers, chart
labels, and actions: they must give the answer stated in the goal above without
contradiction. Then check long content, empty states, overflow, keyboard order,
contrast, link destinations, and table headers. Fix everything observed in one
pass and confirm once; the published-route verification in `SKILL.md` is the
final gate.
