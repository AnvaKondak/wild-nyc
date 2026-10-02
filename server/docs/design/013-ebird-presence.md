# 013 · eBird adds "seen that day" marks, not counts

**The API's limits.** eBird API 2.0 has no history endpoint for an area. The useful call
for us, `data/obs/geo/recent`, returns each species' *most recent* sighting within a
radius over the last ≤30 days: one row per species.

**Decision.** `FetchEbirdCell` asks around the cell's center (2 km), keeps rows inside
the cell (geohashing each point), maps eBird species codes to ours, and writes **1** for
`[species, date]`, tagged `source: "ebird"`. It's a presence mark, not a count: a flock
of 14 pigeons is one sighting, same as iNaturalist's one observation.

**Never zero earlier days** (`DailyCounts#write(clear_missing: false)`). Tomorrow's
response replaces today's "latest sighting", but today's sighting still happened.
iNaturalist can list every observation in a window, so its job does clear missing days.

**Key handling.** The key comes from `EBIRD_API_KEY` and travels only in the
`X-eBirdApiToken` header, never the URL (URLs end up in logs; a test checks this).
Without a key the job does nothing and the scheduler doesn't enqueue it, so the
server works with iNaturalist alone.

**Privacy.** eBird already withholds sensitive species from the API. Rows from
personal locations (backyards) are kept, but like everything else they're reduced to
species + date + cell on arrival; the point is discarded.

**Not tested live** yet: no key was available while building this. The client follows
eBird's documented request and response shape; the tests use a response in that shape.
Run once with a real key before relying on it.
