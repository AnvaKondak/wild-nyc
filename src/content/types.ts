// Content model from docs/SPEC.md, plus a few fields the screens need
// (icon, tint, home). All content is bundled JSON in phase 2.

import type { ArtSpec } from '@/components/art/CritterArt';

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
};

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
  kind?: 'scene' | 'arriving' | 'goodbye';
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
};

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
};

export type PlaceKindInfo = {
  where: string;
  /** Gentle generic stand-ins for unnamed spots. */
  local: LocalNames;
};

export type RehabContact = {
  name: string;
  area: string;
  /** null until confirmed. */
  phone: string | null;
  note: string;
};

export type HurtAnimalGuide = {
  intro: string;
  steps: { title: string; body: string }[];
  rehabs: RehabContact[];
};
