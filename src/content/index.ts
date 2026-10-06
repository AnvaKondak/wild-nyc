// Typed access to the bundled JSON. Screens import from here, never the JSON directly,
// so phase 3 can swap the source without touching screens.

import chaptersJson from './chapters.json';
import factsJson from './facts.json';
import hurtAnimalJson from './hurt-animal.json';
import kindnessJson from './kindness.json';
import momentsJson from './moments.json';
import { photoAssets } from './photoAssets';
import photosJson from './photos.json';
import placesJson from './places.json';
import speciesJson from './species.json';
import storiesJson from './stories.json';
import type {
  Fact,
  SeasonChapter,
  HurtAnimalGuide,
  Kindness,
  Moment,
  Place,
  PlaceKind,
  PlaceKindInfo,
  Season,
  Species,
  StorySlide,
} from './types';

export * from './types';

export const species = speciesJson as Species[];
export const stories = storiesJson as StorySlide[];
export const kindnesses = kindnessJson as Kindness[];
export const moments = momentsJson as Moment[];
export const facts = factsJson as Fact[];
export const places = placesJson.places as Place[];
export const placeKinds = placesJson.kinds as Record<PlaceKind, PlaceKindInfo>;
export const hurtAnimalGuide = hurtAnimalJson as HurtAnimalGuide;
export const seasonChapters = chaptersJson as SeasonChapter[];

const speciesById = new Map(species.map((s) => [s.id, s]));

export type PhotoCredit = { file: string; license: string; attribution: string; source: string };
const photoCredits = photosJson as Record<string, PhotoCredit>;

/** The bundled photo for a species (an image asset), if there is one. */
export function speciesPhoto(id: string): number | undefined {
  return photoAssets[id];
}

export function photoCredit(id: string): PhotoCredit | undefined {
  return photoCredits[id];
}

export function getSpecies(id: string): Species | undefined {
  return speciesById.get(id);
}

/** Species who usually live in this kind of place and are around this season.
 * Sightings-only species (deer) are left out; they join when live data has them. */
export function speciesFor(kind: PlaceKind, season: Season): Species[] {
  return species.filter((s) => s.spots[kind] !== undefined && s.seasons.includes(season) && !s.sightingsOnly);
}

export function kindnessesFor(season: Season): Kindness[] {
  return kindnesses.filter((k) => k.season === season || k.season === 'all');
}
