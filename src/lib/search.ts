// Search: find a neighbor by name (common, friendly or scientific) or by kind ("hawk",
// "duck", "bee").

import type { Species } from '@/content/types';

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
export function searchSpecies(all: Species[], query: string): Species[] {
  const words = plain(query).split(' ').filter(Boolean);
  return all
    .filter((s) => {
      const hay = plain([s.friendlyName, s.commonName, s.scientificName, s.collectiveNoun, s.art.body, ...(KIND_WORDS[s.art.body] ?? [])].join(' '));
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
}
