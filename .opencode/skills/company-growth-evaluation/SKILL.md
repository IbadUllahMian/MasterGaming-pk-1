---
name: company-growth-evaluation
description: >
  Use this skill when the user asks the team to evaluate, grade, or report on
  a company's growth — theirs or another company's — and wants that evaluation
  run: "grade acme.com's growth", "how are we doing on growth and where should
  we focus", "give me a growth report on this prospect". It runs the phases in
  order and delivers a founder-facing report page. It generates the report;
  reading, re-sending, or sharing one the team already holds is ordinary
  knowledge-base reading, and older archived runs may also open on the Growth
  Grader page; if neither has it, say none was found. Load it only for an
  explicit request: an evaluation spends metered evidence sources and several
  agent runs, so a growth question the wiki already answers, and plain
  onboarding, do not start one. An automated turn starts it only when that
  turn's own message asks for this skill by name — the platform owns that
  decision and states it in the message. A one-off company profile,
  competitor landscape, or website audit is ordinary delegated research, not
  an evaluation.
mode: sandbox
---

# Company growth evaluation

An evaluation is one chain of delegated tasks, each reading the wiki pages
the ones before it filed: the rival roster is read first; the Research agent
captures one dossier page per company — the target and each rival, created
together; the Analyst grades the pages against the checklist; the Generalist
publishes the report in the team's brand. You are the chain's
orchestrator — phases never spawn phases, and you dispatch each phase in the
turn its input lands. The evaluation is done when the user holds the
published report's URL, its verdict in plain words, and the work Kite can
start from it. The Analyst's and the Generalist's skills own their methods;
the capture's method is this skill's own — `references/dossier-capture.md`,
handed to Research whole inside every capture brief, because Research holds
no skill for it. This skill owns the roster, the order, the handoffs, and the
delivery.

## Inputs

- **The company** — the domain or URL the request names, reduced to its bare
  host (`acme.com`). "Us" or "our growth" means the team's own company: the
  primary domain in `company/identity.md`, read per `wiki-management`, else
  the tracked domain of the one site `kite-websites list` returns. When
  several sites are listed, ask which is the company's primary domain before
  creating anything: a running chain cannot be retargeted. A company name
  alone is resolved before the roster read — `kite-research company-brand
  "<name>"`, the domain it returns — and stated in the reply; a resolved
  domain that looks wrong for the company is a question, not a brief.
