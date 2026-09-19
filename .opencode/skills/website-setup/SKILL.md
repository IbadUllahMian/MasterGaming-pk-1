---
name: website-setup
description: >
  Use this skill when website work has no managed site to land on: the user
  wants to bring in an existing site or repository ("bring in acme.com",
  "import my site from GitHub"); a website build or edit arrives while the
  team's website listing is empty ("add a pricing page"); or the user asks for
  a brand-new website. It also owns one turn that is not a no-site turn: the
  user picking one of the design options a new-website task returned ("go with
  design 2"), which applies even though that website is already listed. It owns
  unmatched-site confirmation, the create-or-import decision, the design-options
  task, and executing that design pick. Otherwise skip it for work on a
  listed site; use work-delegation to resolve that target. Skip it for work
  that creates no website artifact, including internal tools, dashboards,
  audits, and research, even when the listing is empty.
mode: sandbox
---

# Website Setup

Website setup resolves the user decisions required before website work can land
on a site. It is conversational only: apply it when `THREAD_ID` is set;
task-execution instructions own the equivalent safeguards when `TASK_ID` is
set.

Apply every situation that matches. They can overlap: an empty listing answered
with a fresh website matches both the empty-listing and brand-new-website flows.

1. A named site has no match in the team's website listing.
2. Website work arrives while the listing is empty.
3. The user asks for a brand-new website.
4. The user picks one of the design options a new-website task returned.

Situations 1 to 3 are no-site turns. Situation 4 is the one exception: the
website exists and is listed, but the user's pick still has to be executed, so
it belongs here rather than with `work-delegation`.

Other work on a listed site stays with `work-delegation`. Work that produces no
website artifact routes normally, regardless of the listing.

## Resolve an unmatched site

For a named site, start with `work-delegation`'s canonical target-site resolver.
That skill owns the listing command, match fields, procedure, and match
outcomes; do not restate or improvise them here.

If the resolver finds an owned or ambiguous target, follow `work-delegation`
and do not offer the import route. A connected GitHub account is repository
access, not proof of who owns the site, so it never resolves ownership on its
own.

Continue here only when the resolver finds no match and the listing is
non-empty. An empty listing follows the next section.

- If the requested artifact imports or changes the site, confirm with the user
  that it was not already built on Kite. Ask for the GitHub `owner/repo` when
  it is missing. This confirmation prevents importing a Kite-hosted site whose
  custom domain is still verifying and therefore absent from the resolver's
  match fields. Write the authorisation into the task description itself — say
  that it assigns importing that URL or repository — because the delegated run
  can act only on what its task text already grants.
- If the request only studies the site, route it by the agent descriptions
  without ownership confirmation or an import question.

Before delegating any import route in this skill, apply the integration
precondition gate through `tool-discovery-execution` and confirm that the team
can reach GitHub. If access is unavailable, return its remedy and do not create
the task.

## Resolve an empty website listing

This flow applies only to work that creates or changes the team's website.

When the user has not chosen a route, ask whether to start a fresh website or
bring in their existing site from GitHub (a Next.js repository). Delegate only
the route they choose.

A bare approval such as "approved" or "go ahead" chooses neither route. Restate
the choices and wait on every turn until the user chooses. An explicit
hand-back such as "you decide" chooses the fresh-website route.

If the user chooses import without naming a repository, ask for it. If no
Next.js repository exists, use the fresh-website route.

The fresh route produces one website. Delegate one NEW-website task and record
deferred page requests on the initiative, or in the wiki when no initiative
exists, so they can land on that website after design selection. A later page
request joins the same deferred record.

For the fresh route, load `website-discovery` as the next step before preparing
design options. Use its confirmed brief as the design input. A direct request
to start with design options is proceed-now intent: have discovery resolve the
remaining creative choices from known context and reasonable defaults, then
continue to the design-options task in the same turn. Do not add a separate
discovery question or approval loop.

## Prepare a brand-new website task

A NEW-website task returns design options, not a finished website. Require:

- Designs generated from the approved brief.
- A screenshot for every design.
- A link where the user can compare the designs.

Do not add acceptance criteria requiring a finalized, verified, or live site.
Those belong to work after the user selects a design.

Use the confirmed discovery brief as the task contract. Copy every
`build_requirements` entry into the task description without losing exact facts
or user-authored copy. When the brief has a `goal`, also include this exact
directive so the generation pipeline consumes the selected conversion slug:

`PRIMARY CONVERSION GOAL (build the site's main CTA around this): <goal_type> — <goal_text>`

Omit the directive when `goal` is unset. Do not infer a replacement here.

Two repository-less forms differ. An import or clone request that names a site
but no repository stays an import request: ask for the repository, and convert
it to a NEW-website task only after the user confirms none exists. A request
that names neither a site nor a repository has nothing to bring in — write it
as a NEW-website task rather than asking for a repository the user never
implied.

Before creating the task:

1. Read `/efs/knowledge/company/brand/`.
2. Run `kite-websites list`; the conversational listing is read-only.
3. Treat a site as a design-match candidate only when it has a
   `selected_iteration` or `deployment_url`.
4. With no candidate, use a fresh direction.
5. With at least one candidate, resolve the design direction from the current
   message, then the earlier conversation. If neither supplies it, ask whether
   to match one of the candidates or use a fresh direction; name only the
   eligible candidates.
6. If the user explicitly hands back the design-direction choice, default to
   the most recently updated candidate and disclose that default.

When the user later selects a returned design, load
`references/design-selection.md`. That reference owns the dedicated follow-up
task and exact selection-command order; do not improvise them here.

## Completion

Complete only when one of these outcomes is observable:

- Non-website or read-only work was routed without a setup question.
- An import has the user's confirmation, repository, integration access, and a
  successfully created task.
- One NEW-website task was created with design options and the resolved design
  direction, using the confirmed brief from the website-discovery step.
- A design pick was executed through the follow-up task that
  `references/design-selection.md` defines, and the reply reports the selection
  from that task's result.
- A required choice or precondition is missing, it was requested explicitly,
  and no task was created prematurely.

Before returning, verify that listing-owned sites use the returned
`website_id`, unmatched sites use their hostname, empty-listing work uses only
a route the user chose, and NEW-website tasks contain no finished-, verified-,
or live-site acceptance criteria.
