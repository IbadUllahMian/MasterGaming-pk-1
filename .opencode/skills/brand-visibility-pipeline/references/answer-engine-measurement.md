# Answer-Engine Measurement Contract

Use this companion only for a task dispatched to the `Measure` stage. It owns
the additional-question cohort, multi-engine command, degradation behavior, and
snapshot payload. Return to `SKILL.md` for lifecycle, topic composition, other
measurement inputs, and the final digest.

## Question Cohort

The platform-generated baseline derives questions from the topic set.
Independently author additional questions for the multi-engine run — 5-10 is
the usual size for a tracked run — and the platform blends both sets. Form a
working thesis from the positioning,
website and wiki context, buyer personas, SEO picture, and prior measurements:
what the company offers, whom it serves, which buyer decisions create the most
value, and which demand it can credibly win. Business and audience fit lead;
demand, intent, current standing, and winnability sharpen the choice.

Choose natural, materially distinct questions across important problem and
decision contexts. Avoid paraphrase clusters. Keep the measured brand out of
agent-authored questions so the run tests whether engines surface it without
prompting; use competitor names only for a real comparison decision. Associate
every question with the closest measured topic and category, creating and
registering a topic only when the opportunity merits durable measurement.

User questions are sovereign. Include every tracked question verbatim in
addition to the authored cohort and mark it `source: "user"`; user wording
remains authoritative even when it conflicts with the composition guidance.
Two shapes of user-supplied list, decided by what the user asked for:

- **Exclusive** — the user wants exactly this list and nothing else ("only
  these", "the same 80 as last time", "just my questions"): that list is the
  whole cohort. Run every one of its questions as given, add no authored or
  historical question, and set `include_generated_prompts: false` so the
  platform adds nothing the user did not ask for.
- **Additive** — the user requires questions to be included (the tracked
  questions, "make sure these are measured"): measure them verbatim as
  `source: "user"` alongside the authored cohort and the generated baseline.

When the brief does not say, the list is additive. Never ask the user to
provide questions. Missing context calls for the best evidence-backed
selection with the uncertainty stated in `synthesis_md`, not a paused
measurement.

There is no size limit on the cohort: the platform measures a large list in
chunks and checkpoints each one, so the run simply takes longer (hours for
thousands of prompts) while the task stays parked.

## Run The Measurement

In the collection turn, write this input shape for a tracked run. An ad-hoc
benchmark omits `application_id`; its task has no site binding and the platform
therefore prevents snapshot submission.

```json
{
  "application_id": "<uuid from the task>",
  "topic_categories": {"<topic>": "<category>"},
  "include_generated_prompts": true,
  "additional_prompts": [
    {
      "prompt": "<exact buyer question>",
      "topic": "<mapped topic>",
      "source": "agent" | "user",
      "search_intent": "<intent or null>",
      "personas": ["<relevant persona>"]
    }
  ]
}
```

Include all authored and user-supplied questions and map every additional
question's topic in `topic_categories`; the command rejects an unmapped
question rather than losing attribution. Run:

`kite-aeo answer-engine-runs <external_site_id> answer-engine-input.json`

The command starts the run platform-side and returns at once with
`status: running` and `platform_wake_armed: true`: the platform adds its
generated baseline unless told not to, deduplicates the combined set with
`user` provenance winning an exact duplicate, and runs ChatGPT, Gemini,
Perplexity, and Claude — minutes for a tracked cohort, longer for a large
user-supplied list. End the turn parked (final message starting
`WAITING-FOR-PLATFORM-WAKE:`); the platform comments on this task when the run
finishes. In that resumed turn, run the same command with the same input file
to read the result: `status: completed` carries the aggregates, and for an
ad-hoc benchmark the command writes every answer with its citations to the
`answers_file` it names (next to the input file) and reports `answer_count` —
read that file for the per-question evidence instead of expecting it inline. The platform
has persisted every answer, citation, model, cost, provenance field, and
presence result under this Measure task. Do not copy answer rows or aggregates
into the snapshot payload.

Use completed engines when individual runs are unavailable. If the start
call fails after the shared protocol's one transient retry, or the result reads
`status: failed`, do not submit a snapshot that omits the paid evidence. Record
`Blocked: answer-engine-unavailable`, naming the failed command and that a
fresh Measure task is required, then stop. A terminal configuration,
authorization, payment, or invalid-input error is not a platform outage and is
not retried.

Make selection auditable in `synthesis_md`: include the exact agent-authored
and user-supplied questions, the command's unique question count for each
source, and the company-and-buyer thesis behind the authored set. Summarize the
platform-generated baseline by count rather than copying it.

## Submit The Snapshot

Build the payload and run `kite-aeo submit-snapshot payload.json`. The platform
validates it, attaches this task's persisted answer-engine evidence, and writes
the wiki files. Do not include `query_runs`, `engine_share`, or
`category_presence`; those fields are server-owned and agent-supplied values
are ignored.

```json
{
  "application_id": "<uuid from the task>",
  "external_site_id": "<exact id returned by registration>",
  "numbers": {
    "date": "YYYY-MM-DD",
    "share_of_voice": [{"name": "...", "domain": "...", "share_pct": 0, "mentions": 0, "is_self": true}],
    "leaderboard": [{"rank": 1, "name": "...", "domain": "...", "visibility_pct": 0, "is_self": false}],
    "citation_domains": [{"domain": "...", "count": 1}],
    "citation_urls": [{"url": "...", "count": 1}],
    "seo_summary": {"snapshot_date": "YYYY-MM-DD", "total_ranked_keywords": 0, "estimated_monthly_visitors": 0, "top_keywords": [], "target_keywords": []}
  },
  "synthesis_md": "<what was measured, standings, and notable movements; never raw provider JSON>",
  "current_md": "<refreshed evergreen state>"
}
```

Never estimate a number a measurement source did not return. Category values
remain exactly `generic`, `main_brand`, `sub_brand`, `product_name`,
`proprietary_feature`, `proprietary_metric`, and `personal_brand`. A rejected
submit means the payload is invalid; fix it rather than describing the platform
as unreachable.

The response can contain a canonical `report_url`. It is only a route hint for
a later Generalist Report task. Do not put it in the user-facing digest or claim
it is live; only Generalist's verified result establishes a deliverable URL.
