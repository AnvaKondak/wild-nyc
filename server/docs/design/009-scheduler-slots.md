# 009 · Recurring jobs claim a time slot exactly once

**Decision.** `Scheduler#every(interval, name, JobClass)` declares a recurring job.
Workers call `tick` each loop. Time is divided into slots (`now.to_i / interval`), and
the first tick in a slot asks the backend to `claim_slot("name:slot")`. Only the
caller that gets `true` enqueues.

**Why not cron?** Cron would be one more thing to install and run, and it runs on one
machine. Here the schedule lives in code next to the jobs, and any number of worker
processes can tick safely.

**Why slots?** Every worker computes the same slot number from the clock without
talking to the others. `claim_slot` turns "who goes first" into one atomic operation:
a `Set#add?` in memory, or `INSERT … ON CONFLICT DO NOTHING` on a unique column in
Postgres. No leader election, no locks held.

**Edge cases.**
- If no worker runs for a whole slot, that slot is simply skipped. The next slot runs
  normally; there's no backlog of missed runs. That's what we want for "refresh the
  data": one fresh run beats five stale ones.
- Slots are aligned to the epoch, so a 6-hour job runs at 00:00, 06:00, 12:00 and
  18:00 UTC, not "6 hours after the worker started".
- The enqueued job also gets `unique_key: "scheduled:name"`, so if the previous run is
  still going, a new one isn't piled on top of it.

**Housekeeping.** `revive(id)` gives a dead job a fresh start (attempts back to 0).
`prune(before:)` deletes old *done* jobs so the table doesn't grow forever. Dead jobs
are never pruned automatically: someone should look at them.
