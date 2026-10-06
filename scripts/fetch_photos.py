#!/usr/bin/env python3
"""Fetch one freely licensed photo per species from iNaturalist and bundle it.

Only CC0, CC BY and CC BY-SA photos are used (no "non-commercial", no all-rights-
reserved), so the app can ship anywhere; every photo keeps its credit in
src/content/photos.json and is shown on the species page.

Run from the repo root:  python3 scripts/fetch_photos.py [species-id ...]
Re-running keeps existing photos unless you name the species.

Each species also gets up to EXTRA more photos from different observers, so a story's
slides don't all show the same picture (src/content/photos-extra.json):
    python3 scripts/fetch_photos.py --extras [species-id ...]
"""
import io, json, os, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECIES = os.path.join(ROOT, "src/content/species.json")
PHOTOS_JSON = os.path.join(ROOT, "src/content/photos.json")
EXTRA_JSON = os.path.join(ROOT, "src/content/photos-extra.json")
ASSETS_TS = os.path.join(ROOT, "src/content/photoAssets.ts")
OUT = os.path.join(ROOT, "assets/photos")
UA = {"User-Agent": "WildNeighbors/0.1 (bundling CC-licensed species photos)"}
OK_LICENSES = {"cc0", "cc-by", "cc-by-sa"}
SIZE = 360
EXTRA = 3

# Photos passed over after a look (wrong life stage, a silhouette...): species -> photo ids.
SKIP_PHOTOS = {"monarch": [111043173], "european-starling": [365984069], "herring-gull": [343002826], "canada-goose": [247715952], "double-crested-cormorant": [173884349], "red-winged-blackbird": [275637604]}

# Photos chosen by hand from the candidates: species -> photo id.
PIN_PHOTOS = {"monarch": 45078365, "canada-goose": 606089370, "double-crested-cormorant": 512439682, "red-winged-blackbird": 617065992, "northern-cardinal": 452211481, "coopers-hawk": 12118242, "common-eastern-bumble-bee": 442676579, "western-honey-bee": 481248861, "orb-weavers": 555702674}

# Extra photos passed over after a look at the contact sheet: species -> photo ids.
SKIP_EXTRA = {"american-crow": [250510620, 53516042, 238951261], "black-crowned-night-heron": [565990241], "canada-goose": [37800057], "chimney-swift": [521705215, 384222882, 86950957], "common-eastern-bumble-bee": [17767241, 580690822, 327060771], "common-tern": [172940581], "dark-eyed-junco": [52405060], "double-crested-cormorant": [369136154, 255454786], "downy-woodpecker": [175723344, 634989842], "great-blue-heron": [134213334], "groundhog": [131610251], "mallard": [32774133], "monarch": [20535817, 1187530], "mute-swan": [13855998], "orb-weavers": [208881445, 324918466], "peregrine-falcon": [243839915, 35648686], "pond-slider": [5518581], "raccoon": [340830624, 292820239], "red-bellied-woodpecker": [657402075, 159444620], "red-tailed-hawk": [272209965, 55307530, 12266847], "red-winged-blackbird": [278246194], "ring-billed-gull": [57372242, 597860429], "virginia-opossum": [173131417], "western-honey-bee": [217394043, 485263880], "white-tailed-deer": [58166047, 24624866], "yellow-rumped-warbler": [252031775]}

# Groups get one representative species' photo.
PHOTO_TAXON_OVERRIDES = {"moths": "Dryocampa rubicunda", "orb-weavers": "Argiope aurantia"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)


def taxon_id_for(species):
    name = PHOTO_TAXON_OVERRIDES.get(species["id"])
    if not name:
        return species["iNatTaxonId"]
    found = get_json("https://api.inaturalist.org/v1/taxa?" + urllib.parse.urlencode({"q": name, "per_page": 5}))["results"]
    return next(t["id"] for t in found if t["name"] == name)


def pick_photo(taxon_id, skip=(), pin=None):
    taxon = get_json(f"https://api.inaturalist.org/v1/taxa/{taxon_id}")["results"][0]
    if pin:
        for tp in taxon.get("taxon_photos", []):
            if tp["photo"]["id"] == pin:
                return tp["photo"]
        return pick_from_observations(taxon_id, skip, pin)
    for tp in taxon.get("taxon_photos", []):
        p = tp["photo"]
        if p["id"] in skip:
            continue
        if (p.get("license_code") or "").lower() in OK_LICENSES:
            return p
    return pick_from_observations(taxon_id, skip)


def pick_from_observations(taxon_id, skip=(), pin=None):
    """Fallback: the most-faved research-grade observations with an OK photo license,
    preferring ones annotated as adults (iNaturalist term 1 = life stage, 2 = adult)."""
    base = {"taxon_id": taxon_id, "photo_license": ",".join(OK_LICENSES), "quality_grade": "research",
            "order_by": "votes", "per_page": 50 if pin else 20}
    for extra in ({"term_id": 1, "term_value_id": 2}, {}):
        time.sleep(1.1)
        obs = get_json("https://api.inaturalist.org/v1/observations?" + urllib.parse.urlencode({**base, **extra}))["results"]
        for o in obs:
            for p in o.get("photos", []):
                if pin and p["id"] != pin:
                    continue
                if p["id"] not in skip and (p.get("license_code") or "").lower() in OK_LICENSES:
                    p["medium_url"] = p["url"].replace("square", "medium")
                    return p
    return None


def square(img):
    w, h = img.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    return img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)


