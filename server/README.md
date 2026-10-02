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

## Privacy rules (from CLAUDE.md)

- The app only ever sends a geohash-6 cell (about 1.2 × 0.6 km). The server never
  receives or stores a finer location, a user id, or an IP next to a cell.
- Observations are reduced to counts per cell on arrival; points are never stored.
- Observations iNaturalist obscures are never placed in a geohash-6 cell.
