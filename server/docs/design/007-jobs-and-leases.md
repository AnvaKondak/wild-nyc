# 007 · Jobs are stored records; workers lease them

**Jobs.** A job class includes `WildQueue::Job` and defines `perform(**args)`. What's
stored is a record: class name, JSON-safe args, state, attempts, run_at. Args go
through JSON when enqueued, so a job sees identical args from memory or Postgres.

Only classes that include `WildQueue::Job` are registered, and a worker will only run
registered classes. A row naming `Kernel` (bad data, or someone writing to the table)
is buried, never `const_get`-ed and run.

**States.** `ready → running → done`, or back to `ready` to retry, or `dead` when out
of attempts. Done jobs stay (with their history) until cleaned up.

**Leases, not locks.** Claiming a job sets `locked_by` and `locked_until = now + lease`
(default 5 minutes). A job is claimable if it's `ready` and due, *or* `running` with an
expired lease. So if a worker is killed mid-job (deploy, crash, OOM), its job is picked
up again after the lease, with `attempts` counting the lost try.

Why: holding a database lock for the length of a job would tie up a connection and
lose the job state if the connection drops. A lease is just data, so it works the
same in memory and in Postgres, and survives restarts.

The cost is **at-least-once** delivery: a job that finished its work but died before
`complete` will run again. Our jobs are safe to repeat because time-series writes set
values (001). Any new job must be written to be idempotent too.

**Backend interface.** `push`, `claim`, `complete`, `retry_later`, `bury` (+ `find`,
`counts`). The worker only talks to these, so the in-memory backend (tests) and
Postgres backend (production) are interchangeable, and both run one shared test suite.
