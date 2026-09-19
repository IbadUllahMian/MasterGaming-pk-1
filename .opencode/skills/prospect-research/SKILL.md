---
name: prospect-research
description: >
  Use this skill when the task is to build a list of people matching a target
  profile, or to research, enrich, or validate named people — "build a prospect
  list for this event", "find CTOs at enterprise AI companies in New York",
  "get their work emails", "enrich these contacts", "validate these
  candidates", "confirm each still holds the listed role", "pilot one prospect
  before we scale", "who should we invite". Covers turning an ICP or event
  brief into a sourced, verified, fit-scored contact list with professional
  emails, or into one fully qualified pilot prospect that settles the sources
  and record shape for the rest of the population; checking an existing named
  list is still current and dropping whoever no longer fits; and drafting
  per-contact messages for channels a human sends. For choosing which events to
  attend, use `conference-research`; for sending outbound email or responding
  to an inbound lead, use `email-campaigns`.
mode: sandbox
---

# Prospect Research

Turn a target profile into an outreach-ready contact list: sourced, verified,
enriched, fit-scored.

## Inputs

Capture or infer before sourcing:

- The target profile: roles, seniority, company types, geography — from the
  task, or derived from wiki `icp/` and `positioning/` pages (see
  `wiki-management`) plus the event or campaign brief.
- List size and any smaller completion threshold the requester explicitly accepts.
- The outreach channel the list feeds — email, LinkedIn, event invites — which
  decides the required contact fields.
- Exclusions: existing customers, competitors, and opt-outs from wiki `email/`
  pages.

## Lane: List building

The default lane: a target profile or named population defines the list.

