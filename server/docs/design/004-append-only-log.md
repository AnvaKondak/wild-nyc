# 004 · Persistence is an append-only log of checksummed text lines

**Decision.** Every write is appended as one line to the current segment file:
`crc32 TAB key TAB time TAB value NEWLINE`. Nothing in a file is ever changed in place.
Memory is rebuilt on start-up by replaying the lines in order. Because writes *set*
values (001), replaying in order gives the right final state.

**Why append-only.**
- Appending is the simplest write that can't half-overwrite good data. A crash can
  only damage the very last line.
- Replay is just "read lines, apply them", which is easy to test and explain.

**Why checksums.** A crash or power cut can leave a partial or garbled last line.
CRC32 (Ruby's built-in `Zlib.crc32`) catches it cheaply. On open, the writer cuts off
a bad or unfinished *last* line in the *last* segment: that write never completed, so
nobody was told it succeeded. Damage anywhere else is real corruption, and the store
refuses to open rather than silently losing data.

**Why text.** `cat 000001.log` shows exactly what happened. The cost is a few extra
bytes per line, which doesn't matter at our size.

**fsync.** By default every append is `fsync`ed, so a write that returned is on disk
even after a power cut. Jobs write a few hundred points per run, so the cost is fine.
It can be turned off for tests or bulk loads.

**Segments.** Files roll over at 8 MB (`000001.log`, `000002.log`, …). Smaller files
make compaction (006) able to work a piece at a time and keep any one file easy to
inspect.
