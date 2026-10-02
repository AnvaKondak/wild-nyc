# 014 · GET /v1/neighborhoods/:cell reports a 3×3 block of cells

**Request.** The app sends one geohash-6 cell, never coordinates. Anything that isn't
6 geohash characters gets a 422; cells outside NYC + Jersey City get a 404 and are
never stored or fetched. That also stops the API being used to make us crawl
iNaturalist for the whole planet.

**Response.**
```json
{ "cell": "dr5rke", "status": "ready", "updatedAt": "2026-10-01T16:00:00Z",
  "window": { "recentDays": 30, "yearDays": 365 },
  "species": [ { "id": "rock-pigeon", "recent": 4, "year": 31, "lastSeenOn": "2026-09-30",
                 "weekly": [0, 1, 0, 2, 0, 0, 1, 3, 0, 1, 2, 4] } ],
  "sources": [ { "name": "iNaturalist", "url": "https://www.inaturalist.org" } ] }
```
`recent`/`year` are sightings (iNaturalist observations + eBird day marks) in the last
30/365 days, `weekly` the last 12 Monday-to-Sunday weeks, oldest first, zeros included.
Species never seen in the year are left out. `status: "warming_up"` means the first
fetch is still queued: the app keeps showing its bundled content until it's ready.

**Why a block, not the cell.** One cell is ~1.2 × 0.6 km, and a year of iNaturalist data
for one Park Slope cell was ~60 sightings across 10 species: thin. The cell plus its 8
neighbors (~3.6 × 1.8 km) is still clearly "your neighborhood" and much less noisy. The
fetch jobs query the whole block in one request and store counts per cell, so blocks
that overlap share data and nothing is fetched twice.

**First request.** Records the cell (`cells.last_requested_at`) and queues the fetch
jobs with unique keys, so a burst of requests queues one fetch.

**Reading.** The API reads through `SeriesStore.read`: a read-only `DiskStore` that
catches up on the log before each request (005), behind a mutex because Puma serves
requests on several threads.

**Privacy.** Nothing about the requester is stored (tested: IP and User-Agent appear
nowhere). Responses are `Cache-Control: private` with a 10-minute max-age.
