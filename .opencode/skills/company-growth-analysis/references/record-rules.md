# Record rules — the shape of every answered record

Loaded with the checklist, before the first question batch. Every answered
record follows all of these; the batch-split rules and the record's field
contract stay in the skill body.

Rules for each answered record:

- One record per question, in checklist order, keyed by `question_id`, with
  the question quoted verbatim. Never skip, merge, or invent a question.
- Ground every finding in the evidence block and put the paths you actually
  read in `evidence_paths`. A claim you cannot tie to evidence in front of you
  does not belong in `finding`.
- `evidence_type`: `direct` — the evidence shows the thing asked about;
  `proxy` — it stands in for it, phrased "consistent with" or "suggests",
  never as fact; `hypothesis` — several signals point one way but none
  establishes it, with what would have to be true in
  `significance_hypothesis`.
- `limit` is required: what this evidence cannot support. An empty limit
  claims the evidence is complete, which it almost never is.
- `applicability: not_applicable` with a reason when the question is
  meaningless for this company (local findability for a company with no
  location-bound business). `not_assessed_reason` when the question fits but
  the evidence cannot answer it. Keep the two apart — "does not fit" versus
  "cannot see".
- `direction` only when the evidence carries a time series or a before/after
  comparison; otherwise `unknown`. Absence of a trend is not `stable`. A
  domain's history can predate the company: when a series runs flat before
  the visible launch and inflects at it, or the archive shows the domain
  previously hosted something else, date growth claims from the launch.
- Confidence sits on the evidence, not on your reasoning: `high` for direct
  evidence with a real sample, `medium` for proxy evidence or thin samples,
  `low` for hypotheses and single data points.
- Vendor-modeled estimates (traffic, headcount, spending) are proxy evidence
  capped at `medium`, phrased as rounded estimates. A registry headcount in
  the low single digits often sees only a brand's shell, not the team:
  report what the registry lists and never state it as the actual team
  size. Traffic estimates are only as good as the company is big — judge
  size from independent evidence, never from the estimate itself. Small: no
  independent signal of scale — stage `pre_motion` or `motion_forming`, a
  registry headcount in the low single digits, no ranked keywords — so the
  traffic series and its channel split are unusable; say so in `limit`.
  Mid-size: one independent signal of scale (a `scaled_motion` stage, ranked
  keywords in the hundreds, or referring domains in the hundreds) and no
  more — direction only. Clearly large: two or more of those signals
  together — the rounded, labeled figure.
- Client-side tool detection sees only script tags with known signatures;
  tools loaded through a tag manager, proxy, or server are invisible. An
  empty detection is inconclusive: cap confidence at `low`, say in `limit`
  that proxied and server-side tools are undetectable, and never phrase it as
  the company lacking those tools.
- A question with no machine path is answered from the slices the batch
  already carries.
