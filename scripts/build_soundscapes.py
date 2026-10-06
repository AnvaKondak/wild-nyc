#!/usr/bin/env python3
"""Mix the ambient soundscapes: seamless loops of what you'd hear on the block now.

Each loop is a bed (synthesized wind, rain, waves or distant city hum, or a recorded
insect chorus) with real recordings of our neighbors placed on top at seeded random
times: the dawn chorus in spring, crickets on summer nights, wind and a crow in
winter. Recordings come from scripts/fetch_sounds.py; everything else is made here.

Plain Python (no numpy), so it's slow-ish but has no dependencies. Encodes AAC with
macOS afconvert and writes src/content/sounds.json (which loop uses which credits)
and src/content/soundAssets.ts.

Run from the repo root:  python3 scripts/build_soundscapes.py
"""
import array, json, math, os, random, subprocess, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts/.sound-cache")
OUT = os.path.join(ROOT, "assets/sounds")
SR = 22050
LOOP = 36  # seconds
XFADE = 3  # seconds folded from the end over the start, so the loop has no seam


# ---------------------------------------------------------------- basics

def silence(seconds=LOOP + XFADE):
    return [0.0] * int(seconds * SR)


def read(name):
    """16-bit mono PCM from a WAV afconvert wrote. Reads the data chunk directly,
    because afconvert writes the "extensible" header Python's wave module rejects."""
    raw = open(os.path.join(CACHE, f"{name}.wav"), "rb").read()
    i = 12
    while raw[i:i + 4] != b"data":
        i += 8 + int.from_bytes(raw[i + 4:i + 8], "little")
    size = int.from_bytes(raw[i + 4:i + 8], "little")
    a = array.array("h", raw[i + 8:i + 8 + size - size % 2])
    peak = max(1, max(abs(x) for x in a))
    return [x / peak for x in a]


def add(dst, src, at=0, gain=1.0):
    for i, x in enumerate(src):
        j = at + i
        if j >= len(dst):
            break
        dst[j] += x * gain


def lowpass(xs, cutoff):
    a = 1 - math.exp(-2 * math.pi * cutoff / SR)
    y, out = 0.0, []
    for x in xs:
        y += a * (x - y)
        out.append(y)
    return out


def highpass(xs, cutoff):
    lp = lowpass(xs, cutoff)
    return [x - l for x, l in zip(xs, lp)]


def normalize(xs, peak=1.0):
    m = max(1e-9, max(abs(x) for x in xs))
    return [x * peak / m for x in xs]


def white(rnd, n):
    return [rnd.uniform(-1, 1) for _ in range(n)]


def brown(rnd, n):
    x, out = 0.0, []
    for _ in range(n):
        x = (x + rnd.uniform(-1, 1) * 0.02) * 0.998
        out.append(x)
    return normalize(out)


