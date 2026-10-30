# Shared arcade leaderboard

The production Worker is the existing `karnit-shemesh-notes` Sites project, alongside the unchanged notes API. Its D1 database stores run tickets and immutable computed scores in separate tables. This directory mirrors the arcade handler, migration, schema and exact game engine bundled into that Worker.

All requests use the site's existing `X-Archive-Key` header and allowed-origin policy.

- `POST /api/arcade/runs` with `{}` issues `{runId, seed, version, createdAt}`. Tickets are limited to 40 per IP hash per ten minutes and 300 globally per minute. Raw IP addresses are not stored.
- `POST /api/arcade/scores` with `{runId, name, actions, steps}` replays the run at exactly 60 Hz and saves the computed score. Names contain one to six Unicode letters, normalized to NFC. Actions are `{t, k:'m', v:-1|1}` or `{t, k:'b', v:0|1}`, applied before simulation tick `t`. Ranked runs must have ended, take at most 54,000 ticks and contain at most 6,000 actions. Duration is checked against the server-issued ticket; tickets expire after 24 hours. Caller-supplied score fields are ignored. A matching retry returns the original entry; changing its name or replay is rejected.
- `GET /api/arcade/leaderboard` returns `{allTime, today, version, day}`. Both tables contain the best result per case-insensitive name, up to 20 entries. The daily table follows the calendar date in `Asia/Jerusalem`, including daylight saving time. Entries expose `{id, rank, name, score, level, deliveries, totalCollected, createdAt}`.

The Worker imports `lib/arcade-engine.cjs`, an exact copy of the frontend's `arcade-engine.js`. Update both together when gameplay changes and change `engine.version` to expire incompatible tickets.

Run `node tests/arcade-api.test.mjs` from the website checkout with Node 24. It exercises the actual SQL migration in an in-memory SQLite database and never writes to production. The Sites source additionally passes `tsc --noEmit` and `node /workspace/sites-plugin/scripts/build-site.mjs`.
