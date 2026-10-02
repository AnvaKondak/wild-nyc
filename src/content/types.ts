// Content model from docs/SPEC.md, plus a few fields the screens need
// (icon, tint, home). All content is bundled JSON in phase 2.

import type { AnimalIconName } from '@/components/AnimalIcon';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Period = 'dawn' | 'midday' | 'dusk' | 'night';

/** What kind of place a neighborhood is. Picks its species and its {where}. */
export type PlaceKind = 'block' | 'park' | 'waterfront';

export type SceneSpot =
  | 'ledge'
  | 'wire'
  | 'sky'
  | 'tree'
  | 'hedge'
  | 'sidewalk'
  | 'flowerbox'
  | 'trashcan'
  | 'rooftop'
  | 'fence'
  | 'lamp';

export type TintName = 'pinkTint' | 'yellowTint' | 'blueTint' | 'yellow' | 'pink';

export type Species = {
  id: string;
  friendlyName: string;
  commonName: string;
  scientificName: string;
  collectiveNoun: string;
  group: 'birds' | 'furry' | 'bugs';
  icon: AnimalIconName;
  tint: TintName;
  personality: { type: string; traits: string[]; blurb: string };
  origin: string;
  /** Where they live on the block and why they like it. */
  home: string;
  rightNow: Record<Season, string>;
  funFact: { title: string; body: string };
  kindness: { title: string; body: string };
  sceneSpot: SceneSpot;
  /** How to find them if not met yet. */
  spotHint: string;
  /** When they're around. */
  seasons: Season[];
  iNatTaxonId?: number;
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
  /** Only show in these kinds of places. Omit for everywhere. */
  places?: PlaceKind[];
  /** Button label override. Defaults to "Meet the {friendlyName}". */
  cta?: string;
  /** Button goes to Kindness instead of the species profile. */
  link?: 'kindness';
};

export type Kindness = {
  id: string;
  season: Season | 'all';
  who: string;
  title: string;
  why: string;
};

export type Place = {
  id: string;
  name: string;
  city: 'NYC' | 'Jersey City';
  kind: PlaceKind;
  /** Rough center, used only to name a cell and to compute sun times. */
  lat: number;
  lng: number;
};

export type PlaceKindInfo = {
  where: string;
  species: string[];
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
