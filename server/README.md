# Wild Neighbors server (phase 3)

Live neighborhood data for the app. Three parts:

| Folder | What | Notes |
| --- | --- | --- |
| `wild_series/` | Time-series store, plain Ruby, written from scratch | Counts per cell × species × day |
| `wild_queue/` | Job queue, plain Ruby, written from scratch | Postgres-backed, `SKIP LOCKED` |
| `api/` | Rails API-only app | Fetch jobs, neighborhood endpoint |

Design notes, one per decision: [`docs/design/`](docs/design/).

## Toolchain

- Ruby 4.0 and PostgreSQL 17 from Homebrew (`brew install ruby postgresql@17`,
  `brew services start postgresql@17`).
- macOS's own Ruby is too old. Put Homebrew's first on PATH: `source server/bin/env`.

## Run it

```sh
source server/bin/env
cd server/api
bundle install                 # installs into vendor/bundle
bin/rails db:create db:migrate db:seed
bin/rails server -p 3000       # terminal 1
bin/worker                     # terminal 2
curl localhost:3000/v1/neighborhoods/dr5rke
bin/rails cells:warm           # optional: pre-fetch the app's bundled neighborhoods
```

Optional: add eBird with a free key from ebird.org/api/keygen. Put
`EBIRD_API_KEY=...` in `server/api/.env` (git-ignored; loaded in development, never in
tests) or export it before starting the worker and server. Without it the server uses
iNaturalist only.

## Tests

```sh
cd server/wild_series && bundle exec rake    # time-series store
createdb wild_queue_test                     # once
cd server/wild_queue && bundle exec rake     # job queue (memory + Postgres)
cd server/api && bin/rails test              # API, jobs, privacy
```

## Privacy rules (from CLAUDE.md)

- The app only ever sends a geohash-6 cell (about 1.2 × 0.6 km). The server never
  receives or stores a finer location, a user id, or an IP next to a cell.
- Observations are reduced to counts per cell on arrival; points are never stored.
- Observations iNaturalist obscures are never placed in a geohash-6 cell.