def fade(xs, ms=40, smooth=False):
    """Fade the ends. `smooth` uses an equal-power curve, for overlapping noisy tiles."""
    n = min(len(xs) // 2, int(SR * ms / 1000))
    out = list(xs)
    for i in range(n):
        g = math.sin(math.pi / 2 * i / n) if smooth else i / n
        out[i] *= g
        out[-1 - i] *= g
    return out


# ---------------------------------------------------------------- beds

def hum(rnd):
    """Distant city: a low, soft rumble."""
    return normalize(lowpass(brown(rnd, len(silence())), 180))


def wind(rnd, strength=1.0):
    """Gusts through bare branches: rumble plus an airy whoosh that swells and falls."""
    n = len(silence())
    body = lowpass(brown(rnd, n), 300)
    air = lowpass(highpass(white(rnd, n), 350), 1400)
    p1, p2 = rnd.uniform(5, 8), rnd.uniform(11, 17)
    out = []
    for i in range(n):
        t = i / SR
        gust = 0.35 + 0.4 * (0.5 + 0.5 * math.sin(2 * math.pi * t / p1)) + 0.25 * (0.5 + 0.5 * math.sin(2 * math.pi * t / p2 + 1.3))
        out.append(body[i] * 0.6 + air[i] * gust * strength * 1.4)
    return normalize(out)


def rain(rnd):
    """A steady hiss with drops pattering on leaves and sidewalks."""
    n = len(silence())
    hiss = lowpass(highpass(white(rnd, n), 800), 5000)
    body = lowpass(white(rnd, n), 600)
    out = [h * 0.5 + b * 0.5 for h, b in zip(hiss, body)]
    for _ in range(int(LOOP * 60)):  # about 60 drops a second
        at = rnd.randrange(n - 600)
        f, g = rnd.uniform(1500, 4500), rnd.uniform(0.05, 0.25)
        for k in range(400):
            out[at + k] += g * math.sin(2 * math.pi * f * k / SR) * math.exp(-k / 60)
    return normalize(out)


def waves(rnd):
    """Water slapping the pilings and sliding up the shore, in slow swells."""
    n = len(silence())
    wash = lowpass(brown(rnd, n), 900)
    fizz = lowpass(highpass(white(rnd, n), 1500), 4000)
    out = [0.0] * n
    t = 0.0
    while t < LOOP + XFADE:
        period = rnd.uniform(5, 9)
        start, length = int(t * SR), int(period * SR)
        for k in range(length):
            i = start + k
            if i >= n:
                break
            e = math.sin(math.pi * k / length) ** 2
            out[i] += wash[i] * e + fizz[i] * e ** 3 * 0.35
        t += period * rnd.uniform(0.6, 0.85)  # swells overlap a little
    return normalize(out)


def bed_from(name, rnd):
    """A recorded chorus (insects) tiled to the loop length with soft joins."""
    src = read(name)
    n = len(silence())
    out = [0.0] * n
    seg = int(min(len(src), 12 * SR))
    at = 0
    while at < n:
        start = rnd.randrange(max(1, len(src) - seg))
        add(out, fade(src[start:start + seg], 1500, smooth=True), at)
        at += seg - int(1.5 * SR)
    return normalize(out)


# ---------------------------------------------------------------- calls

def calls(name):
    """Split a recording into individual songs and calls: stretches louder than the
    background, merged across short gaps, 0.3 to 4 seconds long."""
    src = read(name)
    win = int(0.05 * SR)
    rms = [math.sqrt(sum(x * x for x in src[i:i + win]) / win) for i in range(0, len(src) - win, win)]
    floor = sorted(rms)[len(rms) // 4]
    # Loud enough to be a call: well above the background, or for soft singers (a dove's
    # coo) a good way up from the background toward their loudest.
    threshold = min(floor * 3.5, floor + 0.3 * (max(rms) - floor))
    loud = [r > threshold for r in rms]
    segs, start, quiet = [], None, 0
    for k, on in enumerate(loud + [False] * 10):
        if on:
            start = k if start is None else start
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet > 8:  # 0.4 s of quiet ends a call
                end = k - quiet + 1
                # Long songs (a robin can go on and on) become 4-second phrases.
                for s0 in range(start, end, 80):
                    s1 = min(end, s0 + 80)
                    if s1 - s0 >= 6:
                        a, b = max(0, (s0 - 2) * win), min(len(src), (s1 + 2) * win)
                        segs.append(fade(highpass(src[a:b], 250), 120))
                start = None
    return segs or [fade(src[: 4 * SR])]


def scatter(dst, rnd, sources, every, gain=1.0):
    """Place calls from these sources at random, about one per `every` seconds."""
    pool = {name: calls(name) for name in sources}
    t = rnd.uniform(0, every)
    while t < LOOP:
        name = rnd.choice(sources)
        seg = rnd.choice(pool[name])
        add(dst, seg, int(t * SR), gain * rnd.uniform(0.35, 1.0))
        t += rnd.expovariate(1 / every)


# ---------------------------------------------------------------- soundscapes

def mix(name, rnd):
    out = silence()
    birds = lambda srcs, every, g=0.5: scatter(out, rnd, srcs, every, g)
    if name == "dawn-chorus":
        add(out, hum(rnd), gain=0.05)
        birds(["robin", "robin", "cardinal", "song-sparrow", "mourning-dove", "red-wing"], 1.1, 0.55)
    elif name == "day-birds":
        add(out, hum(rnd), gain=0.08)
        birds(["cardinal", "song-sparrow", "blue-jay", "mourning-dove", "crow", "robin"], 3.2)
    elif name == "dusk-birds":
        add(out, hum(rnd), gain=0.07)
        birds(["robin", "robin", "song-sparrow", "cardinal"], 2.8)
    elif name == "summer-dusk":
        add(out, bed_from("insects-nj", rnd), gain=0.3)
        add(out, hum(rnd), gain=0.05)
        birds(["robin", "cardinal"], 4.5, 0.4)
    elif name == "summer-night":
        add(out, bed_from("insects-nj", rnd), gain=0.55)
        add(out, bed_from("katydid", rnd), gain=0.18)
        add(out, hum(rnd), gain=0.04)
    elif name == "fall-day":
        add(out, hum(rnd), gain=0.08)
        birds(["blue-jay", "crow", "white-throat", "song-sparrow", "blue-jay"], 3.6)
    elif name == "fall-dusk":
        add(out, bed_from("insects-nj", rnd), gain=0.12)
        add(out, hum(rnd), gain=0.07)
        birds(["crow", "crow", "white-throat"], 3.8)
    elif name == "fall-night":
        add(out, bed_from("insects-nj", rnd), gain=0.25)
        add(out, hum(rnd), gain=0.06)
    elif name == "winter-day":
        add(out, wind(rnd, 0.6), gain=0.1)
        add(out, hum(rnd), gain=0.05)
        birds(["crow", "blue-jay", "white-throat"], 4.0, 0.7)
    elif name == "quiet-night":
        add(out, hum(rnd), gain=0.09)
        add(out, wind(rnd, 0.4), gain=0.06)
    elif name == "harbor":
        add(out, waves(rnd), gain=0.45)
        add(out, hum(rnd), gain=0.04)
        birds(["gull"], 4.0, 0.7)
    elif name == "harbor-night":
        add(out, waves(rnd), gain=0.4)
        add(out, hum(rnd), gain=0.06)
    elif name == "rain":
        add(out, rain(rnd), gain=0.5)
        add(out, hum(rnd), gain=0.05)
    elif name == "wind":
        add(out, wind(rnd, 1.0), gain=0.6)
    elif name == "snow":
        # Snow hushes the city: a soft breath of wind and almost nothing else.
        add(out, lowpass(wind(rnd, 0.3), 700), gain=0.25)
        add(out, hum(rnd), gain=0.03)
    else:
        raise ValueError(name)
    return out


# Which recordings each loop uses, for credits.
USES = {
    "dawn-chorus": ["robin", "cardinal", "song-sparrow", "mourning-dove", "red-wing"],
    "day-birds": ["cardinal", "song-sparrow", "blue-jay", "mourning-dove", "crow", "robin"],
    "dusk-birds": ["robin", "song-sparrow", "cardinal"],
    "summer-dusk": ["insects-nj", "robin", "cardinal"],
    "summer-night": ["insects-nj", "katydid"],
    "fall-day": ["blue-jay", "crow", "white-throat", "song-sparrow"],
    "fall-dusk": ["insects-nj", "crow", "white-throat"],
    "fall-night": ["insects-nj"],
    "winter-day": ["crow", "blue-jay", "white-throat"],
    "quiet-night": [],
    "harbor": ["gull"],
    "harbor-night": [],
    "rain": [],
    "wind": [],
    "snow": [],
}


def fold(xs):
    """Crossfade the tail over the head so the loop plays forever without a click."""
    n, x = LOOP * SR, XFADE * SR
    out = xs[:n]
    for i in range(x):
        # Equal-power, so noisy beds (rain, wind) don't dip in the middle of the fade.
        g = math.pi / 2 * i / x
        out[i] = out[i] * math.sin(g) + xs[n + i] * math.cos(g)
    return out


def write(name, xs):
    os.makedirs(OUT, exist_ok=True)
    pcm = array.array("h", (int(max(-1, min(1, x)) * 32767) for x in normalize(xs, 0.7)))
    tmp = os.path.join(CACHE, f"{name}.mix.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "48000", tmp, os.path.join(OUT, f"{name}.m4a")], check=True)
    os.remove(tmp)


def main():
    credits = json.load(open(os.path.join(CACHE, "credits.json")))
    for name in USES:
        write(name, fold(mix(name, random.Random(name))))
        print(f"  {name}", flush=True)
    used = sorted({r for rs in USES.values() for r in rs})
    json.dump(
        {"loops": USES, "recordings": {r: credits[r] for r in used}},
        open(os.path.join(ROOT, "src/content/sounds.json"), "w"),
        indent=2,
        ensure_ascii=False,
    )
    lines = ["// Generated by scripts/build_soundscapes.py. Do not edit by hand.", "", "export const soundAssets: Record<string, number> = {"]
    lines += [f"  '{name}': require('../../assets/sounds/{name}.m4a')," for name in USES]
    lines += ["};", ""]
    open(os.path.join(ROOT, "src/content/soundAssets.ts"), "w").write("\n".join(lines))
    print(f"{len(USES)} loops")


if __name__ == "__main__":
    main()
