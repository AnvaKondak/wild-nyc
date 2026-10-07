#!/usr/bin/env python3
"""Sightings snapshot: who has actually been recorded near each named neighborhood, by season.

For every place in src/content/places.json, asks iNaturalist how many research-grade
observations of each of our species there have been within a short radius of the
place's center, season by season, over the last several years. Writes the counts to
src/content/sightings.json, which the app uses to decide who lives where (see
src/lib/sightings.ts for the threshold). No server: rerun this once or twice a year.

Privacy: counts only, at neighborhood scale. iNaturalist already blurs the locations
of sensitive species, and nothing finer than a count per neighborhood ships.

Run from the repo root:  python3 scripts/build_sightings.py
"""
import datetime, json, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://api.inaturalist.org/v1/observations/species_counts"
YEARS = 5
# A block is a few streets; a park or waterfront is bigger, so look a little wider.
RADIUS_KM = {"block": 1.5, "park": 2.0, "waterfront": 2.0}
SEASON_MONTHS = {"spring": "3,4,5", "summer": "6,7,8", "fall": "9,10,11", "winter": "12,1,2"}


def get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "wild-neighbors (sightings snapshot)"})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:  # rate limits and hiccups: wait and try again
            print(f"    retry {attempt + 1}: {e}", flush=True)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"gave up on {url}")


def counts_for(place, months, species, since):
    """Observations per our species near this place in these months. Group species
    (moths, orb-weavers) add up every member, minus any excluded branch."""
    taxa = ",".join(str(s["iNatTaxonId"]) for s in species)
    out, page = {}, 1
    while True:
        r = get({
            "lat": place["lat"], "lng": place["lng"], "radius": RADIUS_KM[place["kind"]],
            "taxon_id": taxa, "quality_grade": "research", "month": months, "d1": since,
            "per_page": 500, "page": page,
        })
        for row in r["results"]:
            ancestors = set(row["taxon"].get("ancestor_ids") or [row["taxon"]["id"]])
            for s in species:
                if s["iNatTaxonId"] in ancestors and s.get("iNatExcludeTaxonId") not in ancestors:
                    out[s["id"]] = out.get(s["id"], 0) + row["count"]
        if page * 500 >= r["total_results"]:
            return out
        page += 1
        time.sleep(1)


def main():
    species = json.load(open(os.path.join(ROOT, "src/content/species.json")))
    places = json.load(open(os.path.join(ROOT, "src/content/places.json")))["places"]
    since = f"{datetime.date.today().year - YEARS}-01-01"
    data = {}
    for place in places:
        data[place["id"]] = {}
        for season, months in SEASON_MONTHS.items():
            data[place["id"]][season] = dict(sorted(counts_for(place, months, species, since).items()))
            time.sleep(1)  # be gentle with iNaturalist
        total = sum(len(v) for v in data[place["id"]].values())
        print(f"  {place['id']}: {total} species-seasons", flush=True)
    snapshot = {
        "source": "iNaturalist research-grade observations",
        "since": since,
        "builtOn": datetime.date.today().isoformat(),
        "radiusKm": RADIUS_KM,
        "places": data,
    }
    json.dump(snapshot, open(os.path.join(ROOT, "src/content/sightings.json"), "w"), indent=1, ensure_ascii=False)
    print(f"{len(places)} places")


if __name__ == "__main__":
    main()
