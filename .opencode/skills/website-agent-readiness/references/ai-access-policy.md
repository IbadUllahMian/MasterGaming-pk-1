# AI access policy — crawler roster and robots mechanics

Load condition: you are executing an AI-crawler or content-signal change (the
access-policy lane of `website-agent-readiness`). Decide the policy in the
lane first; this file is the mechanics.

## The AI crawler roster and what each bot does

Edits to AI access are per-intent, not per-file. Know what each user-agent
controls before touching it:

| User-agent | Controls |
| --- | --- |
| `GPTBot` / `ClaudeBot` | OpenAI / Anthropic **model training** crawls |
| `OAI-SearchBot` / `Claude-SearchBot` | ChatGPT / Claude **search indexing** (being findable in AI search) |
| `ChatGPT-User` / `Claude-User` / `Perplexity-User` | **On-demand fetches** when a person asks the assistant to read this site |
| `PerplexityBot` | Perplexity answer-engine indexing |
| `Google-Extended` | Gemini training/grounding (does **not** affect Google Search ranking) |
| `Applebot-Extended` | Apple foundation-model training (does **not** affect Siri/Spotlight) |
| `Meta-ExternalAgent` | Meta AI training/indexing |
| `Amazonbot` | Alexa/Rufus answers |
| `DuckAssistBot` | DuckDuckGo AI answers |
| `CCBot` | Common Crawl corpus (feeds many model trainers) |

## Next.js sites (`src/app/robots.ts`)

The template ships a typed metadata route with a `*` rule plus an
`AI_CRAWLERS` rule block. To restrict a bot, move it out of `AI_CRAWLERS`
into its own rule with `disallow: '/'`:

```ts
rules: [
  { userAgent: '*', allow: '/', disallow: '/api/' },
  { userAgent: AI_CRAWLERS, allow: '/', disallow: '/api/' },
  { userAgent: ['GPTBot', 'ClaudeBot', 'CCBot'], disallow: '/' }, // training opt-out
],
```

Never replace `robots.ts` with a static `public/robots.txt` — the static file
cannot compute the absolute `Sitemap:` URL, and crawlers silently ignore
relative `Sitemap:` lines.

## Content Signals on Next.js

Only when the user asks to declare AI-usage preferences: the typed metadata
route cannot emit a `Content-Signal:` line. Replace `src/app/robots.ts` with
a route handler at `src/app/robots.txt/route.ts` (delete `robots.ts` in the
same change — the two conflict):

```ts
import { getBaseUrl } from '../../lib/site-url';

export const dynamic = 'force-static';

export function GET(): Response {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    '',
    `Sitemap: ${getBaseUrl()}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

Carry the AI-crawler rule groups from the old `robots.ts` into the text body,
and set the `Content-Signal` values to match the user's stated policy.

## Classic HTML sites (`frontend/public/robots.txt`)

A plain text file that ships the `*` rule, a
`Content-Signal: search=yes, ai-input=yes` line, and the named AI user-agent
group. Edit directives directly. Keep the `Sitemap:` line last and absolute —
the publish step rewrites its URL to the connected domain.
