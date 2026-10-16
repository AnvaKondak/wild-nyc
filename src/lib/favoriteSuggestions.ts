// Who to suggest as favorites when someone first joins: the crowd-pleasers, pigeons
// always first, then anyone who belongs to their neighborhood in particular (Central
// Park's coyotes, Staten Island's turkeys). Anyone who never shows up there is swapped
// for a neighbor who does.

import type { PlaceKind, Species } from '@/content/types';
import { recordedAnySeason, topMammals, type Sightings } from './sightings';

/** The ones we think people will love most, in order. */
export const SUGGESTED = [
  'rock-pigeon',
  'eastern-gray-squirrel',
  'raccoon',
  'red-fox',
  'eastern-cottontail',
  'northern-cardinal',
  'mallard',
  'monarch',
  'virginia-opossum',
  'common-eastern-firefly',
];

/** Who steps in when one of the suggestions doesn't live nearby. */
const STAND_INS = ['blue-jay', 'american-robin', 'canada-goose', 'house-sparrow', 'mourning-dove', 'white-tailed-deer', 'groundhog', 'mute-swan', 'great-blue-heron', 'eastern-carpenter-bee'];

const COUNT = 10;

/** Does this species turn up in this neighborhood at some point in the year? */
function showsUpHere(s: Species, kind: PlaceKind | undefined, sightings: Sightings | undefined, placeId: string | undefined): boolean {
  if (s.onlyAt) return !!placeId && s.onlyAt.includes(placeId);
  const recorded = recordedAnySeason(s, sightings, placeId);
  if (recorded) return true;
  return !s.sightingsOnly && (!kind || !!s.spots[kind]);
}

export function suggestFavorites(all: Species[], place: { placeId?: string; kind?: PlaceKind } | undefined, sightings: Sightings | undefined): Species[] {
  const placeId = place?.placeId;
  const byId = new Map(all.map((s) => [s.id, s]));
  const fits = (s: Species | undefined): s is Species => !!s && showsUpHere(s, place?.kind, sightings, placeId);
  const pigeon = byId.get('rock-pigeon');
  // This place's own: its pinned neighbors, then its most-seen mammals.
  const local = [...all.filter((s) => !!placeId && !!s.alwaysAt?.includes(placeId)), ...topMammals(all, sightings, placeId)];
  const picks = [pigeon, ...local, ...SUGGESTED.map((id) => byId.get(id)), ...STAND_INS.map((id) => byId.get(id))].filter(fits);
  // Pigeons are everywhere, and always suggested.
  const out = pigeon ? [pigeon] : [];
  for (const s of picks) if (out.length < COUNT && !out.includes(s)) out.push(s);
  return out;
}
