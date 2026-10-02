# 008 · Retries back off exponentially; failures end up dead, not lost

**Retry.** When `perform` raises, the job goes back to `ready` with
`run_at = now + delay(attempts)`: 30s, 1m, 2m, 4m… capped at an hour, plus up to 10%
jitter. Each job class sets `max_attempts` (default 5).

- *Exponential* because most failures here are a source being down or rate-limiting
  us; hammering it doesn't help.
- *Jitter* because a burst of jobs that failed together would otherwise retry
  together and fail together again.

**Dead.** After `max_attempts` the job becomes `dead`, keeping `last_error`. Nothing is
silently dropped; a person can look at dead jobs and retry them (step 6).

**Unique keys.** `enqueue(..., unique_key: "fetch:dr5rke")` returns the existing job if
one with that key is `ready` or `running`. The scheduler enqueues "refresh this cell"
regularly; if a fetch is slow or the worker is down, this stops a pile of identical
jobs building up. Once the job is `done` or `dead`, the key is free again.

**Only `StandardError` is caught.** `Interrupt`/`SignalException` (Ctrl-C, shutdown)
are left alone so the process can exit; the job's lease then expires and it's retried.
