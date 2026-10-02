# 003 · A day is a calendar date, stored as midnight UTC

**Decision.** Daily counts are keyed by the observation's *local calendar date*
(iNaturalist's `observed_on`, eBird's `obsDt` date part), stored as the timestamp of
midnight UTC on that date: `TimeBucket.day("2026-10-01")`.

**Why.** NYC is 4–5 hours behind UTC. If we bucketed by real UTC instants, a pigeon
seen at 9pm on Oct 1 in Brooklyn would land on Oct 2. Users think in local dates, and
both sources already give us one, so we keep it and never do timezone math in the
store. Midnight UTC is just a stable way to turn a date into an Integer.

**Weeks** start on Monday. The Unix epoch (timestamp 0) was a Thursday, so
`TimeBucket.floor` shifts by 3 days before taking the remainder; that lines every week
up on a Monday.

**Rollups happen at read time.** Days are stored; weeks are computed when asked
(`Store#rollup`). With a few hundred days per series this is cheap, and it means there
is only one copy of the data to keep correct. Empty buckets are left out, not zero,
so "no data" and "zero seen" stay distinguishable for callers.
