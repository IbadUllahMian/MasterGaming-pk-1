---
name: conference-research
description: >
  Use this skill when asked to find, rank, or report on conferences, summits,
  trade shows, industry events, sponsorships, exhibitor packages, or speaking
  opportunities for go-to-market — "which conferences should we sponsor",
  "find events where our buyers will be", "is this event worth attending".
  For market or competitor research with no event angle, use `web-research`;
  for building the full invite or prospect list for a chosen event, use
  `prospect-research`.
mode: sandbox
---

# Conference Research

Produce an evidence-backed shortlist and a report-ready decision package. Optimize
for GTM usefulness, not travel planning or generic event discovery.

## Inputs

Capture or infer these before researching:

- Company name and domain.
- Market/category.
- ICP and buyer personas.
- Geography and travel constraints when known.
- Time window, usually the next 6-12 months.
- Goal: customer acquisition, partner development, analyst visibility, hiring,
  fundraising, community, or sponsorship.
- Delivery context from the delegating agent, including `slackChannel` and
  `slackThread` when supplied.

If the request names a company but omits ICP, stage, geography, or goal, read
the wiki and public context first. Ask the delegating agent for missing
constraints only when the answer materially changes the shortlist.

Extract the working GTM thesis:

- Primary buyer and user.
- Trigger pains and category alternatives.
- Regions with sales capacity or strategic importance.
- Current acquisition channels and gaps.
- Positioning wedge to test at events.

If wiki context is missing or stale for volatile facts, verify with current web
sources and write the synthesis back to the wiki before final delivery.

## Task Graph

Settle the shape before gathering any event evidence. When the request covers
more than one event — any shortlist, ranking, or pipeline across several
events — follow `work-delegation` for task mechanics and build this graph:

1. Resolve the selected events in one bounded discovery child, created with
   `--leaf` so it returns the selection instead of researching it. Skip this
   child when the request already names the complete, authoritative event set —
   there is nothing left to select — and go straight to step 2.
2. Create one direct-execution Research child per selected event, each with
   `--subtask-key "event:<official-event-slug>" --leaf`, so source gathering,
   speaker research, and enrichment run in parallel. The `kite-tasks create`
   usage owns what each flag does. `work-delegation`'s
   `references/decomposition.md` owns the rest: the all-settled wake read and
   correction without shrinking the denominator (keyed comparator fan-out
   section) and chunking above the direct-child limit (population fan-out
   rules); when chunking, the chunk — not the event — becomes the keyed slice.
   Each event child gathers that event's evidence and does not decompose
   further. It owns the proactive people outcome under Speaker And Contact
   Enrichment unless the user excludes people. Its brief names an exact contact
   target or accepted minimum when supplied, otherwise the default outcome,
   without prescribing the enrichment method. A leaf executes only what its
   brief names.
3. The parent integrates the event results into the shortlist and decision
   package, preserving complete contact rows, counts, and gaps for each event.

This skill owns that shape. A brief stating only the outcome leaves the method
here: it neither removes the graph, reduces multi-event work to one task, nor
removes the contact enrichment below.
Research a single named event in the current task.

## Conference Discovery

Build the candidate universe from multiple source types:

- Official conference, summit, expo, trade show, and industry calendar pages.
- Competitor, customer, partner, analyst, and investor event pages.
- Sponsor, exhibitor, and media-kit pages for adjacent products.
- Speaker pages for relevant executives, practitioners, analysts, and community
  leaders.
- LinkedIn or event-platform pages when accessible.
- Search queries combining buyer persona, use case, category, region, and year.

Prefer official event pages for dates, venue, agenda, sponsorship,
registration, and pricing. Use secondary sources only to discover candidates or
corroborate audience claims.

## Source Requirements

For every recommended conference, collect sources for:

- Official event homepage.
- Dates and location or virtual format.
- Registration or attendee link. Use the direct attend/register URL when public.
- Agenda, tracks, speaker list, or call-for-speakers page.
- Relevant speaker names, roles, companies, sessions, and professional emails
  when available.
- Sponsorship, exhibitor, media kit, partner prospectus, or sponsor contact
  link. Use the direct sponsor/exhibit URL when public.
