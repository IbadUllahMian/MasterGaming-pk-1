# MasterGaming.pk backend handoff

The frontend is currently demo-backed. `src/services/platform-repository.ts` is the single data-access boundary and `src/services/auth-adapter.ts` is the session/authorization boundary. Replace their implementations with authenticated API calls; do not expose secrets in browser code. The public UI must keep receiving the same shapes.

## Recommended relational model

| Table | Primary key & key relationships | Constraints and indexes |
| --- | --- | --- |
| `users` | `id` UUID; one-to-one `player_profiles.user_id` | unique normalized email, unique username, `created_at`, `updated_at`, status index |
| `player_profiles` | `user_id` FK users; optional `team_id` is derived through team members | unique game player id when assigned; region/rank index |
| `roles`, `user_roles` | `roles.id`; `user_roles.user_id` and `role_id` FKs | unique `(user_id, role_id)`; roles: Player, Team Captain, Moderator, Admin, Super Admin |
| `teams` | `id`; captain is FK users | unique normalized name and tag; region/status indexes; timestamps |
| `team_members` | `team_id` and `user_id` FKs | unique `(team_id, user_id)`; role enum Captain/Co-Captain/Player/Substitute; index user ID |
| `tournaments` | `id`; organizer FK users | unique slug; status, mode, region, starts-at indexes; created/updated/published timestamps |
| `tournament_rules`, `matches` | tournament FKs | match unique `(tournament_id, sequence)`; schedule/status indexes |
| `registrations` | tournament FK plus entrant user/team FK | enforce exactly one entrant type and unique `(tournament_id, user_id)` or `(tournament_id, team_id)`; status index |
| `match_results` | match FK, entrant FK | unique `(match_id, entrant)`; verified status index; store kills, placement, awarded points |
| `leaderboard_entries`, `ranking_snapshots`, `player_statistics` | tournament/season and player or team FKs | unique scope + entrant; points/rank indexes; snapshots are append-only |
| `notifications` | recipient user FK nullable for broadcast; actor FK nullable | read status, audience/type, scheduled-at indexes |
| `audit_logs` | actor user FK and related object references | append-only; index actor, object type/id, and created-at |

## Validation, results, and authorization

- The server validates registration deadline, slot availability, mode/team size, duplicate registrations, and membership before inserting a registration. Frontend validation is convenience only.
- Verify a match result in one transaction: lock relevant registrations, persist verified result rows, calculate points, upsert leaderboard entries and player/team statistics, write rankings snapshot if required, then append an audit log. Failed validation rolls back all updates.
- Enforce permissions on every server route: players own profile/team actions; captains manage only their teams; moderators have scoped review privileges; Admin and Super Admin manage platform content. Never rely on hidden navigation or the current demo role picker.
- Use server-managed sessions (secure, HttpOnly cookies or provider-managed session); keep all service/database keys server-side.

## API and route notes

Suggested resources: `/api/tournaments`, `/api/teams`, `/api/players`, `/api/registrations`, `/api/matches`, `/api/results`, `/api/leaderboards`, `/api/rankings`, `/api/notifications`, and protected `/api/admin/*`. Pagination, sorting, filters, loading errors, and command feedback already have UI counterparts.

The platform CMS owns `/admin`. The product administrator frontend is permanently located at **`/admin-panel`** and its nested routes. Do not create a competing frontend `/admin` route.

## Environment documentation

Document public base URLs only as `NEXT_PUBLIC_API_BASE_URL=`. Keep database URLs, auth secrets, provider keys, and service-role keys in server-only deployment configuration; never commit or expose example values that look like credentials.
