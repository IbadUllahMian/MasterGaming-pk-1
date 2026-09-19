# llms.txt — format grammar, curation, and checklist

Load condition: you are writing or regenerating `llms.txt` (the llms-txt lane
of `website-agent-readiness`). Placement, input contract, and the
no-invented-facts guardrail live in the lane; this file is the format and the
craft.

## The format

An `llms.txt` file has these parts, and they must appear **in this order**:

1. **An H1 with the site or project name.** This is the only strictly
   required element.
2. **A blockquote summary** — a short paragraph (`> ...`) capturing what the
   site is and any key facts needed to interpret the rest of the file.
   Strongly recommended; almost always include it.
3. **Optional free-form prose** — zero or more paragraphs or lists giving
   must-know context. This region may *not* contain any headings.
4. **Zero or more H2 sections**, each a "file list": an H2 heading followed
   by a Markdown list of links. Each list item is `[name](url)` and may
   optionally be followed by `: ` and a short description.

The only headings allowed anywhere in the file are the single H1 and the H2
section headers. Don't use H3+ or put headings inside the prose region —
parsers and downstream tools rely on this structure.

Skeleton:

```
# Site Name

> One to three sentences on what this site is and the key facts a reader needs.

Optional short paragraph or list of must-know context.

## Section Name

- [Page title](/page): What the reader finds here and why it matters.
- [Another page](/other): Brief, informative note.

## Optional

- [Secondary resource](/extra): Nice-to-have, safe to skip.
```

### The `## Optional` section is reserved

A section literally named `## Optional` has reserved meaning: its links are
secondary material that tools may skip when a shorter context is needed. Put
supplementary or background resources here — never anything essential. Use it
as a pressure valve for context size, and omit it entirely if everything is
core.

## Curation workflow

- H1 is the site/brand name as a human would say it; the blockquote is the
  elevator pitch plus any fact a model must know to use the rest correctly
  (one to three sentences).
- Add free-form prose only for must-know context that doesn't fit the
  summary — a compatibility caveat, a governing policy. Otherwise skip it;
  brevity is the point.
- Curating the links into H2 sections is the core of the work: a *curated*
  overview, not a sitemap dump. Pick pages that genuinely help an LLM
  understand and use the site; drop boilerplate (cookie notices, login-only
  pages, duplicate landing pages). Group under headings named the way a
  knowledgeable person would mentally organize the site.
- Give each link a one-line `: ` description — this is what lets a model
  decide which link to follow.
- Move helpful-but-skippable material to `## Optional`.
- Self-check against the final checklist below before finishing.

## Choosing sections

Section names describe the site's actual structure — adapt freely, never
force a template. Starting points: software/docs (`Docs`, `Getting Started`,
`API Reference`, `Tutorials`, `Examples`); SaaS/business (`About`, `Products`
or `Solutions`, `Pricing`, `Customers`, `Support`, `Policies`); personal/
portfolio (`About`, `Writing` or `Blog`, `Projects`, `Talks`, `Contact`);
e-commerce (`About`, `Product Categories`, `Buying Guides`,
`Shipping & Returns`, `FAQ`); school/nonprofit (`Programs` or `Courses`,
`Admissions`, `Research`, `Resources`, `Contact`). Further business-site
candidates: `Website overview`, `Primary user goals`, `Key pages`,
`Mission and values`, `Team`, `Locations` or `Service areas`, `Pricing` or
`Plans`, `Contact`.

A scanner of the H2 headings should immediately grasp what the site offers
and where to look. Three to six well-chosen sections beat a long list of thin
ones; a one- or two-link section is fine when that link matters. Include a
section only when the site content supports it — never an empty or
speculative one.

### Sections that speak to AI agents directly

`llms.txt` is read mainly by AI agents, so two sections are worth adding to
almost any site when the content supports them:

