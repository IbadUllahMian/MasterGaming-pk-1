# Decomposition

Split work by independently completable outcomes the requester asked for, never
by the roster of available agents. Keep shared-context reasoning together.

## Split at ownership boundaries

Before splitting anything, list the deliverables the requester actually asked
for and read the agent descriptions to see who owns each one.

1. One agent's description claims the whole requested outcome → create exactly
   one task for that agent. Its own skills own the method, including any
   internal task graph, so authoring that agent's steps as sibling tasks
   invents scope and takes the work off its domain route.
   A request covering several conferences is one research outcome: keep the
   complete event set and per-event targets together so its parent can
   reconcile the event results.
2. Several agents own distinct requested deliverables → create one task per
   ownership boundary, and no finer.

The steps inside one agent's method — enumerating a population, gathering
per-member evidence, integrating results — are decomposed by that assignee while
it runs, using the rules below. A brief carrying only the outcome is the
expected input to that decomposition: silence about discovery children,
per-member children, or evidence layers leaves the method to the assignee and
never removes a graph its own domain skill requires.

## General rules

1. One task owns one outcome. Sibling scopes are non-overlapping; state
   exclusions where adjacent work could duplicate effort.
2. Run independent tasks in parallel. Create a dependent task only after its
   input returns, and inline that input in its brief.
3. Split work that crosses specialist functions. A bundled request is not
   evidence that no specialist fits.
4. Keep one indivisible, integrated artifact together when its usefulness
   depends on combining functions and no specialist owns it end to end.
   Multiple acceptance criteria alone are not enough to split it.
5. Parallel tasks may share a destination, but they must not share a file.
   Per-file submits make different pages safe and same-file writes lossy. Name
   each task's file or page.
6. A hosted hub, Report, or shared Report config has exactly one writer at a
   time. Create its assembly task after every required source result returns.
   Source tasks return records; they do not build the hub unless the standalone
   [delivery rule](findings-delivery.md#select-the-owner-from-delivery-context)
   applies.
7. Give the assembly task every source result, wiki path, source URL, caveat,
   and known gap. Population summaries supplement rather than replace evidence.
8. A parent owns the integrated result: reconcile contradictions, retry only
   the smallest failed slice, and account for every required child.
9. Respect graph limits: at most 12 direct subtasks, 32 subtasks below one root,
   and 3 subtask levels. Use fewer cohesive slices when the plan would leave no
   capacity for one retry or dependent assembly task. A limit or credit
   rejection ends further delegation; the parent continues manageable remaining
   slices inline within its capabilities and task budget, and names genuinely
   blocked scope. When a domain contract assigns one root a fixed keyed roster
   and integrated result, create only that root with
   `--subtask-wake-mode all_settled`; its server-enforced leaves follow the
   frozen roster instead of the two count limits. The emergency ceiling and
   credit gate still apply.

## Progressive decomposition

Use progressive decomposition only when later tasks depend on new discoveries.
A child may use the same agent type as its parent in exactly two cases: the
single non-delegating enumeration (discovery) task, or a slice already
enumerated by name. A same-agent subtask is invalid when it carries the creating
task's own overall scope — the whole population and outcome in different words;
execute that work in the current task instead. Restatement repeats the same
scope until the depth limit. A child applying the parent's question to one named
member or one bounded evidence slice is a narrowing, not restatement. A domain
skill's required graph is built from exactly those two shapes — its discovery
child, then its named per-member children — so it is narrowing whenever the
skill requires it, and it applies whether or not the brief mentions it. Sending
it to the different agent whose description owns it is routing, not
restatement, even when the brief carries the same question. Stop when one agent
can complete each task without further delegation.

## Fan-out over a population

Apply this to layered work for each member and to criteria-list requests such
as "find N qualified Xs matching these criteria." An applicable domain skill's
graph takes precedence over this generic shape.

Settle that graph's shape before gathering any evidence for the work, then
create each dependent tier as soon as its discovery input returns. A graph whose
population is not yet known cannot be instantiated up front — settling the shape
means deciding which tiers exist and what each one owns, never guessing their
members.

1. When an authoritative source (for example, a published list or event roster)
   defines a population whose members are not yet explicit, enumerate it first
   with exclusions. Keep a one-read enumeration in the current task. For more
   involved discovery, the parent creates one non-delegating enumeration task
   and yields; that child returns the explicit members and eligible count.
   Carry the count as every later layer's denominator and renegotiate a target
   it cannot support. Without an authoritative source, skip enumeration and
   denominators; report sourced counts and filters without claiming
   exhaustiveness.
2. Estimate work by layer. One authoritative read is a single task at any
   member count; per-member evidence work scales with the population.
3. Pilot one member first only when the per-member work is unproven: it layers
   multiple dependent stages under each member, or its result shape or
   capacity cannot be estimated without trying one. The pilot's outcome sets
   later chunk sizes. Routine single-layer per-member work — a profile, an
   enrichment, a lookup for each member — fans out without a pilot.
4. With membership and the pilot decision established, the parent owns the
   transition to per-member work. After a local enumeration, create the
   per-member tasks in the same turn. After a separate enumeration or pilot
   returns, create them on the parent's platform wake. Fan out in parallel —
   one task per member, or one per named chunk when graph limits require
   grouping. The enumeration child never delegates.
5. Each chunk names its slice and the full population, with acceptance scoped
   to the slice. Decomposition narrows the task, never the request.
6. Split a partial remainder more finely instead of repeating the oversized
   task. Finish only when every member and layer is covered or named as blocked
   with its cause.

## Keyed comparator fan-out

When a domain skill assigns one root a fixed keyed roster and an integrated
result, the root runs this graph:

1. Freeze the roster and one shared result schema before creating any child.
2. Create one direct child per member with `--subtask-key "<domain>:<slug>"
   --leaf`, carrying the shared schema. The `kite-tasks create` usage owns what
   each flag does; the owning domain skill states its key-prefix grammar (for
   example `competitor:<canonical-domain-or-slug>`, `event:<official-event-slug>`).
3. On the all-settled platform wake, read every child's full record from
   `../task_<child_task_id>/index.md` — the inline wake text may be truncated —
   and synthesize after every child is terminal.
4. Correct an inadequate record on its existing keyed child through the
   delegation comment flow. If correction is exhausted, keep that member as a
   named evidence gap; don't replace it or shrink the denominator, or the
   integrated result silently misreports its coverage.

Leaves return only their assigned record. The root alone compares across
members and writes durable records and the synthesis.
