# Orchestrated Comparison

Use this graph for landscape or monitoring work across several companies. The
Research root owns the roster, every comparator record, and the integrated
result.

1. Freeze the evidence-backed roster and one shared rubric and result schema.
   Roster size, not a fixed batch count, determines the fan-out.
2. Create one direct Research child per comparator. Name the comparator, label
   the task a **direct-execution comparator leaf**, carry the shared schema,
   and pass `--subtask-key "competitor:<canonical-domain-or-slug>" --leaf`.
   The key keeps retries on one identity; the leaf flag prevents another layer.
3. On the all-settled platform wake, read every full child record from
   `../task_<child_task_id>/index.md`; inline wake text may be truncated.
   Synthesize across companies only after every child is terminal.
4. Correct an inadequate record on its existing keyed child through the
   delegation comment flow. If correction is exhausted, keep that comparator
   as a named evidence gap instead of replacing it or shrinking the denominator.

Comparator leaves return only their assigned evidence record. They do not
select competitors, compare companies, write durable findings, or delegate.
The root alone writes company profiles and the final synthesis.
