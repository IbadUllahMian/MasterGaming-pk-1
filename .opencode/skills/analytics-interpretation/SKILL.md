---
name: analytics-interpretation
description: >
  Use this skill when the task is to interpret a Kite website's built-in
  analytics — "how is my site doing", "why did signups drop", "which pages
  convert", "build a funnel from homepage to purchase", "are there errors on
  my site", "how many people saw the experiment", "what should I improve" —
  or when a monitoring run needs a grounded traffic/conversion/error update.
  Covers reading traffic, custom events, conversions, runtime errors, the
  event catalog, multi-step funnels, and experiment reach (exposures by
  arm), and turning them into evidence-backed findings and
  recommendations. For designing or judging an A/B experiment use
  `cro-experimentation`; for AI-search visibility use
  `ai-search-visibility`; for building a hosted findings page or dashboard the
  Generalist owns construction — this skill produces the measured findings a
  page is built from.
mode: sandbox
---

# Analytics Interpretation

Turn built-in website analytics into findings a decision can rest on. The
deterministic tools own query mechanics; this skill owns what to read, in what
order, and what a number is allowed to mean.

## Ground before interpreting

1. **Resolve the website explicitly.** A team can own several sites. Confirm
   the website id (`kite-websites list`) against what the task names before
   the first read — never interpret the wrong site's numbers. No unambiguous
   match means escalate (see Escalation and completion), not guess.
2. **Read the event catalog first** (`kite-analytics catalog <website_id>`)
   before interpreting any custom event or building any funnel. It is the
   reference for what every event means, which parameters are approved, which
   event is the site's conversion goal, and whether an event has been observed
   recently. The catalog result carries two statuses: its own `status`
   (`measured` | `not_configured`) and an `observed_status` for the
   recent-observation overlay. If the read fails or `status` itself cannot be
   produced, report the outage and stop — do not interpret events against a
   catalog you could not read. But `observed_status: unavailable` alone is a
   PARTIAL outage: the definitions, approved parameters, and conversion goal
   are intact — keep using them, and only withhold claims about whether an
   event was observed recently (say that half could not be read). Event names
   are per-site: the same outcome is `contact_submitted`
   on one site and `demo_requested` on another. Quote the site's own event
   name to the user; group cross-site comparisons on the closed
   `kite_event_type` class the catalog carries for every event (the
   platform's fixed machine vocabulary, e.g. `goal_completed`,
   `cta_clicked`), never on names.
3. **Plan the reads, then measure.** Name which reads the question needs
   (catalog, traffic, events, errors, funnel, experiment results) before
   running any, and check each off as it completes — no skipped or duplicated
   reads. The commands: `kite-analytics traffic|events|errors <website_id>
   [from to]` and `kite-analytics funnel <website_id> <request.json>` for
   ordered multi-step questions.
4. **Experiment reach and performance come from the experiment readout, on
   the task plane.** "How many saw the experiment / each variant" and per-arm
   conversion are answered by `kite-websites experiment-results <website_id>
   <experiment_id>` (find the id with `kite-websites list-experiments
   <website_id>`). These subcommands exist only in a task sandbox: the
   conversational `kite-websites` is a read-only listing that accepts `list`
   alone, so in chat delegate the question as an analytics task and report
   the returned numbers — running the experiment commands there exits with a
   usage error rather than a measurement. When that delegation cannot happen,
   say the reach figure needs a task-plane read and name what is blocking it;
   never present an events read as the exposure number. Exposure assignment — the telemetry recording which arm each
   visitor saw — is separate from the events read and never appears there — an events read
   without an assignment event is NOT evidence that exposure is unmeasured.
   Judging the experiment (winner, stop-or-continue) stays with
   `cro-experimentation`, and it judges from this measured readout plus
   `kite-websites experiment-recommendation <website_id> <experiment_id>`
   (the platform's own statistical recommendation) —
   `read-experiment` returns state and metadata, never results, so it cannot
   ground a verdict on its own.

## The states that are not numbers

Every result carries a status. Honor it — the distinctions exist because
collapsing them produces confident lies:

- `measured` with zeros — genuine zero activity. Report it as zero.
- `pending` — nothing measured yet. Say so; do not treat as zero.
- `unavailable` — provider outage. Say the data could not be read. NEVER
  report an outage as zero traffic or zero conversions.
- `not_configured` — the site has no analytics to read. Name the fix
  (publish/deploy), not a performance judgement.
- An event `unobserved` in the catalog window may simply be unvisited — it is
  not proof the instrumentation is missing or broken.

## Where built-in analytics data can and cannot go

A Kite-hosted site's events are received ONLY by Kite's built-in analytics.
No external analytics account (PostHog, Mixpanel, GA, …) receives them, so
never advise connecting one to read this data — a newly connected account
would show zero events. Built-in numbers go into deliverables as static
measured content with their windows and caveats; they are not a live
report-query source. When the user wants a report or dashboard to stay
fresh, offer a recurring monitoring workflow that re-measures and updates
it on a cadence. Suggest an external provider only for a site not hosted
on Kite.

## Findings and recommendations

Every finding cites its evidence: source ("built-in analytics"), date window,
any filters or comparison you applied, and caveats. The window is YOURS to
know, not the envelope's to echo — on the reads that take one: pass explicit
`from`/`to` dates on every `traffic`, `events`, and `errors` read and
`from_date`/`to_date` inside every funnel request, and cite the dates you
passed (a windowed read without dates uses the tool's default window — say
so rather than inventing exact dates). The catalog and experiment-results
reads take no date arguments: cite only the window metadata their responses
return, and when a response carries none, say the command's own fixed window
applied — never present your requested dates as having governed them. Repeat
the caveats and status the envelope does return; never strip them. A number
without its window is not a finding.

For recommendations, state: the observed evidence, the likely opportunity,
the uncertainty, the expected impact, and the proposed next action. Correlation
is not causality — "signups dropped the week the hero changed" supports a
hypothesis to test (route to `cro-experimentation`), never a verdict.

Strong/weak-point analysis: compare like with like (same window, same filters),
lead with the site's conversion goal from the catalog, and separate diagnosis
(what the data shows) from prescription (what to do about it).

## Runtime errors

Error aggregates are sanitized diagnostics: message, affected pages,
frequency, affected visitors, trend. Report impact ("N visitors hit this on
/checkout this week"), not stack-trace forensics. A rising error on a
conversion path outranks a static error on a low-traffic page. Fixing the
error is coding work — recommend a delegated fix task; do not attempt it here.

## Escalation and completion

Before returning, verify the result: every number carries its source, window,
filters, and comparison; every status was honored (no outage reported as
zero); every recommendation states evidence, opportunity, uncertainty, and
next action. A finding failing any of these goes back for another read or an
explicit caveat — not out the door.

Done means: the question answered with cited windows and caveats, or an honest
"cannot measure" naming what is missing. Escalate instead of pushing on when
the website cannot be resolved unambiguously, when a result is still
`unavailable` on one retry (report the outage; do not keep retrying), or when
the question needs data the
built-in analytics does not hold (CRM, ad spend — name the gap; do not
substitute guesses). Compact findings return as a message; a hosted findings page is
built only by the Generalist when explicitly requested or when the findings
cannot be understood in one concise message (`work-delivery` owns that
selection rule).