- **Fresh or existing** — before creating anything, look for the newest
  `growth/growth-report-<yyyy-mm-dd>.md` (own company) or
  `companies/<slug>/growth-report-<yyyy-mm-dd>.md` (external) in the wiki. A
  request for the report, the latest read, or a question those pages answer
  is served from that page and the page URL it records. A fresh evaluation
  runs when none exists or when the user asks for one ("run it again", "fresh
  evaluation", "re-grade now that we've fixed things"); a re-run captures
  everything again, so say so when you offer one. An automated turn that asks
  for this skill states its own currency threshold in its message; that
  threshold governs that turn, and this rule governs every other request.
- **The audience** — the team's own company or an external one. The capture
  contract and the phase skills read `company/identity.md` themselves and
  file under `growth/` or `companies/<slug>/` accordingly; a brief carries
  the domain, never a verdict on ownership. The report itself is always
  public: its readers are founders who receive a link — the team's own
  founders included — so the report brief carries the line `Access: public`,
  and the page is published at its plain URL with no sign-in.
- **The rivals** — the three `top_competitors` the AI-answer read returns for
  the target: the managed pipeline's roster, add none, drop none, each by
  domain or, when the read returned none for it, by name, read per the
  section below before any capture. A rival list the user names
  overrides the read: skip it, and the target's brief says the roster is the
  user's.

## The chain

| Phase                 | Assignee                                                                     | The brief's method                              | The brief carries                                                                                                                                                                                                                                                                                                       | The result opens with                            | Handed on                                                      |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| 0. Roster read        | you, else Research in one task                                               | the roster brief below                          | the company domain, the as-of date — today, UTC                                                                                                                                                                                                                                                                         | `Report kind: Growth roster`                     | the rival roster by domain, or the empty roster with its cause |
| 1. Captures           | Research, one task per company — the target and each rival, created in one turn | `references/dossier-capture.md`, appended whole | the parameter lines of the brief below; `Rivals:` on the target's brief only                                                                                                          | `Report kind: Growth dossier`                    | each company's page path                                       |
| 2. Checklist analysis | Analyst                                                                      | `company-growth-analysis`                       | every dossier page path — the target's and each rival's, each exactly as its result named it — as the dossier; the as-of date; the roster                                                                                                                                                                               | `Report kind: Growth` and the analysis page path | the analysis page path                                         |
| 3. Report             | Generalist                                                                   | `dashboard-building`                            | the analysis page path — the Analyst's markdown page is the analysis the report is built from, its record appendix carrying every source with URL, window, and sample size; the dossier page paths; the team's recorded branding guidelines and their wiki paths; the wiki record path the page must be filed under — `growth/growth-report-<yyyy-mm-dd>.md` for the team's own company, `companies/<slug>/growth-report-<yyyy-mm-dd>.md` for an external one, dated with the analysis's as-of date; the access line; the ask — a founder-facing hosted growth report page built from the supplied analysis: the verdict, the key findings each carried by its number, the recommendations, the quick wins | the page URL, its access, and the wiki record path                           | the URL, the verdict, the recommendations, the record path the next evaluation's guard reads                      |

Assignees are the agents whose descriptions claim each artifact — AI-answer
visibility for the roster, the evidence dossier page, the growth analysis
over supplied evidence, the hosted report page — resolved and named as
`work-delegation` requires. Create every task through that skill's transport.

**A capture brief is the parameter lines plus the contract, unparaphrased.**
Write the lines, then append the reference file to the same description file
before the create. The contract travels whole because a paraphrase drops a
verb or an absence type, and the Analyst then grades a page with a source
silently missing. The `Rivals:` line goes on the target's brief only:

```sh
cat > /tmp/capture-title.txt << 'EOF'
Growth dossier — <domain>
EOF
cat > /tmp/capture-brief.md << 'EOF'
Company: <domain, or the name alone when the roster carried no domain>
Role: <target | competitor>
Target: <the target domain>
Rivals: <a.com, b.com, "Rival Name" | none — its cause>
As of: <yyyy-mm-dd>
EOF
cat .opencode/skills/company-growth-evaluation/references/dossier-capture.md >> /tmp/capture-brief.md
kite-tasks create --content-files /tmp/capture-title.txt /tmp/capture-brief.md "<the Research agent's exact name>"
```

## The roster read

The roster is read before any capture so the four captures run together
instead of the rivals waiting behind the target's whole run, its Siftly and
Trustpilot parks included. In the request turn, run
`kite-research company-ai-visibility <domain>` yourself and read `status`,
then `reason`, per its usage text:

- `ready` naming rivals is the roster: create the captures in this turn.
- `ready` with no rival matched, or a read the provider disowns — its caveat
  names a stale or mismatched profile, or a leaderboard category that is not
  this business — is an empty roster with that reason: the target runs alone.
- `analysis_running` or `analysis_failed`: the first analysis of a domain
  takes about ten minutes, and only a task can park on the platform wake.
  Create the roster task and end the turn; its wake carries the roster.

```sh
cat > /tmp/roster-title.txt << 'EOF'
Growth roster — <domain>
EOF
cat > /tmp/roster-brief.md << 'EOF'
Company: <domain>
As of: <yyyy-mm-dd>

Return this company's rival roster from its AI-answer standings: capture
nothing else, file no page, and load no research skill beyond
`work-delegation`. Run `kite-research company-ai-visibility <domain>`
(`timeout: 240000`) and read `status`, then `reason`, per its usage text. On
`analysis_running` with `platform_wake_armed` true, end the turn parked as the
usage text says and read again on the wake — one park only: a read still
running on the wake, or `analysis_failed`, is an empty roster with that
reason. A `ready` read the provider disowns — its caveat names a stale or
mismatched profile, or a leaderboard category that is not this business — is
an empty roster with the caveat as its reason. The result opens with
`Report kind: Growth roster`, then `Rivals:` — the three `top_competitors`
exactly as returned, each by domain or, failing that, by name, add none, drop
none, or `none` with the reason —
then the read's status and retrieval time.
EOF
kite-tasks create --content-files /tmp/roster-title.txt /tmp/roster-brief.md "<the Research agent's exact name>"
```

**Dispatch on the wake, never ahead of it.** Before the first create in a
turn, state in one line what the turn dispatches and why — the roster, the
captures, the analysis, or the report — then create. Create the captures —
the target's and one per rival, all in one turn, so their Trustpilot parks
run in parallel — in the turn that holds the roster: the request turn when your
read was `ready`, else the roster task's wake. Create the analysis in the
wake where the task listing shows every capture settled; a capture's wake
that leaves another capture running dispatches nothing. An empty roster
creates the target's capture alone, `Rivals: none` with its cause, and the
analysis in its wake, target-only; every later message says the comparison
is missing. Create the report in the turn the analysis lands. A phase created
before its input exists grades an empty page and burns a run; polling never
returns sooner than the wake.

**Hand off by wiki path, never by task result.** A task agent cannot read
another task's result; the wiki pages are the only channel two phases
share — the roster reaches the captures through their briefs. Quote each
page path exactly as the result that filed it named it. The Analyst's
markdown page is the analysis the report is built from — its record
appendix carries every source with URL, window, and sample size — so the
report brief names no task artifact and no task id.

**Briefs stay inside the invoked method's contract.** For a capture, the
contract is the reference; for the later phases, name the skill, inline every
input from the table, and state acceptance as that skill's own result contract
— the opener, the pages, the URL. Add context freely; never instruct an
output the method excludes: a rival captured inside the target's task,
evidence gathering inside the analysis, a second analysis pass, the
pipeline's platform-served page, or a write to the platform-owned
`growth/growth-report.md` mirror.

**The re-run guard.** Read the task listing per `work-delegation` before
creating any task — the listing is the chain's checklist, and a wake carries
no memory of earlier turns. Before the roster task or the captures, a roster,
capture, analysis, or report task for the same domain still `todo`,
`in_progress`, or `waiting` is this evaluation in progress: report its state
and continue the chain from it instead of starting another. Before any later
task, the same read confirms it is unstarted — a repeated wake must not
dispatch a task already created. Judge a stall by that skill's status read,
not by elapsed time: a roster task legitimately waits on the provider, and a
capture on review captures.

## Brand the report as the team's work

The team publishes the report, so use its verified identity from
`company/identity.md`, `company/brand/visual.md`, and
`company/brand/voice.md`. Inline the recorded values and their wiki paths in
the report brief. The evaluated company is the subject, not the visual brand.

The brief also sets the register. External company: **you** is its founder,
whose company and decision the report is about; **we** is the team, used
where the report offers to do the work. The team's own company: the standing
rule holds, **we** is the business and **you** the reader.

Use the subject's recorded identity on the report page only when the user
explicitly requests it. In that case, supply the recorded values and state:
"Scope: the report page only; the portal's shared brand stays the team's own."
A field no source records remains a gap. The evaluation never adds brand
research or derives a look.

## Delivery

Each phase's result arrives as a task-completion wake, and `work-delivery`
owns the message. What this evaluation adds:

- **The roster landed** — in your own read or the roster task's wake: one
  line — the rivals found, or that none were and why — and that the captures
  are underway.
- **The last capture landed:** one line — which companies were captured, what
  could not be — and that grading is underway. A capture's wake before the
  last one changes nothing the user has been told, and sends nothing. The
  dossier is evidence, not findings; never present it as the answer.
- **The analysis landed:** the overall read in plain words with the one
  finding that decides it, and that the report is being written.
- **The report landed — the payoff:** open with what we learned about the
  company, give the findings that matter most in the reader's own terms, each
  carried by its own number from the report, offer to start on them by name —
  the offers are the report's recommendations — and close with the report page
  URL exactly as the Generalist's result returned it. This
  message announces a report the whole chain worked for; a single sentence
  listing topic areas is a caption, not the payoff. The report is the
  deliverable; the dossier and analysis pages are internal.

Do not commission a findings page for an evaluation: the report phase
publishes the report itself, and a second page task gives the report two
writers.

## Verification

One pass before each reply that reports on the chain, read from the task
listing rather than from what you recall:

- The listing shows every task you report as underway — or as retried,
  re-sent, or requested — with the id its create returned, and no second task
  for the same phase and domain. Work you did not create this turn is not
  underway: offer it, never announce it.
- The task you dispatched this turn was created in the turn that carried its
  input — the roster for the captures, the pages for the analysis, the
  analysis for the report — and its brief quotes that result's page paths
  and domains verbatim; the target's brief carries the `Rivals:` line, and a
  capture brief ends with the reference file's text, appended, not retyped.
- The report brief carries the team's branding guidelines, their source paths,
  the register line, the access line, and the wiki record path; an explicit
  subject-brand request
  also carries its page-only scope line; the report's result
  names that path, or the payoff says the record is missing and the next
  evaluation will re-run.
- Every URL and page path in the reply came from a result; the report URL is
  the one the Generalist's result returned, never a route you constructed.
- The payoff carries the read, the findings, the offers, and the URL; an
  interim message says what is underway, promises nothing beyond it, and adds
  only what changed since the last message — a wake that lands the same news
  the user already has does not repeat it.

Fix what fails before sending: a reply that fails a check misreports the
chain, and the user cannot see the listing to correct it.

## Failure handling

- **The roster task settled with an empty roster** because the read failed
  or never returned: retry it once, same brief, and report it by the id its
  create returned; a second empty roster continues target-only, said so. A
  roster task still `waiting` is parked on the provider, not settled.
- **The target's capture settled without a page** — the task failed, the
  site and every source were unreachable, or it settled still parked on a
  source that never returned. Judge this only on a phase the listing shows as
  **settled**: a capture task still `todo`, `in_progress`, or `waiting` is
  parked and working, the re-run guard above governs it, and a retry created
  beside it is a second capture of the same domain. Once it has settled
  without a usable page, retry the target capture once, same brief, and
  report it by the id its create returned. If the retry settles the same way,
  stop the chain, say what blocked the capture, and ask whether to try again
  — the rivals' captures settle on their own and dispatch nothing — never say
  a capture has been requested, re-sent, or completed unless the listing
  carries that task.
- **A rival's capture settled without a page:** retry it once, same brief.
  If it settles the same way, continue without it and say which rival is
  missing from the comparison; the analysis reads a missing page as
  coverage, never as a finding. Any other typed gap continues to the
  analysis for the same reason.
- **A rival's capture resolved no domain:** its page carries every source as
  `not_attempted`; continue to the analysis, which grades it without the
  evaluator, and say in the payoff that the comparison is thinner by that
  rival. Never retry it for the domain, and never guess one.
- **The analysis stops on a dossier it cannot read:** its result names the
  check that failed. A missing page is a capture's to file — retry that
  capture; anything else is reported, not re-run.
- **The report returns no live page, or a page that is not open at its plain
  URL:** relay exactly what its result says and offer a retry of the report;
  do not create another page task.
- **A phase fails or dies:** retry that one task per `work-delegation`'s
  retry link, same brief; later phases wait for its result.
- **A create is refused for credits or limits:** relay the refusal plainly
  and stop; a refused create is not a task. Rival captures refused after the
  target's was created continue to a target-only analysis, said so.
- **The user says stop:** hold. Acknowledge an in-flight result that still
  arrives without dispatching further.
