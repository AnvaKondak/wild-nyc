# Wild Neighbors — v1 spec

Read `CLAUDE.md` first for principles, stack and design tokens.

## Navigation

Bottom tab bar, three tabs, in this order:

| Tab | Screen | Icon |
| --- | --- | --- |
| Right now | Story of what neighbors are doing now, in this weather | sun |
| Chapters | Each season's story: overview, neighbors together, comings and goings | open book |
| Kindness | Small kindnesses + hurt-animal help | heart |

(Places and Neighbors were removed in October 2026; Chapters replaced them.)

Welcome shows once, before the tabs. The neighbor profile is pushed from any screen that
shows a species.

## 1. Welcome (`mocks/1-welcome.html`)

- Wordmark "Wild *Neighbors*" top left, current street pill top right.
- Four tilted animal stickers in a loose cluster.
- Headline: "6 neighbors share *your street*" (count comes from the neighborhood's species).
- Body: "Pigeons on the ledges, sparrows in the hedge, squirrels in the tree. Come meet them."
- Primary button: **Meet the neighbors** → Right now.
- Footer line in italic: "We notice. We don't follow."
- No signup. Ask for location permission here, with a "pick a neighborhood instead" fallback.

## 2. Right now (`mocks/2-right-now.html`)

A tap-through story, like Instagram stories.

- **Progress bars** across the top, one per slide.
- **Neighborhood pills** below them (e.g. Home, Work, Prospect Park) plus a dashed "+".
  Switching neighborhood restarts the story with that place's slides.
- **Time-of-day header:** icon, "Dawn · 6:51a", and a sub-line ("Sunrise in 12 minutes").
- **Big sticker** of the animal, tap to advance.
- **Kicker** (Listen / Right now / Look up / Overhead / Fall chapter), **title**, **body**.
- Bottom: back arrow, primary button (e.g. "Meet the pigeons" → profile), next arrow.
- Swipe left/right also works.

**Time of day** is computed on the phone from sunrise and sunset for the user's location:

| Period | When | Theme |
| --- | --- | --- |
| Dawn | about 1h before to 2h after sunrise | pink-tint |
| Midday | until about 1h before sunset | yellow-tint |
| Dusk | about 1h before to 1h after sunset | blue, white text |
| Night | the rest | ink, paper text |

Use a sun-calculation library (e.g. `suncalc`). Also show moon phase at night.

**Slides** come from bundled content for (season × period). Each set ends with two
seasonal-chapter slides: one **Arriving** (yellow) and one **Goodbye** (pink).
A `{where}` placeholder in slide text is replaced per neighborhood ("on your block",
"in the park").

Example fall content is in the mock's `S` object. Reuse it as the first content set.

## 3. Chapters

Chapters are told for the whole region, not one neighborhood: NYC & Jersey City share
one harbor, one estuary and one stop on the Atlantic Flyway, and the same neighbors arrive
and leave within days of each other. (Right now is the neighborhood view.) The region is
content (`src/content/region.json`), so each future city pack brings its own.

- A story, like Right now: one slide per screen, arrows and swipes, progress bars.
- Season pills (the current one marked "now"), then the region's name.
- Each season has its own light and animated scene: spring dawn, summer midday, fall dusk,
  winter night. The overview stands on the waterfront; each story is drawn where most of
  its neighbors live.
- Slides: the season's overview ("The great getting-ready"), the stories of neighbors
  together (two to four species, photos clustered, a **Meet the …** link each), then
  who's arriving and who's leaving.
- Content: `src/content/chapters.json`, journeys from `stories.json`.

## 4. (removed)

## 5. Neighbor profile (`mocks/5-neighbor-profile.html`)

Where the facts live.

- Big sticker on a tinted header, back button.
- Friendly name large ("Pigeons"), real name small ("Rock Pigeon · *Columba livia*"),
  collective noun chip ("a kit of pigeons").
- **Personality type** card: name ("The Loyal Homebody"), three trait chips, a short paragraph.
- **Where they came from.**
- **In their lives right now** (current season).
- **A fun fact** card.
- **A small kindness** card (pink) → Kindness.
- **I noticed [them] today** button.
- Later: seasonal chapters (four pages, one per season) and "Which sparrow?" lookalike cards
  for groups with several species.

## 6. Small kindnesses (`mocks/6-kindness.html`)

- Title "Small *kindnesses*", one-line intro.
- **Found a hurt animal?** pink button at the top → a step-by-step screen: what to do right
  now (box, dark, quiet, no food or water), then nearest wildlife rehab for NYC and NJ with
  phone numbers. (Content to be written; leave placeholders.)
- "This season" counter: "1 of 6".
- Six kindness cards, each with who it helps, a title, why, and a round check button.
  Fall set: Leave the leaves · Lights out on big nights · Check pigeons' feet for string ·
  Skip the bread · Say no to rat poison · Pause before rescuing a fledgling.
- Checks are stored on the phone and reset each season.

## Content model (bundled JSON for phase 2)

```ts
type Season = 'spring' | 'summer' | 'fall' | 'winter';
type Period = 'dawn' | 'midday' | 'dusk' | 'night';

type Species = {
  id: string;                 // 'rock-pigeon'
  friendlyName: string;       // 'Pigeons'
  commonName: string;         // 'Rock Pigeon'
  scientificName: string;     // 'Columba livia'
  collectiveNoun: string;     // 'a kit'
  group: 'birds' | 'furry' | 'bugs';
  personality: { type: string; traits: string[]; blurb: string };
  origin: string;
  rightNow: Record<Season, string>;
  funFact: { title: string; body: string };
  kindness: { title: string; body: string };
  sceneSpot: string;          // 'ledge' | 'wire' | 'tree' | 'hedge' | ...
  spotHint: string;           // how to find them if not met yet
  seasons: Season[];          // when they're around
  iNatTaxonId?: number;       // for phase 3
};

type StorySlide = {
  season: Season;
  period: Period;
  kicker: string;
  title: string;
  body: string;               // may contain {where}
  speciesId?: string;
  kind?: 'scene' | 'arriving' | 'goodbye';
};

type Kindness = {
  id: string; season: Season | 'all'; who: string; title: string; why: string;
};
```

On-device state: `noticed: { speciesId, date, cell }[]`, `neighborhoods: { id, name, cell }[]`,
`kindnessDone: Record<string, boolean>` per season.

## Out of scope for v1

Shared "people noticed" counts, news, a real map, photo uploads, accounts,
migration forecasts, Wrapped-style recaps.
