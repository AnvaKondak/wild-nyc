// Content model from docs/SPEC.md, plus a few fields the screens need
// (icon, tint, home). All content is bundled JSON in phase 2.

import type { ArtSpec } from '@/components/art/CritterArt';
import type { WeatherTag } from '@/lib/weather';

export type { WeatherTag };

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Period = 'dawn' | 'midday' | 'dusk' | 'night';

/** What kind of place a neighborhood is. Picks its species and its {where}. */
export type PlaceKind = 'block' | 'park' | 'waterfront';

/** Spots in the block scene. */
export type BlockSpot = 'sky' | 'rooftop' | 'ledge' | 'wire' | 'lamp' | 'tree' | 'flowerbox' | 'trashcan' | 'hedge' | 'fence' | 'sidewalk';
/** Spots in the park scene. */
export type ParkSpot = 'sky' | 'treetop' | 'trunk' | 'shrubs' | 'lawn' | 'path' | 'bench' | 'flowers' | 'pond' | 'reeds' | 'log' | 'lamp';
/** Spots in the waterfront scene. */
export type WaterfrontSpot = 'sky' | 'lamp' | 'railing' | 'pier' | 'piling' | 'water' | 'shore' | 'rocks' | 'grass';

export type SceneSpot = BlockSpot | ParkSpot | WaterfrontSpot;

/** Where a species shows up in each kind of place. Having an entry means they live there. */
export type Spots = { block?: BlockSpot; park?: ParkSpot; waterfront?: WaterfrontSpot };

/** Backdrop drawn behind the animal on a story sticker. */
export type Setting =
  | 'branch' | 'trunk' | 'wire' | 'ledge' | 'rooftop' | 'streetlight' | 'lawn' | 'sidewalk' | 'hedge'
  | 'flowers' | 'water' | 'shore' | 'pier' | 'sky' | 'night-sky' | 'web' | 'trashcan' | 'fence' | 'reeds' | 'den';

export type TintName = 'pinkTint' | 'yellowTint' | 'blueTint' | 'yellow' | 'pink';

export type Species = {
  id: string;
  friendlyName: string;
  commonName: string;
  scientificName: string;
  collectiveNoun: string;
  group: 'birds' | 'furry' | 'bugs';
  /** Placeholder art: body type + colors (see components/art). */
  art: ArtSpec;
  tint: TintName;
  personality: { type: string; traits: string[]; blurb: string };
  origin: string;
  /** Where they live on the block and why they like it. */
  home: string;
  rightNow: Record<Season, string>;
  funFact: { title: string; body: string };
  kindness: { title: string; body: string };
  /** Which scene they live in on the Neighbors screen. */
  homeScene: PlaceKind;
  /** Where they appear in each scene; also which kinds of places they live in. */
  spots: Spots;
  /** How to find them if not met yet. */
  spotHint: string;
  /** When they're around. */
  seasons: Season[];
  /** iNaturalist taxon to count. For a group (moths) it's the parent taxon… */
  iNatTaxonId: number;
  /** …minus this one (butterflies), when set. */
  iNatExcludeTaxonId?: number;
  /** eBird species code, for birds. */
  ebirdCode?: string;
  /**
   * Rare enough that we only feature them where live data says they've been seen
   * nearby (deer: Staten Island, the Bronx, some waterfront parks), never by default.
   */
  sightingsOnly?: boolean;
  /** Only live in these bundled places (deer: St. George, on Staten Island). */
  onlyAt?: string[];
  /** Up at night, asleep by day (raccoons, opossums, moths). For the story's intro. */
  nocturnal?: boolean;
  /** Migrants: when they usually arrive in NYC, "MM-DD". The weeks after are "just arrived". */
  arrives?: string;
  /** How they feel about us: what's known about how they see and treat people. */
  withPeople: string;
};

/** Family life: how the young grow up, how they get on with their own kind, and what that looks like each season. */
export type Family = {
  young: string;
  social: string;
  seasons: Record<Season, { title: string; body: string }>;
};

export type Mood = 'hello' | 'snack' | 'happy' | 'sleepy';

