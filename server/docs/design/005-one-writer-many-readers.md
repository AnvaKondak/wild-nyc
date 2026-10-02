# 005 · One writer, many readers that follow the log

**Decision.** Exactly one process writes, enforced with an exclusive `flock` on
`data/LOCK`. Any number of read-only processes open the same directory. A reader
remembers how many bytes of each segment it has read, and `refresh` reads only what
was appended since.

**Why.** In production the job worker writes and the Rails API reads, in different
processes. Options considered:
- *Every process writes, with locking around each append.* Appends from different
  processes could interleave mid-line, and each process's memory would drift.
- *A separate store server that others call over a socket.* Correct, but a whole
  extra service to write and run.
- *Single writer, readers tail the log.* The log is already the source of truth, so
  readers just keep reading it. No new moving parts.

**Details that keep readers safe.**
- A reader only applies lines that end in a newline, so it never sees half of a write
  that's still in progress. It picks the line up on the next refresh.
- Readers never repair or truncate; only the lock holder may.
- After a compaction (006) replaces segment files, a reader notices a file it had read
  is gone and rebuilds from scratch.

**Cost.** A reader's view can be slightly behind until it refreshes. The API refreshes
before answering, and the data only changes when a job runs, so that's fine.