1. Write the profile as one testable sentence ("Heads of AI or CTOs at
   500+-person enterprises in the NYC area evaluating agent platforms").
   Every listed contact must pass it. Preserve its filters and time basis in
   each batch brief under `work-delegation`. Apply present-tense company-stage
   and role filters to current state; an earlier matching stage or role does
   not qualify a company or person that no longer matches. For a Series A/B
   filter, establish the latest supported equity stage: a later loan or grant
   alone does not advance it. Resolve conflicting equity or company-status
   evidence before accepting or rejecting the company.
2. Establish the population before sourcing people. `work-delegation`'s
   fan-out rules are the single owner of population classification
   (enumerable versus open-ended), enumeration, exclusions, and the
   denominator — apply them inside a single task exactly as across tasks. A
   validated prior output (located under the system prompt's prior-work rule,
   or a path the task names) enters that classification as evidence, by
   shape. A prior company or population list is the enumerated population
   only when the user names that roster or its validated scope is the current
   request's complete denominator; otherwise its rows are candidates —
   reapply the current profile and exclusions to them and keep sourcing
   beyond the file. A prior contact list seeds the qualification ledger:
   load its rows as the ledger's first entries, refresh their volatile
   fields, and research only what the list lacks. For an open-ended profile,
   source by signal (see Lane: Signal-first sourcing); for an enumerated set,
   source member-by-member.
3. Separate public discovery from paid enrichment because their inputs and
   evidence differ. Open-ended
   discovery — candidates matching a description, rosters, team pages, the
   current holder of a role, qualification evidence — is web research and
   produces a candidate row with name, current title, company, company domain,
   LinkedIn URL when public, and source URL. A paid provider receives that row,
   never a name alone: people search takes a company domain and title, profile
   enrichment takes a LinkedIn URL or name plus domain, email finding takes the
   same, and verification takes a found address. A profile result without an
   email does not complete an email outcome.
4. Qualify through the profile's gates in cost order — identity first, then
   cheap filters (membership, geography, exclusions), then per-person
   evidence scans — recording pass/fail counts per gate. The identity gate
   confirms current role and company from a public page, or a current
   platform profile lookup via `tool-discovery-execution` when a profile URL
   names a platform; drop candidates whose current role fails the profile
   and note recent title changes. Overlap work: while an async run is
   returning, qualify what it has already returned rather than idling on
   the poll.
5. Divide large lists into disjoint company or contact batches, preserving one
   owner for the cumulative list. For open-ended research, discover manageable
   named company batches and qualify/enrich each through the requested contact
   fields as it becomes available. Continue discovery and replacement sourcing
   while earlier batches run; the full company target is not a prerequisite
   for starting person research. A direct-execution leaf processes batches
   inline without creating subtasks; otherwise use `work-delegation` for
   independent batch children. Qualify company filters before paying for
   person details. Add replacements to the existing batches when candidates
   fail.
6. Enrich verified candidates in fit order, up to the list size (see Lane:
   Enrichment). The email stage is one call: the routed capability that finds
   work emails for a list of identified people takes the complete candidate
   rows and itself batches them, retries misses across routes, and verifies
   each found address; a `submitted` response is resumed with its token.
   Preserve each returned provider outcome and email qualification. Score fit
   1-5 against the profile with a one-line reason each; tier the list
   (primary/secondary) when it exceeds ~15 contacts.
7. Reconcile completed batches against the qualification ledger. Continue from
   the shortfall, then deliver per Output.

## Continue from the shortfall

Keep one cumulative ledger with full accepted rows, missing fields, rejections
with their failed criteria, and provider outcomes. Merge completed batches and
continuation additions into it, reusing supported fields after corrections.
Before each delivery, reconcile it against previously delivered rows: every
removed contact needs an explicit rejection or duplicate reason. A discovery
match overrides a qualification rejection only when new evidence resolves its
failed criterion; otherwise source a replacement. Derive the count and delivered
list from the same deduplicated accepted rows meeting the profile and requested
fields, so reconciliation cannot silently discard completed work.

For an open list, a rejected company or an unresolved email is a reason to
source a replacement, not to stop the list. Paginate or expand discovery within
the same qualification criteria until the requested count or explicitly
accepted minimum is met. A small initial roster is not the available market.
Reaching that accepted threshold is complete; still report delivered versus
requested so the user can see the difference.
For a fixed named roster, retain unresolved members and report their gaps.

A pending provider job is unfinished work. Follow `tool-discovery-execution`'s
polling contract while continuing independent qualification or replacement
batches. A saved provider handle does not arm a task wake: complete its polling
in the active turn or return an explicit incomplete result when the applicable
budget ends, including the active job and exact remaining work for the delegator.
End below the accepted minimum only with an evidenced access, credit, provider,
population or task-time limit; preserve the completed list per Output.

## Lane: Signal-first sourcing

Use this when the task asks who is worth reaching *now* rather than naming a
population — "companies that just raised", "who is scaling their growth team",
"accounts showing buying intent".

1. Pick the signal that matches the profile and pull the companies:
   - `kite-research find-companies-by-signal <categories> [limit]` — e.g.
     `receives_financing` for budget, `increases_headcount_by` or
     `expands_offices_to` for scaling, `hires` for leadership change. Pass
     several as one comma-separated argument.
   - `kite-research find-companies-by-hiring <seniority> [since] [limit]` when
     the hiring itself is the signal. Narrowing is by seniority level —
     `c_level`, `vice_president`, `head`, `director`, `manager` — because the
     API has no free-text title filter.
   Both are billed per returned company, so narrow the filter before raising
   `limit`.
2. Drop stale signals yourself. `find-companies-by-signal` has **no date
   filter** — the endpoint accepts none — so it can return events of any age.
   Read each event's `found_at` and discard anything older than about 90 days:
   a signal that old is no longer a reason to reach out today.
   (`find-companies-by-hiring` does take a `since`, so pass it there — dated
   within the last year, which is as far back as that endpoint searches.)
3. Keep only companies that also pass the profile sentence. A signal is a
   reason to contact someone, never a substitute for fit.
4. Carry each company's triggering event — what happened, its date, and its
   source URL — through to the output. That event is the "why now" the outreach
   draft opens with, and it is the difference between a personalized message
   and a generic one.
5. Find the right people at those companies through the normal path: named
   pages and company team pages first, then the enrichment catalog.

## Lane: Enrichment

Entered from either sourcing lane — or directly, when the task hands over
named contacts to enrich or validate — whenever records need verified or
additional fields.

Use `tool-discovery-execution` for the current enrichment capability. It owns
catalog search, selection, inspection, connection, execution, validation
recovery, resume, and fallback; this skill owns what constitutes a useful
contact result. Search that catalog for the routed work-email capability by
its outcome (find work emails for identified people); a people-search or
profile route that reports an email flag has not found an address. A restarted
or resumed session re-runs any email stage with no recorded outcome; a
public-source miss is not an outcome.

1. Supply the strongest available identity for each candidate and request only
   fields the inspected capability supports. Retain the source evidence already
   gathered when enrichment adds or fails to add a field.
2. Treat a missing field or provider placeholder as unresolved. Keep completed
   fields and follow the capability's returned recovery or fallback until the
   field reaches a terminal outcome; profile completion never implies email
   completion.
3. Preserve the provider's email verification verdict separately from identity
   and company qualification. A found address is not proof of deliverability;
   a catch-all, risky or conflicting verdict remains qualified as such. Request
   email verification when the user needs verified addresses. A missing
   verification field is unresolved, not an invalid address; target that gap
   rather than repeating whole-profile research.
   Report every material qualification together: a verified status does not
   erase a separate catch-all or risky flag. With no qualification, label the
   address `unverified`. Keep a professional address in its row even when its
   qualification is risky or unresolved; the label informs use. Pattern-guessed
   addresses are fabricated and excluded.
4. Include only professional data relevant to the business purpose. Never
   include personal emails, phone numbers, home addresses, private social
   accounts, protected attributes, or sensitive personal inferences.
5. When the capability's available recovery cannot resolve a required field,
   apply Continue from the shortfall. Keep the accepted person row, mark the
   field with its terminal provider outcome, and name any blocker in the task
   result.

## Output

- A table, one row per contact: name, title, company, LinkedIn URL, professional
  email with provenance and all returned verification or risk qualifications,
  fit score with reason, source URL. Return every supported row in
  each partial, blocked, or corrected result; a working-file pointer or count
  does not deliver those rows. When the list came from
  signal-first sourcing, add a "why now" column carrying that company's
  triggering event and its date. Deliver it in the task
  result; when the task names a store (database, spreadsheet, CRM), also load
  it there via `tool-discovery-execution`. When the list is also published as a
  hosted page, the source URL renders as a clickable link in each contact's own
  row — no link, no claim — not as a footnote list under the table.
- When the task asks for outreach on a channel the platform cannot send
  (LinkedIn DMs, warm intros): draft one message per primary contact —
  personalized from the enrichment, under 60 words, matching
  `company/brand/voice.md` — for a human to send. Sending email is
  `email-campaigns`, not this skill.

## Verification

- Every listed contact passes the profile sentence and carries a source URL.
- Every email's provenance and material provider qualifications match the
  evidence. Missing verification is `unverified`; no clean verdict is inferred.
- The task result states list size delivered versus requested — against the
  enumerated denominator with per-gate counts when the population was
  enumerable — and any enrichment blocker.
- The task result states email coverage: rows with a professional email versus
  rows delivered, and for each missing address the routes that answered
  `not found` or were unavailable.
- An `enrichment unavailable` claim is backed by a gateway call that failed
  in this run — never by a previous run's notes or files.

## Failure Handling

- Profile underivable (no ICP in the wiki, none in the task): ask the
  delegating agent for target roles and companies; do not source against a
  guessed profile.
- Fewer qualified candidates than the accepted completion threshold (the
  requested count when no smaller minimum was accepted): deliver the shorter
  verified list with the evidence that proves the limit — for an enumerable
  population, the denominator and per-gate counts; for an open-ended one,
  the sourced count, filters applied, and routes exhausted, stating that
  exhaustiveness cannot be proven. A padded list is worse than a short one.