def credit(p, file):
    return {
        "file": file,
        "license": p["license_code"].upper().replace("CC-", "CC "),
        "attribution": " ".join(p["attribution"].split()),  # tidy stray line breaks
        "source": f"https://www.inaturalist.org/photos/{p['id']}",
    }


def save_square(p, file):
    url = (p.get("medium_url") or p["url"]).replace("square", "medium")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        img = Image.open(io.BytesIO(r.read())).convert("RGB")
    square(img).save(os.path.join(OUT, file), "JPEG", quality=82, optimize=True)


def pick_extras(taxon_id, avoid, n):
    """The species' curated taxon photos first (chosen to represent the species, so no
    odd ones), then the best-loved research-grade observations, one per observer,
    adults first. Skips `avoid` and anything without a license we can ship."""
    picks, observers = [], set()
    taxon = get_json(f"https://api.inaturalist.org/v1/taxa/{taxon_id}")["results"][0]
    for tp in taxon.get("taxon_photos", []):
        p = tp["photo"]
        if p["id"] in avoid or (p.get("license_code") or "").lower() not in OK_LICENSES:
            continue
        picks.append(p)
        if len(picks) >= n:
            return picks
    base = {"taxon_id": taxon_id, "photo_license": ",".join(OK_LICENSES), "quality_grade": "research", "order_by": "votes", "per_page": 40}
    for extra in ({"term_id": 1, "term_value_id": 2}, {}):
        time.sleep(1.1)
        for o in get_json("https://api.inaturalist.org/v1/observations?" + urllib.parse.urlencode({**base, **extra}))["results"]:
            user = o.get("user", {}).get("id")
            p = next((p for p in o.get("photos", []) if (p.get("license_code") or "").lower() in OK_LICENSES), None)
            if not p or p["id"] in avoid or user in observers or any(q["id"] == p["id"] for q in picks):
                continue
            picks.append(p)
            observers.add(user)
            if len(picks) >= n:
                return picks
    return picks


def extras(only):
    species = json.load(open(SPECIES))
    main_photos = json.load(open(PHOTOS_JSON))
    out = json.load(open(EXTRA_JSON)) if os.path.exists(EXTRA_JSON) else {}
    for s in species:
        sid = s["id"]
        if sid in out and sid not in only and len(out[sid]) >= EXTRA:
            continue
        main_id = int(main_photos[sid]["source"].rsplit("/", 1)[1])
        picks = pick_extras(taxon_id_for(s), {main_id, *SKIP_EXTRA.get(sid, [])}, EXTRA)
        out[sid] = []
        for i, p in enumerate(picks, start=2):
            file = f"{sid}-{i}.jpg"
            save_square(p, file)
            out[sid].append(credit(p, file))
            time.sleep(1.1)
        print(f"  {sid}: {len(picks)} more", flush=True)
    json.dump(dict(sorted(out.items())), open(EXTRA_JSON, "w"), indent=2, ensure_ascii=False)
    write_assets(main_photos, out)


def write_assets(photos, extra):
    # Metro needs a literal require() per image, so generate the maps.
    lines = ["// Generated by scripts/fetch_photos.py. Do not edit by hand.", "", "export const photoAssets: Record<string, number> = {"]
    for sid in sorted(photos):
        lines.append(f"  '{sid}': require('../../assets/photos/{photos[sid]['file']}'),")
    lines += ["};", "", "/** More photos of each species, for variety across a story. */", "export const extraPhotoAssets: Record<string, number[]> = {"]
    for sid in sorted(extra):
        files = ", ".join(f"require('../../assets/photos/{e['file']}')" for e in extra[sid])
        lines.append(f"  '{sid}': [{files}],")
    lines += ["};", ""]
    open(ASSETS_TS, "w").write("\n".join(lines))


def main(only):
    species = json.load(open(SPECIES))
    photos = json.load(open(PHOTOS_JSON)) if os.path.exists(PHOTOS_JSON) else {}
    for s in species:
        sid = s["id"]
        if sid in photos and os.path.exists(os.path.join(OUT, photos[sid]["file"])) and sid not in only:
            continue
        p = pick_photo(taxon_id_for(s), SKIP_PHOTOS.get(sid, []), PIN_PHOTOS.get(sid))
        time.sleep(1.1)  # iNaturalist asks for about one request a second
        if not p:
            print(f"  ! {sid}: no CC0/CC BY/CC BY-SA photo found")
            continue
        url = p["medium_url"].replace("square", "medium")
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            img = Image.open(io.BytesIO(r.read())).convert("RGB")
        file = f"{sid}.jpg"
        square(img).save(os.path.join(OUT, file), "JPEG", quality=82, optimize=True)
        photos[sid] = {
            "file": file,
            "license": p["license_code"].upper().replace("CC-", "CC ").replace("CC0", "CC0"),
            "attribution": " ".join(p["attribution"].split()),  # tidy stray line breaks
            "source": f"https://www.inaturalist.org/photos/{p['id']}",
        }
        print(f"  {sid}: {photos[sid]['license']} {p['attribution'][:60]}")
        time.sleep(1.1)

    json.dump(dict(sorted(photos.items())), open(PHOTOS_JSON, "w"), indent=2, ensure_ascii=False)
    write_assets(photos, json.load(open(EXTRA_JSON)) if os.path.exists(EXTRA_JSON) else {})
    print(f"{len(photos)} photos")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["--extras"]:
        extras(set(args[1:]))
    else:
        main(set(args))
