// Search: find a neighbor by name (common, friendly or scientific) or by kind ("hawk",
// "duck", "bee"), optionally only those who live in one of your neighborhoods.

import type { PlaceKind, Species } from '@/content/types';

export type SearchPlace = { kind: PlaceKind; placeId?: string };

/** Who lives in a place at some point in the year. Rare visitors (sightings only) don't count. */
export function livesIn(s: Species, place: SearchPlace): boolean {
  return s.onlyAt ? !!place.placeId && s.onlyAt.includes(place.placeId) : !!s.spots[place.kind] && !s.sightingsOnly;
}

// Everyday words people search with, by kind of animal.
const KIND_WORDS: Record<string, string[]> = {
  songbird: ['bird', 'songbird'],
  pigeon: ['bird'],
  crow: ['bird'],
  raptor: ['bird', 'hawk', 'falcon', 'raptor', 'bird of prey'],
  woodpecker: ['bird'],
  swift: ['bird'],
  gull: ['bird', 'seagull'],
  tern: ['bird', 'seabird'],
  duck: ['bird', 'duck', 'water bird'],
  goose: ['bird', 'goose', 'water bird'],
  swan: ['bird', 'water bird'],
  cormorant: ['bird', 'water bird', 'seabird'],
  heron: ['bird', 'water bird'],
  'night-heron': ['bird', 'heron', 'water bird'],
  butterfly: ['bug', 'insect'],
  moth: ['bug', 'insect'],
  bee: ['bug', 'insect', 'pollinator'],
  firefly: ['bug', 'insect', 'lightning bug'],
  dragonfly: ['bug', 'insect'],
  bug: ['bug', 'insect'],
  spider: ['bug'],
  squirrel: ['mammal'],
  raccoon: ['mammal'],
  opossum: ['mammal', 'possum'],
  deer: ['mammal'],
  groundhog: ['mammal', 'woodchuck'],
  turtle: ['reptile'],
};

const plain = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');

/** Neighbors matching every word of the query (in any order), A to Z. An empty query matches everyone. */
export function searchSpecies(all: Species[], query: string, place?: SearchPlace): Species[] {
  const words = plain(query).split(' ').filter(Boolean);
  return all
    .filter((s) => !place || livesIn(s, place))
    .filter((s) => {
      const hay = plain([s.friendlyName, s.commonName, s.scientificName, s.collectiveNoun, s.art.body, ...(KIND_WORDS[s.art.body] ?? [])].join(' '));
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
}
