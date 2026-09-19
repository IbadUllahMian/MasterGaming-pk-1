# Recipe: the team's Kite GitHub App (`kite-github`)

Use this path for GitHub account and API actions — reading repos, opening issues, reading pull requests, and similar REST calls. Importing a repository into a website, creating a new repository for the site, and syncing the website to or from its repository are the web developer's work: delegate them to `web-developer` per `work-delegation` instead of scripting them here. The CLI is a generic passthrough to the GitHub REST API; it resolves scope, token, and URL from the env, so you pass only the `method`, the server-relative `path`, and optionally a `body`/`query` JSON object:

```bash
kite-github api POST /repos/acme/website/issues \
  '{"title": "Broken link on pricing page", "body": "Found via the CMO."}'
```

- `method` — `GET`/`POST`/`PATCH`/`PUT`/`DELETE` (case-insensitive, 1st arg). Writes are allowed; they are bounded by the permissions the team granted the GitHub App at install.
- `path` — a server-relative GitHub API path starting with `/` (2nd arg; e.g. `/installation/repositories`, `/repos/{owner}/{repo}/issues`, `/repos/{owner}/{repo}/pulls`). Never a full `https://` URL.
- `body` *(optional, 3rd arg)* — a JSON object string for writes, e.g. `'{"title": "…"}'`.
- `query` *(optional, 4th arg)* — a JSON object string of query params, e.g. `'{"per_page": "100", "page": "2"}'`. Paginate explicitly; large responses are capped. To pass a query without a body, send `''` for the body: `kite-github api GET /search/issues '' '{"q": "…"}'`.
- **The result carries GitHub's own outcome**: `result.status` is the GitHub HTTP status and `result.body` is the parsed response. A GitHub `404`/`422` comes back here as `status: 404` — it is *not* a gateway error, so inspect `status` and branch on it (don't retry a 404 blindly).
- `409 provider_not_connected` from `kite-github` means the Kite GitHub App is not installed for this team. Run `kite-integrations connect github` and hand back the `<connect-cta>` per the connect recipe — the link opens the App's install flow (install on an organization and grant the repositories the work needs). The conversation resumes automatically once the install completes; then retry this native call.
- **Listing installation repos** (`GET /installation/repositories`): repo objects are large, so a default page overflows the cap and returns `{"_truncated": true, …}` with no `repositories`. Request a small page (`'{"per_page": "10"}'`) and read `total_count` — a truncated body is *not* empty. Only `total_count == 0` means the App has no repos granted: tell the user to grant it access (specific or all repos) in GitHub's install settings, or — when they want a repository created for or imported into the site — hand that to `web-developer` per `work-delegation`.

## Connection states (`kite-integrations connect github`)

GitHub's search and `inspect-integration` rows report the team's real install
state in `status`: a `not_connected` platform integration row for GitHub means
the Kite GitHub App is not installed, so trust the row copied from search rather
than probing. `kite-integrations connect github` starts (or repairs) the
installation — it mints the App's first-party install link (not a broker link),
and the conversation resumes automatically once the install completes.

- `409 provider_not_connected` from `kite-github` — the Kite GitHub App is not installed: run `kite-integrations connect github` and hand back the `<connect-cta>` per the connect recipe.
- `409 already_connected` from `connect github` — the App is already installed: tell the user GitHub is already connected and proceed, rather than offering a connect button.
- `409 connection_pending` — a teammate already requested the install and it is awaiting an organization admin's approval: tell the user that and to have an org admin approve it, rather than offering another button.

The Integrations page owns approval, repository-access configuration, and disconnect.

**List/search endpoints return large objects — project them before they reach you (see the "Reduce large results" gotcha in SKILL.md).** Use server-side filters and `jq` to keep only the fields needed to answer the user's question; never dump the whole response.

## Recipe: PRs merged in the last N days

Use the Search API (it filters by merge date server-side and returns leaner objects than `/pulls`), then project with `jq`. Compute the cutoff with `date`, build the query string with it, and read the projected rows from `result.body.items`:

```bash
since=$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)
kite-github api GET /search/issues \
  '' "$(python3 -c 'import json,sys; print(json.dumps({"q": f"repo:OWNER/REPO is:pr is:merged merged:>={sys.argv[1]}", "per_page": "50"}))' "$since")" \
  | jq '[.result.body.items[] | {number, title, merged_or_closed: .closed_at, user: .user.login, url: .html_url}]'
```

Only the projected array reaches your context. If `result.body.total_count` exceeds the page, page through with `"page": "2"`, … rather than raising `per_page` past 100. For a raw list endpoint like `/repos/{owner}/{repo}/pulls`, keep `per_page` small (≈15–30) so the page stays under the cap, and `jq`-project the same way.
