# 012 · iNaturalist observations become daily counts per cell, nothing more

**What the job does.** `FetchInatCell(cell:)` asks iNaturalist for verifiable
observations of our taxa inside the cell's bounding box, then for each one:

1. **Skips obscured locations.** If the observer chose obscured/private geoprivacy,
   or the species is sensitive (`taxon_geoprivacy`), iNaturalist's public point is
   randomized within a ~20 km box. Putting that point in a 1 km cell would invent a
   precise location iNaturalist deliberately hid. CLAUDE.md: keep obscured things
   obscured. They're dropped.
2. **Re-checks the cell.** The query box is inclusive at its edges, so a point on the
   border could belong to a neighbor. We geohash the point and keep it only if it's
   this cell.
3. **Maps the taxon to our species** through its ancestors (domestic pigeon → Rock
   Pigeon). Groups use "parent minus excluded" (moths = Lepidoptera − butterflies).
4. **Counts** `[species, observed_on] += 1`.

Then it writes those counts to the time-series store tagged
`{ cell, species, source: "inat" }`, and the point, the observation id and the observer
are thrown away. The store never holds anything finer than a cell.

**Window.** First run: a year, to have something to show. Later runs: the last 30 days,
because observations are often uploaded or identified days after the fact.

**Idempotent, including deletions.** Counts are *set* per day (001). Days inside the
window that had sightings before but have none now are set to 0, so a re-identified or
deleted observation stops counting. Days outside the window are left alone.

**Being a good API citizen.** One request per second per process (`Throttle`), a
descriptive User-Agent, paging by `id_above` as iNaturalist recommends, and a cap of 25
pages per run. Errors raise, so the queue retries with backoff (008).

**Testing.** A hand-written response covers each case (normal, subspecies, observer-
and species-obscured, just outside the cell, moth, butterfly, Monarch). One live run
against the real API for Park Slope returned a sensible year of counts.
