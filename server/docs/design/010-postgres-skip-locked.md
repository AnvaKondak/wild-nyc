# 010 · The Postgres backend claims with FOR UPDATE SKIP LOCKED

**Decision.** Jobs live in a `wild_queue_jobs` table. Claiming is one statement:

```sql
UPDATE wild_queue_jobs SET state = 'running', attempts = attempts + 1, locked_by = $1, locked_until = $2
WHERE id = (
  SELECT id FROM wild_queue_jobs
  WHERE queue = ANY($3) AND ((state = 'ready' AND run_at <= $4) OR (state = 'running' AND locked_until <= $4))
  ORDER BY run_at, id LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

**How it stays correct with many workers.**
- `FOR UPDATE` locks the row the inner query picked, for the rest of this statement.
- `SKIP LOCKED` means another worker running the same query at the same moment
  *skips* that row and takes the next one, instead of waiting or taking it too.
- Because select-and-update is one statement, there's no gap where two workers have
  both "seen" a job as free. The row lock ends when the statement commits; from then
  on the *lease* (`locked_until`, see 007) is what keeps the job ours.

**Why not Redis or `LISTEN/NOTIFY` or a library?** CLAUDE.md rules out a queue
library. Postgres is already the app database, so jobs get transactions, backups and
inspection (`SELECT * FROM wild_queue_jobs WHERE state = 'dead'`) for free. Workers
poll once a second when idle; at our volume (hundreds of jobs a day) that's nothing.
`LISTEN/NOTIFY` could cut the latency later without changing the table.

**Indexes match the queries.**
- Partial index on `(queue, run_at, id) WHERE state = 'ready'`: claim's main search.
- Partial index on `(queue, locked_until) WHERE state = 'running'`: expired leases.
- Partial *unique* index on `unique_key WHERE state IN ('ready','running')`. This
  makes unique keys a database guarantee: `INSERT … ON CONFLICT DO NOTHING` can't
  create a duplicate even if ten processes enqueue at once (there's a test for that).

**Times.** We pass `now` in from Ruby rather than using SQL `now()`, so tests can
control the clock and the memory and Postgres backends behave identically. Times are
sent as explicit UTC strings and the session runs in UTC.

**Tested.** The same behavior suite runs against memory and Postgres, plus
concurrency tests: 10 threads racing to claim 20 jobs never get a duplicate; 8 workers
run 200 jobs and each runs exactly once.

**Connections.** One `PG::Connection` per worker thread; they aren't thread-safe.
