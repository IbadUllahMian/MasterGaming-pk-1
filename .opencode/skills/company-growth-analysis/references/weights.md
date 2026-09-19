# Weights v0 — emphasis tables

The platform's pipeline applies the same tables from `growth_grader/analysis/weights.py`; when a move changes there, change it here in the same PR so the Analyst and the pipeline keep weighing alike.

Every group starts at its baseline score. Each decided profile fact adds its moves (+1 or −1 per named group); `unknown` adds nothing, and so does any decided value with no row below — `hybrid`, `own_website`, `both`, and `software` are the neutral defaults the checklist was written for. Sum per group, then clamp: a positive total is `counts_heavily`, zero is `counts_normally`, a negative total is `counts_little`. One step each way is all there is, so opposing moves cancel to normal.

## Groups and baseline

| Group | Baseline |
| --- | --- |
| Search visibility | +0 |
| Content coverage | +0 |
| AI-answer visibility | +0 |
| Buyer-guide presence | +0 |
| Local findability | +0 |
| Platform adoption | +0 |
| Community & word of mouth | +0 |
| Owned audience | +0 |
| Paid advertising | +0 |
| Partnerships & events | +0 |
| Outbound sales | +0 |
| Message clarity | +0 |
| Conversion path | +0 |
| Pricing transparency | +0 |
| Pricing structure & history | +0 |
| Trust & procurement content | +0 |
| Customer proof | +0 |
| Positioning history | +0 |
| Onboarding | +0 |
| Reviews | +0 |
| Product upkeep | +0 |
| Expansion mechanics | +0 |
| Hiring direction | +0 |
| Economic plausibility | +0 |
| Growth loops & dependence | +0 |
| Decay signals | +0 |
| Market context | +0 |
| Technical checks | -1 |

## Moves per fact value

| Fact | Value | Counts more (+1) | Counts less (−1) |
| --- | --- | --- | --- |
| SalesMotion | `self_serve` | Conversion path, Pricing transparency, Pricing structure & history, Onboarding, Reviews, Growth loops & dependence | Outbound sales, Trust & procurement content |
| SalesMotion | `sales_led` | Trust & procurement content, Customer proof, Hiring direction | Pricing transparency, Onboarding |
| Stage | `pre_motion` | Community & word of mouth, Owned audience, Message clarity | Search visibility, Reviews, Hiring direction, Economic plausibility |
| Stage | `motion_forming` | Conversion path, Reviews, Growth loops & dependence | Economic plausibility |
| Stage | `scaled_motion` | Search visibility, Expansion mechanics, Hiring direction, Economic plausibility | — |
| Stage | `incumbent` | Product upkeep, Expansion mechanics, Growth loops & dependence, Decay signals | — |
| AdoptionSurface | `app_store` | Platform adoption, Reviews | Search visibility |
| AdoptionSurface | `code_registry` | Platform adoption, Community & word of mouth | Paid advertising |
| AdoptionSurface | `partner_marketplace` | Platform adoption, Growth loops & dependence | Search visibility |
| Buyer | `businesses` | Trust & procurement content, Customer proof | — |
| Buyer | `consumers` | Community & word of mouth, Owned audience, Reviews | Outbound sales, Trust & procurement content, Customer proof |
| Offering | `human_service` | Customer proof, Reviews | Platform adoption, Pricing transparency, Pricing structure & history, Onboarding, Product upkeep, Expansion mechanics |
| Offering | `physical_goods` | Paid advertising, Conversion path, Reviews | Platform adoption, Trust & procurement content, Onboarding, Product upkeep |
| Offering | `marketplace` | Conversion path, Growth loops & dependence | — |
| LocationBound | `yes` | Local findability, Reviews | Search visibility, AI-answer visibility |
| LocationBound | `no` | — | Local findability |
