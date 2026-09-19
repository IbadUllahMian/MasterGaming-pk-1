---
name: prompt-writing
description: >
  Use this skill when drafting, reviewing, or tightening reusable instructions
  for a team skill, custom agent, or scheduled workflow — for example "write
  the agent prompt", "improve these instructions", "make this skill trigger
  reliably", or "remove duplication from this prompt". Use the relevant
  management skill to save or delete the finished artifact; this skill owns its
  wording, structure, and validation.
mode: sandbox
---

# Prompt Writing

Write the smallest reusable instruction set that routes correctly, executes
reliably, and can be verified.

## Inputs

Establish these from the conversation before drafting:

1. The single outcome the artifact owns.
2. The situations or user phrases that should activate it.
3. The inputs and tools available at runtime.
4. The expected output and its downstream consumer.
5. Any hard safety or format constraints, and the consuming model when the
   conversation states it.

Ask one concise question only when a missing answer would materially change the
artifact. Otherwise state the assumption and continue.

## Classify the artifact before drafting

Put each instruction in its narrowest durable owner:

- A one-off request stays in the current conversation.
- Team facts, preferences, decisions, and precedent belong in team context.
- Identity, routing, and behavior that applies on every turn belong in an agent
  prompt.
- A reusable, independently useful procedure or quality bar with a stable
  input/output contract belongs in a skill.
- Cadence and orchestration across independently useful stages belong in a
  scheduled workflow.
- Raw capability, deterministic logic, or an independent tool loop belongs in
  a tool or service.

Within a skill, keep a sub-procedure as a chapter when it shares the parent's
owner, sources, permissions, artifact, and completion rubric and is rarely
requested alone. Use separate skills when each stage is independently useful;
connect those stages with a workflow.

## Choose the artifact shape

### Custom agent prompt

Use three sections:

1. **Role** — one sentence defining the bounded responsibility.
2. **Context** — static facts, runtime inputs, available tools, and downstream
   consumers. Keep behavior out of this section.
3. **Instructions** — ordered, independently actionable rules. Put the most
   important decisions and constraints first.

If the role needs an unrelated "and also" responsibility, split it into another
agent when that responsibility is independently useful; delegate the work when
it is a supporting task the current agent must still coordinate.

### Skill

Treat the skill description as routing metadata and the body as execution
instructions.

- Start the description with `Use this skill when ...`.
- Name two or three realistic trigger phrasings and the boundary with the
  nearest overlapping skill. State a non-trigger only when it prevents a likely
  routing collision, and pair it with the skill or surface that should win
  instead; when a positive and a negative trigger can both fire, state which
  takes precedence.
- Describe user intent, not implementation. Keep tool names, commands, internal
  paths, vendors, schemas, and environment details in the body.
- Keep one task family per skill. Extend an existing skill when the new behavior
  shares the same trigger and mechanics.
- State the required inputs, useful output, observable success criteria,
  permission or review boundary, verification, and failure or escalation path.
  Write completion criteria the executor can check and that force the legwork
  ("every record accounted for", not "produce a list"), and bound
  self-verification to a stated number of passes. Put exact tool calls and
  ordering in the body only when they are load-bearing. Follow the management
  interface's rule for whether frontmatter is stored separately.
- For a repository-backed `SKILL.md`, preserve one YAML block with `name`,
  `description`, and the runtime's required fields; keep the directory and
  hyphen-case name aligned. For a managed team skill, send those fields through
  its interface and keep frontmatter out of the body.
- Prefer `Purpose`, `Inputs`, `Output`, `Operating rules`, `Verification`, and
  `Failure handling` as the body order, omitting sections that add no
  instruction.

Code-managed platform skills ship with the product and are not editable from
this surface. When a request targets one, say so and route the change to the
platform team; create and update team skills through the `manage-skills`
capability. This skill carries the complete authoring standard for that work —
apply it directly.

### Scheduled workflow prompt

Write a self-contained instruction for a fresh session. Include the objective,
required integrations or data sources, timing context, destination, success
criteria, and what to report when a dependency is unavailable. Do not rely on
the current conversation being present later.

## Authoring workflow

1. Trace what the runtime receives and what consumes the output. Preserve any
   parsed output shape, delimiter, schema, or side-effect boundary.
2. Apply the classification above to each rule. Replace repeated rules with
   one canonical instruction and a short reference when the runtime can load it.
3. Draft in imperative, declarative sentences. Use one term per concept and
   state exceptions next to the rule they qualify.
4. Prefer positive directions that name the desired action. Pair necessary
   prohibitions with the safe alternative.
5. Specify tool-dependent actions at the stable contract boundary: capability
   or repository-owned command, required inputs, ordering gate, success signal,
   and failure path. For an integration catalog, name the capability and invoke
   `tool-discovery-execution`; do not copy its discovery procedure into the
   artifact or hardcode identifiers, schemas, and response shapes.
6. Add examples only when they disambiguate a likely mistake. Keep one minimal
   example per pattern.
7. When revising, cut or merge before adding. Grow the artifact only for a new
   instruction that has no existing owner.
8. Remove filler, restatements, exhaustive tutorials, speculative flexibility,
   and rules already supplied by the parent prompt or another loaded skill. Do
   not restate what the runtime can look up (a CLI's help output, a live
   schema); keep the unwritten convention and the gotcha the lookup source
   omits.
9. Write portable goals, constraints, decision rules, and observable
   validation that any model the platform can assign will satisfy. Keep model
   identity out of the prompt body. When the consuming model is known from the
   conversation, tune explicitness to it; split a model-specific variant only
   when evaluation shows the shared prompt is unreliable on an assigned model.

## Verification

Before saving, check that:

- The artifact has one coherent responsibility and no contradictory rules.
- The artifact belongs on the chosen prompt, skill, workflow, context, or tool
  surface and is no broader or narrower than its independently useful output.
- A skill description would trigger on the user's real phrasing and excludes
  the nearest neighboring concern.
- Every workflow step names an action, target, and expected result.
- Required stable commands and output formats are exact and available in the
  target runtime; volatile integration identifiers, schemas, and envelopes are
  discovered there instead of embedded in the artifact.
- Safety, confirmation, and side-effect boundaries match the surrounding system.
- The downstream consumer still receives the required shape.
- Required inputs, useful output, completion criteria, failure and escalation
  paths, and permission or review boundaries are explicit.
- The rules hold on any model the platform can assign to the consuming agent,
  and any consumer named in the conversation has been validated.
- Each rule appears once, in the correct owner.
- The artifact contains no secrets, credentials, user-specific preferences, or
  one-off task details.

Run the project's prompt-review and validation checks when they are available.
Apply every material finding or record a specific reason for declining it, then
review the final text again.

## Failure handling

- Narrow an unclear task family before drafting.
- Resolve overlap by choosing one owner and sharpening both routing boundaries.
- Stop before saving when a required tool, output contract, or side-effect rule
  is unknown and would change the result.
- Report an unavailable review or validation tool instead of claiming the
  artifact passed it.
