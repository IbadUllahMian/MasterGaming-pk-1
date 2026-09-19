# Profile facts — the seven fields and how each is decided

Loaded at Stage 1, before profiling the first company. The vocabularies and
decision rules below are the contract; the stage's slice list, determinism
rule, and no-evidence branch stay in the skill body.

- `sales_motion` — `self_serve` | `sales_led` | `hybrid`. Decide from the
  site's calls to action, public pricing, and demo or contact-sales paths.
  `hybrid` only when both paths are demonstrably real: a working self-serve
  signup or trial **and** a staffed sales path shown by at least two of — a
  prominent demo/contact-sales call to action, sales roles among current job
  listings, an enterprise tier that says "contact sales". Name the signals.
  One real path plus a token version of the other is not hybrid.
- `stage` — `pre_motion` (no repeatable way of getting customers yet) |
  `motion_forming` (early signs of a repeatable path) | `scaled_motion` (the
  engine clearly exists) | `incumbent`. Decide from headcount, traffic,
  review base, and hiring trends. Age is a sanity check only; funding never
  decides the stage.
- `adoption_surface` — the one primary surface the evidence found:
  `own_website` | `app_store` | `code_registry` | `partner_marketplace`.
- `buyer` — `businesses` | `consumers` | `both`, from who the site
  addresses, who appears in the proof, and which review platforms customers
  use.
- `offering` — `software` | `human_service` | `physical_goods` |
  `marketplace`, from what is actually sold.
- `location_bound` — `yes` | `no`, from service-area and location language
  and whether a local business listing exists.
- `ownership` — `changed` | `hypothesis` | `no_signal`; always present,
  never weighted. Read it from `public_records` (its ownership query and,
  when present, the captured announcement page), `company_series`,
  `wayback`, `page_capture`, and `founders`. `changed` needs evidence that
  confirms on its own — a registry record naming a parent company, or an
  acquisition announcement captured as a page or archive snapshot; a search
  snippet alone never confirms. Founders whose current titles sit at another
  company are `hypothesis` — a founder can move on, or hold two roles, while
  the company stays independent — noted in the affected records' `limit` and
  promoted to `changed` only when a record or announcement corroborates. No
  ownership signal in those slices is `no_signal`, never a claim of
  independence; a pipeline-form dossier runs no ownership query, so its
  `no_signal` means the evidence never looked — the reason must say so. When
  the value is `changed`: carry it in the `stage` reason, weigh every group
  verdict against it, and give it the summary's first breath, citing its
  `evidence_paths` — a verdict that omits a known change of ownership
  misleads however right its numbers are.
