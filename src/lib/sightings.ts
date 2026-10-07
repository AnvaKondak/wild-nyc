// Who really lives near a named neighborhood, from the sightings snapshot
// (scripts/build_sightings.py): iNaturalist records within a short radius, by season.
// A handful of records counts as "lives here"; one stray sighting doesn't.

import type { Season, Species } from '@/content/types';

/** Records per species, by place and season. */
export type Sightings = Record<string, Record<Season, Record<string, number>>>;

/** Records needed to call someone a neighbor here. Bugs are under-recorded, so they need fewer. */
export const SEEN_ENOUGH = 3;
const BUGS_SEEN_ENOUGH = 2;
/**
 * Animals rare in the city (deer) also need a steady record all year, so a park next
 * door can't spill them into a neighborhood: Liberty State Park's deer turn up a few
 * times a year in Downtown JC's circle, but they don't live there.
 */
const RARE_YEAR = 15;

/** When a place has fewer recorded neighbors than this in a season, its kind fills in. */
export const THIN = 10;

const enough = (s: Species, count: number | undefined) => (count ?? 0) >= (s.group === 'bugs' ? BUGS_SEEN_ENOUGH : SEEN_ENOUGH);
const steady = (s: Species, place: Record<Season, Record<string, number>>) =>
  !s.sightingsOnly || Object.values(place).reduce((sum, bySpecies) => sum + (bySpecies[s.id] ?? 0), 0) >= RARE_YEAR;

/** Recorded often enough near this place in this season? `undefined` when there's no data for the place. */
export function recordedHere(s: Species, sightings: Sightings | undefined, placeId: string | undefined, season: Season): boolean | undefined {
  const place = placeId ? sightings?.[placeId] : undefined;
  return place ? enough(s, place[season]?.[s.id]) && steady(s, place) : undefined;
}

/** Recorded often enough near this place in any season? `undefined` when there's no data for the place. */
export function recordedAnySeason(s: Species, sightings: Sightings | undefined, placeId: string | undefined): boolean | undefined {
  const place = placeId ? sightings?.[placeId] : undefined;
  return place ? steady(s, place) && Object.values(place).some((bySpecies) => enough(s, bySpecies[s.id])) : undefined;
}