export type StorySlide = {
  id: string;
  season: Season;
  /** Chapter slides (arriving/goodbye) use 'any': they show at every time of day. */
  period: Period | 'any';
  kicker: string;
  title: string;
  /** May contain {where}. */
  body: string;
  speciesId?: string;
  kind?: 'intro' | 'scene' | 'arriving' | 'goodbye' | 'around' | 'tomorrow' | 'event';
  /** Backdrop for the sticker (moments set this). */
  setting?: Setting;
  /** A fun fact about the species, fitting the season and time of day. */
  fact?: string;
  /** Only show in these kinds of places. Omit for everywhere. */
  places?: PlaceKind[];
  /** Button label override. Defaults to "Meet the {friendlyName}". */
  cta?: string;
  /** Button goes to Kindness instead of the species profile. */
  link?: 'kindness';
  /** "Also around today": the lead first, then others to tap into. */
  aroundSpecies?: string[];
  /** Of those, who just arrived for the season. */
  arrivedSpecies?: string[];
  /** Which of the species' photos to show, so a story doesn't repeat one picture. */
  photoIndex?: number;
  /** Which drawing of the animal fits what the slide says: sleeping, eating, delighted or just saying hello. */
  mood?: Mood;
  /** Two or more neighbors in one moment (an encounter): shown together in the sticker. */
  cast?: string[];
  /** A neighbor who appears in the scene behind this slide (flying past, perched nearby). */
  cameo?: string;
  /** Intro: who's up, for the little group photo. */
  introSpecies?: string[];
  /** Chapters: a line added when the weather fits ("On a north wind like tonight's…"). */
  weatherNote?: Partial<Record<WeatherTag, string>>;
};

/**
 * Something a species is doing at a season and time of day: an action, not a fact.
 * Several variants, so the same moment doesn't read the same every day.
 * Bodies may use {place}: "near Liberty State Park", or "on your block".
 */
export type Moment = {
  id: string;
  speciesId: string;
  seasons: Season[];
  periods: Period[];
  setting: Setting;
  kicker: string;
  variants: { title: string; body: string }[];
  /** Only in this weather (rain on feathers, snow on the hedge). Omit for any day. */
  weather?: WeatherTag[];
};

/** A region the app covers, told as one place in Chapters (NYC & Jersey City). */
export type Region = { id: string; name: string; where: string; about: string };

/** The Chapters tab: one per season, a short overview and stories of neighbors together. */
export type SeasonChapter = {
  season: Season;
  /** "The great getting-ready" */
  name: string;
  intro: string;
  stories: { id: string; title: string; species: string[]; body: string }[];
};

/** Two neighbors crossing paths: who chases, warns, shares or steals from whom. */
export type Encounter = { id: string; species: [string, string]; seasons: Season[]; periods?: Period[]; title: string; body: string };

/** A fun fact for the story, optionally only in some seasons or times of day. */
export type Fact = { speciesId: string; text: string; seasons?: Season[]; periods?: Period[] };

export type Kindness = {
  id: string;
  season: Season | 'all';
  who: string;
  title: string;
  why: string;
};

/** Real spots in a neighborhood that story lines can name: {green}, {water}, {landmark},
 * {street}. Several per kind, so lines vary; each placeholder picks one at random. */
export type LocalNames = { green: string[]; water: string[]; landmark: string[]; street: string[] };

export type Place = {
  id: string;
  name: string;
  city: 'NYC' | 'Jersey City';
  kind: PlaceKind;
  /** Rough center, used only to name a cell and to compute sun times. */
  lat: number;
  lng: number;
  local: LocalNames;
  /**
   * How it looks and sounds, when that differs from who lives there. Liberty State
   * Park's neighbors are waterfront birds, but walking its wooded trails feels like a park.
   */
  scene?: PlaceKind;
};

export type PlaceKindInfo = {
  where: string;
  /** Gentle generic stand-ins for unnamed spots. */
  local: LocalNames;
};

export type RehabContact = {
  name: string;
  area: string;
  /** null when there's no single number (a directory). */
  phone: string | null;
  /** Their own page, where the details were checked. */
  url?: string;
  note: string;
};

export type HurtAnimalGuide = {
  intro: string;
  /** When and how the contacts were last checked. */
  checked: string;
  steps: { title: string; body: string }[];
  rehabs: RehabContact[];
};