- Audience profile, attendee roles, exhibitor list, or past attendee statistics.
- Public pricing, sponsorship tiers, deadlines, or contact path when available.

Treat conference pages as volatile. Check the page year and avoid stale event
pages. If only a prior-year sponsorship prospectus exists, label it clearly and
reduce confidence.

Do not invent attendee counts, sponsorship prices, speaker names, or deadlines.
If a field is not public, write `Not public` and include the best contact path.

## Speaker Research

Speaker research is mandatory for every recommended event. A conference report
that ranks events without researching who is speaking is incomplete and must not
be returned as `succeeded`.

After ranking the shortlist, for each recommended event:

1. Pull the published speaker lineup, keynote list, agenda, and session pages.
   Identify speakers most relevant to the target company by role, company,
   session topic, buyer perspective, partner motion, investor market, or
   sponsorship goal.
2. Research each relevant speaker's background from public sources. Capture
   name, title, company, the team/product/domain they work on, session or track,
   topic, why they matter to the target company, and a profile/source URL.
3. Aim for the most relevant 5-10 speakers per recommended event. Use fewer only
   when the lineup is genuinely small. Cover highest-fit buyer, decision-maker,
   and partner profiles first.
4. If the lineup is not yet published, say
   `Speakers not yet announced as of <date>, source: <url>`, then list confirmed
   past-edition speakers or the organizer/CFP contact as a proxy.
5. Never write `Not researched` when a public lineup exists. Mark uncertainty
   and link the source instead.

## Speaker And Contact Enrichment

An actionable conference decision includes people the team can learn from or
approach. Unless the user excludes people, proactively add relevant speakers
and sponsor-company or organizer contacts for every recommended event even when
the request asks only for a shortlist or decision package. This supporting
research makes the requested event population useful; it does not expand it.
Complete public speaker research first, then load `prospect-research` for the
contact fields, qualification, privacy, and completion contract.

Event-specific rules:

1. When the request gives an exact contact count per event, that count replaces
   the default. Otherwise, use the 5-10 highest-fit speakers per event plus only
   the organizer, sponsor, or partner contacts needed to act on the decision,
   not the entire conference roster. Send the selected contacts as one batch
   to the routed work-email capability `prospect-research` names.
2. For each enriched contact, capture why the person matters to the GTM motion
   alongside the `prospect-research` contact fields.
3. If enrichment reaches an unavailable terminal outcome, continue with public
   sources and preserve that outcome on each affected field. This does not by
   itself change a complete public-research artifact from `succeeded` to
   `partial`, and it does not excuse missing public speaker research.
4. An exact requested contact count is the packet population, not a count of
   records for which every enrichment provider returned every field. Keep each
   selected, source-backed contact in that population when the requested or
   discovered enrichment providers cannot supply a work email, and label the
   unavailable field and provider outcome. Do not invent an additional
   `outreach-ready` gate, replace an
   otherwise verified contact solely because an enrichment field is missing,
   or withhold the requested packet while searching indefinitely for a fully
   enriched replacement.

Enrichment runs inside each event's own child task; the Task Graph above owns
that split.

## Fit Scoring

Score each candidate from 1-5 on:

- Strategic fit: category, wedge, and GTM priority alignment.
- Buyer density: likelihood target buyers or strong influencers attend.
- Intent level: evaluation intent versus general networking.
- Sponsorship value: booth, speaking, lead capture, meetings, or partner options.
- Speaker/partner potential: realistic chance to speak, host, sponsor,
  co-market, or meet partners.
- Timing: launch cycles, sales capacity, and registration/sponsorship deadlines.
- Geography/logistics: travel and operational load.
- Cost/effort: likely spend and team bandwidth.
- Evidence confidence: source freshness and quality.

Assign one recommendation tier:

- `Must attend`: high buyer density, clear GTM fit, actionable
  sponsorship/speaking path, and workable timing.
- `Sponsor selectively`: strong audience, but value depends on package,
  speaking slot, or meeting plan.
- `Attend only`: useful networking or learning, but sponsorship likely weak or
  overpriced.
