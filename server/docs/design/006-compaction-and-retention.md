# 006 · Compaction rewrites the state; retention happens during compaction

**Problem.** An append-only log only grows. Every re-fetch of a day appends another
line for the same point (001), and old days we no longer need stay forever.

**Decision.** `DiskStore#compact(drop_before: cutoff)` writes the current in-memory
state, minus points older than `cutoff`, into one new segment, then deletes the old
segments. Retention is not a separate "delete" record in the log: it's just
compaction that leaves some points out.

**Crash safety.** The new segment starts with a `#base` line meaning "this file holds
everything; ignore all earlier segments". Steps:

1. Write `NNNNNN.log.tmp`, fsync. A crash here leaves a `.tmp`, deleted on next open.
   Old data untouched.
2. Rename to `NNNNNN.log`. Rename is atomic, so the base either exists or it doesn't.
   The directory is fsynced so the rename itself survives a power cut.
3. Delete older segments. A crash here leaves them on disk, but they're before the
   newest base, so they're ignored (and deleted on next open). Without the marker,
   replaying them would resurrect points retention had dropped.

**Readers** notice that a segment they had read is gone and rebuild from the base.

**Trade-offs.**
- Compaction writes the whole state, not just the parts that changed. At thousands of
  series × a year of days, that's a few MB: seconds, run nightly by the worker.
- Retention changes memory before the new file is written. If compaction crashes,
  the restarted writer replays the old files and the dropped points come back until
  the next compaction. Nothing wrong is ever *added*, so that's acceptable.