- **`Agent guidance`** — practical, plain instructions for an agent using the
  site: which page to consult for which kind of question; when to send users
  to an official contact form, support page, sales page, or other official
  channel; and what the agent must not infer, estimate, or fabricate.
- **`Common questions`** — the questions users most often ask, each pointing
  at the page that answers it.

## Writing quality

Concise, concrete, expert-level plain — the audience is a model deciding what
to read next. Front-load the summary with what matters most; explain any
load-bearing jargon. Every link description earns its place by saying what
the page is the source of truth for: "Plan tiers, per-seat costs, and what
each tier includes" beats "Pricing page". Be specific to this site, not
generic filler. Curate ruthlessly — when in doubt, leave a marginal page out
or move it to `Optional`.

## Link targets

Every link target is a **site-relative path** beginning with `/` (`/`,
`/about`, `/blog/launch-update`) — the site serves `llms.txt` from its root,
so relative paths resolve correctly against whatever origin the site is
deployed at.

- **Every link must point at a route that actually exists on the site.**
  Verify the path against the supplied source — for an HTML SPA, the
  `const routes = { ... }` declaration; for Next.js, the
  `src/app/**/page.tsx` set; for an MPA, the `<a href="/…">` links from the
  home page. If a path is not in that source, leave it out.
- **Never include an absolute URL** (anything starting with `http://`,
  `https://`, or `//`) as a link target — the deployment origin is decided
  later and is not knowable here. An inspiration/source URL in the brief
  ("build a site like https://example.com") is a third-party origin: using it
  sends LLMs and agents off this site entirely. Strip the origin; keep only
  the path portion if it matches a real route on the generated site.
  BAD: `[Features](https://www.example.com/features)` ·
  GOOD: `[Features](/features)`.
- Use `.md` variants only when the surrounding context confirms a Markdown
  version of the page exists at that URL.
- Favor content-rich routes over navigation-only or login-gated pages.

## Worked example

```
# Brightpath Analytics

> Brightpath is a cloud analytics platform that turns raw product event data into dashboards and alerts for non-technical teams. It is aimed at product and growth teams; it is not a general-purpose BI tool and does not support custom SQL.

Key things to know:

- Brightpath connects to event sources via prebuilt integrations only — there is no raw database connector.
- All plans include unlimited viewers; pricing scales by tracked monthly events.

## Product

- [How Brightpath works](/product): Overview of event ingestion, dashboards, and alerting.
- [Integrations](/integrations): Full list of supported event sources and how to connect them.

## Pricing

- [Plans and pricing](/pricing): Tier breakdown, event limits, and what each plan includes.

## Support

- [Help center](/help): Setup guides, troubleshooting, and FAQs.

## Optional

- [Company blog](/blog): Product updates and analytics best-practice articles.
```

The structure is identical across very different site types (a portfolio, a
school, a store): only the H1, summary, and section names change.

## Final checklist

Before delivering, confirm:

- [ ] The file starts with a single H1 naming the site.
- [ ] A blockquote summary follows the H1 (present unless the user explicitly declined it).
- [ ] Parts appear in order: H1, summary, optional prose, H2 sections.
- [ ] The only headings are the one H1 and the H2 section headers — no H3+, no headings inside prose.
- [ ] Every H2 section is a Markdown list of `[name](url)` links.
- [ ] Most links have a concise, informative description that says what the page is the source of truth for.
- [ ] Descriptions are specific to this site, not generic filler.
- [ ] No invented facts; missing information is framed as "not listed on the site," not implied to exist.
- [ ] Any `Agent guidance` section is practical — which pages to use, when to point at official channels, what not to fabricate.
- [ ] Links are curated, not an exhaustive sitemap dump.
- [ ] `.md` link targets are used only where confirmed to exist.
- [ ] Any `## Optional` section contains only skippable, secondary material.
- [ ] The file is saved as `llms.txt` at the site root, at the path the lane's placement rule names for this repo layout.