- `Monitor`: plausible future fit but missing evidence, wrong timing, or low
  confidence.
- `Skip`: poor ICP fit, weak evidence, wrong region/timing, or vanity
  visibility.

Explain the tier in plain English. The justification matters more than the
numeric score.

## Per-Conference Fields

For each shortlisted conference, include:

- Name.
- Official URL.
- Dates.
- Location or format.
- Registration/attend link.
- Target audience and buyer/persona fit.
- Relevant agenda tracks, themes, sessions, or speaker categories.
- Speaker lineup: table of relevant speakers with researched backgrounds,
  professional email, email confidence, enriched/public background, why they
  matter, and sources.
- Other relevant companies, sponsors, or exhibitors.
- Sponsorship/exhibitor options and direct sponsor link, prospectus link, or
  contact path.
- Public price or sponsorship cost when available.
- Deadlines for registration, sponsorship, CFP, or speaking when available.
- Why this organization should attend.
- Recommended action: attend, sponsor, speak, host side event, book meetings,
  monitor, or skip.
- Risks and unknowns.
- Source links with access date.
- Confidence level.

## Output Artifact

Create a single dated Markdown conference research file in the company wiki. If
the wiki is unavailable, write the Markdown report as the task result and name
the wiki blocker.

Never publish the hosted findings page. Return this page handoff in the task result
so the CMO or parent can decide the user-facing format after all event findings
return. Create the single Generalist task only under `work-delegation`'s
explicit standalone-page exception. When a findings page is selected, its Generalist
task receives the wiki path as internal context, full source URLs, and these requirements:

- the hub carries the executive take, the ranked shortlist table (tier,
  dates, fit, recommended action), sponsorship strategy, and the 30/60/90-day
  plan, with one `DrilldownCard` per event teasing its one-line verdict;
- each event's own page carries that event's per-conference fields — the full
  speaker table with emails and confidence, the sponsor/exhibitor roster, and
  sponsor-executive detail;
- Generalist alone writes the hub and every event page in one findings-page task;
- rosters and contact tables never render on the hub; a 200-sponsor roster is
  drill-down content by definition. Every speaker, sponsor, and attendee row
  that does render carries its own clickable source link in a `Source` cell —
  the agenda, roster, or profile page the row came from — because a reader must
  be able to verify one row without asking for the source list. Access dates,
  research date, confidence, methodology, and roster-completeness status stay in
  the wiki file and task result, and the hosted pages preserve the cited
  findings and any qualification needed to interpret them.

Use this report structure for the wiki Markdown file:

1. Executive take: the 2-4 events worth action and the biggest non-obvious call.
2. Recommended shortlist: ranked table with tier, date, location, audience fit,
   recommended action, attend link, sponsor link/contact path, estimated cost
   confidence, and why.
3. Event deep dives: one section per recommended event using the required
   per-conference fields, including the required speaker lineup with researched
   backgrounds and enriched professional emails/background confidence.
4. Sponsorship strategy: where to spend, where to avoid booths, and how to use
   speaking, side events, and meeting setting.
5. 30/60/90-day action plan: outreach, sponsorship deadlines, speaker
   submissions, meeting campaigns, and owner suggestions. Use researched
   speakers as named meeting or outreach targets.
6. Skips and watchlist: credible events that do not justify action now, with the
   reason and trigger for reconsidering.
7. Sources and access dates.

Return `succeeded` only when public conference discovery, ranked fit scoring,
mandatory public speaker research, contact enrichment (unless the request
excludes people or contact enrichment), and the wiki decision package are
complete. Enrichment that was attempted and returned unavailable fields,
labeled with the provider outcome, does not make the package incomplete;
enrichment that was never attempted without such an exclusion does. Return
`partial` when wiki
write-back or another required evidence layer is blocked, and name the exact
blocker. Always return a concise synthesis, caveats, full source URLs, the
exact wiki path, and — for every recommended event, unless the request
excludes people — its speaker and sponsor-company contact rows (name, title,
company, LinkedIn URL, professional email with all material qualifications,
source) in the task result itself. The wiki file and any findings page are in
addition to those rows, never instead of them; a summary that points at the
wiki delivers no contacts.
