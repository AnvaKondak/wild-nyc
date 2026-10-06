#!/usr/bin/env python3
"""Fetch the freely licensed recordings the ambient soundscapes are mixed from.

Recordings come from Wikimedia Commons (many are xeno-canto recordings mirrored
there). Only CC0, CC BY, CC BY-SA and public domain are used, like the photos, and
every recording keeps its credit in src/content/sounds.json (written by
build_soundscapes.py).

Decoded 22.05 kHz mono WAVs go to scripts/.sound-cache/ (not committed).
Run from the repo root:  python3 scripts/fetch_sounds.py
"""
import html, json, os, re, subprocess, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts/.sound-cache")
UA = {"User-Agent": "WildNeighbors/0.1 (bundling CC-licensed nature recordings)"}
OK_LICENSES = ("cc0", "cc by", "cc by-sa", "public domain")

# Our own neighbors, recorded in eastern North America where possible.
SOURCES = {
    "robin": "Turdus migratorius - American Robin XC174852.mp3",
    "cardinal": "Cardinalis cardinalis - Northern Cardinal XC175226.mp3",
    "song-sparrow": "Melospiza melodia - Song Sparrow XC175236.mp3",
    "mourning-dove": "Zenaida macroura - Mourning Dove XC128006.ogg",
    "blue-jay": "Cyanocitta cristata - Blue Jay XC179708.mp3",
    "crow": "Corvus brachyrhynchos - American Crow XC80525.mp3",
    "white-throat": "Zonotrichia albicollis - White-throated Sparrow XC177726.mp3",
    "red-wing": "Agelaius phoeniceus - Red-winged Blackbird XC142658.ogg",
    "gull": "Herring Gull (Larus argentatus) (W1CDR0001420 BD12).ogg",
    "insects-nj": "Orthoptera Calls - Wyckoff, New Jersey 2024-08-15.mp3",
    "katydid": "Pterophylla camellifolia singing.wav",
}


def get(url, tries=6):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1:
                raise
            time.sleep(60 * (i + 1))  # Commons asks clients to back off


def info(title):
    q = urllib.parse.urlencode({"action": "query", "titles": f"File:{title}", "prop": "imageinfo", "iiprop": "url|extmetadata", "format": "json"})
    page = next(iter(json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    meta = ii["extmetadata"]
    strip = lambda v: " ".join(html.unescape(re.sub(r"<[^>]+>", "", v or "")).split())
    return {
        "url": ii["url"],
        "page": ii["descriptionurl"],
        "license": meta.get("LicenseShortName", {}).get("value", ""),
        "artist": strip(meta.get("Artist", {}).get("value")) or credit_from(strip(meta.get("Credit", {}).get("value"))),
    }


def credit_from(text):
    """Some archive recordings leave Artist empty and name the source under Credit."""
    if "British Library" in text:
        return "The British Library"
    return text.split(".")[0][:80] or "Unknown"


def download_url(url):
    """Commons serves an MP3 copy of Ogg files, which afconvert can read."""
    if not url.endswith((".ogg", ".oga")):
        return url
    path = url.split("/wikipedia/commons/", 1)[1]
    name = path.rsplit("/", 1)[1]
    return f"https://upload.wikimedia.org/wikipedia/commons/transcoded/{path}/{name}.mp3"


def main():
    os.makedirs(CACHE, exist_ok=True)
    credits = {}
    for sid, title in SOURCES.items():
        meta = info(title)
        if not meta["license"].lower().startswith(OK_LICENSES):
            raise SystemExit(f"{sid}: license {meta['license']!r} isn't one we can ship")
        raw = os.path.join(CACHE, f"{sid}.src")
        wav = os.path.join(CACHE, f"{sid}.wav")
        if not os.path.exists(wav):
            open(raw, "wb").write(get(download_url(meta["url"])))
            subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@22050", "-c", "1", raw, wav], check=True)
            os.remove(raw)
            time.sleep(8)
        credits[sid] = {"title": title, "license": meta["license"], "artist": meta["artist"], "source": meta["page"]}
        print(f"  {sid}: {meta['license']} {meta['artist'][:50]}", flush=True)
        time.sleep(5)
    json.dump(credits, open(os.path.join(CACHE, "credits.json"), "w"), indent=2, ensure_ascii=False)
    print(f"{len(credits)} recordings")


if __name__ == "__main__":
    main()
