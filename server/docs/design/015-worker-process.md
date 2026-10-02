# 015 · One worker process: writes the store, runs jobs, ticks the schedule

**Processes.**

| Process | Command | Does |
| --- | --- | --- |
| web | `bin/rails server` | Serves `/v1/neighborhoods/:cell`; reads the store; enqueues |
| worker | `bin/worker` | Runs jobs; the only writer of the time-series store |

`bin/worker` (see `lib/worker_process.rb`) eager-loads the app so every job class
has registered itself, opens the store *writable* (taking its lock, so a second worker
on the same directory refuses to start), and runs a `WildQueue::Worker` with a
scheduler. `INT`/`TERM` let the current job finish, then exit.

**Schedule** (slots aligned to UTC, see 009):

| Every | Job | What |
| --- | --- | --- |
| 6 h | `RefreshCells` | Queue fetches for cells requested in the last 30 days |
| 24 h | `CompactSeries` | Compact the store; drop days older than 2 years |
| 24 h | `PruneJobs` | Delete finished jobs older than 14 days |

**Why fetching happens in the worker, never in a request.** iNaturalist allows about
one request a second; a year of data for a block can take several pages. A request
that waited on that would be slow and would multiply API traffic under load. Instead
the first request queues the fetch and answers `warming_up`.

**Why one worker is enough.** Hundreds of jobs a day, each a few seconds, bounded by
the iNaturalist rate limit anyway. If it ever isn't, more workers can run *fetch* jobs
as long as only one holds the store lock; the others would hand counts to it (e.g.
via a queue). Not needed now, so not built.

**Checked end to end** in development: request → `warming_up` + queued fetch → worker
fetched a real year of iNaturalist data for Park Slope's block → request → `ready`
with 17 species. The scheduled jobs ran on the first tick.

**Seeding:** `bin/rails cells:warm` queues fetches for every neighborhood bundled in
the app, so they're ready before anyone asks.
