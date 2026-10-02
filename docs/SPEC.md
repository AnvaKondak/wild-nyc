# Wild Neighbors — v1 spec

Read `CLAUDE.md` first for principles, stack and design tokens.

## Navigation

Bottom tab bar, four tabs, in this order:

| Tab | Screen | Icon |
| --- | --- | --- |
| Right now | Story of what neighbors are doing now | sun |
| Places | Neighborhood switcher + illustrated street | house |
| Neighbors | Illustrated scene of neighbors you've met | two people |
| Kindness | Small kindnesses + hurt-animal help | heart |

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

## 3. Places (`mocks/3-places.html`)

- Title "Your *block*", neighborhood pills (same as Right now).
- A hand-drawn street illustration (buildings, bodega awning, tree, lamp post, hedge,
  curb, street). Species "spots" sit on it as round stickers: pigeons on the ledge,
  squirrels in the tree, sparrow gang in the hedge.
- Tap a spot → blue card below: friendly name, "Rock Pigeon · a kit", why they like
  that spot, "In their lives right now", and buttons **I noticed them today** and
  **How to help** (→ Kindness).
- "I noticed them today" toggles to "Noticed today". It records species + date +
  neighborhood cell only, on the phone.
- v1: one generic street illustration reused for every neighborhood is fine.

## 4. Neighbors you've met (`mocks/4-neighbors.html`)

Replaces a sticker book. One big illustrated riso scene of a neighborhood.

- Header: "9 of 40 have moved in", title "Neighbors *you've met*".
- The scene: building with ledges, wire, tree, hedge, flower box, trash can, sky, street.
- **Met** species appear as stickers in their natural spot (pigeons on the ledge,
  starlings and mourning doves on the wire, squirrels in the tree, sparrows in the hedge,
  robins on the sidewalk, gulls in the sky, monarchs at the flower box, raccoons in the
  trash can).
- **Not met** species show as faint dashed outlines in their spot.
- Tap any → card. Met: "Your neighbor", name, collective noun, "Moved in Sept 12" + where
  they live, **Visit their page**. Not met: "Waiting to move in" + a hint on how to find them.
- **Share your neighborhood** exports the scene as an image.
- A species "moves in" the first time the user taps "I noticed them" for it.

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
