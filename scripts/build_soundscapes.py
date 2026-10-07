#!/usr/bin/env python3
"""Mix the ambient soundscapes: a gentle, seamless loop for each kind of place.

By the water: water lapping, a gull now and then. In the park: crickets and birdsong.
On the block: a calm street with the odd car rolling by, and birds. When it rains:
rain. Each loop is a bed (synthesized water, traffic or rain, or a recorded insect
chorus) with real bird recordings placed on top at seeded random times. Stereo: beds
are wide, and each call comes from somewhere left to right. Recordings come from
scripts/fetch_sounds.py; everything else is made here.

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


def water(rnd):
    """Water lapping at a pier: low sloshes that rise and fall, a soft slap at each wave's top."""
    n = len(silence())
    body = lowpass(brown(rnd, n), 420)
    fizz = lowpass(highpass(white(rnd, n), 900), 3000)
    p1, p2 = rnd.uniform(2.6, 3.4), rnd.uniform(4.5, 6.0)
    out = []
    for i in range(n):
        t = i / SR
        wave_ = 0.5 + 0.5 * math.sin(2 * math.pi * t / p1)
        swell = 0.5 + 0.5 * math.sin(2 * math.pi * t / p2 + 0.7)
        out.append(body[i] * (0.4 + 0.6 * swell) + fizz[i] * wave_ ** 3 * 0.5)
    return normalize(out)


def traffic(rnd):
    """A calm street: a low hum, and every so often a car rolling softly by."""
    n = len(silence())
    out = [x * 0.35 for x in lowpass(brown(rnd, n), 160)]
    t = rnd.uniform(0, 3)
    while t < LOOP + XFADE:
        m, at = int(rnd.uniform(3.5, 5.5) * SR), int(t * SR)
        tire = lowpass(highpass(white(rnd, m), 200), 900)
        rumble = lowpass(brown(rnd, m), 220)
        g = rnd.uniform(0.35, 0.7)
        for k in range(m):
            if at + k >= n:
                break
            env = math.sin(math.pi * k / m) ** 2  # louder as it nears, softer as it goes
            out[at + k] += g * env * (tire[k] * 0.6 + rumble[k] * 0.8)
        t += rnd.uniform(5, 9)
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


# ---------------------------------------------------------------- stereo

class Stereo:
    """Left and right channels. Beds are rendered twice (different noise each side) and
    blended, so wind and rain feel wide; each call is placed somewhere left to right."""

    def __init__(self):
        self.l, self.r = silence(), silence()

    def bed(self, make, rnd, gain):
        a, b = make(rnd), make(rnd)
        add(self.l, a, gain=gain * 0.75)
        add(self.l, b, gain=gain * 0.25)
        add(self.r, a, gain=gain * 0.25)
        add(self.r, b, gain=gain * 0.75)

    def place(self, seg, at, gain, pan):
        """pan: -1 (left) … 1 (right), with constant power across the field."""
        angle = (pan + 1) * math.pi / 4
        add(self.l, seg, at, gain * math.cos(angle))
        add(self.r, seg, at, gain * math.sin(angle))


def scatter(dst, rnd, sources, every, gain=1.0):
    """Place calls from these sources at random times and places, about one per `every` seconds."""
    pool = {name: calls(name) for name in sources}
    t = rnd.uniform(0, every)
    while t < LOOP:
        name = rnd.choice(sources)
        seg = rnd.choice(pool[name])
        dst.place(seg, int(t * SR), gain * rnd.uniform(0.35, 1.0), rnd.uniform(-0.85, 0.85))
        t += rnd.expovariate(1 / every)


# ---------------------------------------------------------------- soundscapes

def mix(name, rnd):
    out = Stereo()
    bed = lambda make, gain: out.bed(make, rnd, gain)
    birds = lambda srcs, every, g=0.5: scatter(out, rnd, srcs, every, g)
    if name == "waterfront":
        bed(water, 0.45)
        bed(hum, 0.03)
        birds(["gull", "gull", "song-sparrow", "red-wing"], 5.0, 0.45)
    elif name == "park":
        bed(lambda r: bed_from("insects-nj", r), 0.3)
        birds(["robin", "cardinal", "song-sparrow", "blue-jay", "mourning-dove"], 3.0)
    elif name == "block":
        bed(traffic, 0.3)
        birds(["cardinal", "mourning-dove", "robin", "song-sparrow"], 4.5, 0.45)
    elif name == "rain":
        bed(rain, 0.5)
        bed(hum, 0.04)
    else:
        raise ValueError(name)
    return out


# Which recordings each loop uses, for credits.
USES = {
    "waterfront": ["gull", "song-sparrow", "red-wing"],
    "park": ["insects-nj", "robin", "cardinal", "song-sparrow", "blue-jay", "mourning-dove"],
    "block": ["cardinal", "mourning-dove", "robin", "song-sparrow"],
    "rain": [],
}


def fold(st):
    """Crossfade the tail over the head so the loop plays forever without a click."""
    n, x = LOOP * SR, XFADE * SR

    def one(xs):
        out = xs[:n]
        for i in range(x):
            # Equal-power, so noisy beds (rain, wind) don't dip in the middle of the fade.
            g = math.pi / 2 * i / x
            out[i] = out[i] * math.sin(g) + xs[n + i] * math.cos(g)
        return out

    st.l, st.r = one(st.l), one(st.r)
    return st


def write(name, st):
    os.makedirs(OUT, exist_ok=True)
    peak = max(1e-9, max(abs(x) for x in st.l), max(abs(x) for x in st.r))
    k = 0.7 / peak
    pcm = array.array("h", (int(max(-1, min(1, x * k)) * 32767) for pair in zip(st.l, st.r) for x in pair))
    tmp = os.path.join(CACHE, f"{name}.mix.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "96000", tmp, os.path.join(OUT, f"{name}.m4a")], check=True)
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
