# 002 · Find series by scanning names, not with an index

**Decision.** `Store#keys(filter)` loops over every series name and checks its tags.
There is no inverted index (tag → series).

**Why.** Series are cell × species. With ~20 bundled neighborhoods plus cells people
ask about, and 17 species, that's thousands of series at most. Scanning a few thousand
small objects takes well under a millisecond, and a scan has no index to keep in sync
on writes, compaction or recovery.

**When to change it.** If the series count reaches hundreds of thousands, add a hash
of `"tag=value" → Set of keys`, updated in `Store#write`. The `keys` method is the
only place that would change.
