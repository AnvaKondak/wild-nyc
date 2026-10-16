// Finding a neighborhood to add by typing instead of scrolling: by its name ("Park
// Slope"), its borough or city ("Brooklyn", "Jersey City"), a nickname people really use
// ("UWS", "Bed Stuy", "LIC"), or a spot inside it ("Bedford Avenue", "the High Line").

import type { Place } from '@/content/types';

export type Borough = 'Brooklyn' | 'Manhattan' | 'Queens' | 'The Bronx' | 'Staten Island' | 'Jersey City';

/** Each bundled place's borough (Jersey City is its own). */
const BOROUGH: Record<string, Borough> = {
  'park-slope': 'Brooklyn', 'prospect-park': 'Brooklyn', williamsburg: 'Brooklyn', greenpoint: 'Brooklyn', 'bed-stuy': 'Brooklyn',
  bensonhurst: 'Brooklyn', 'bay-ridge': 'Brooklyn', 'coney-island': 'Brooklyn', 'brooklyn-bridge-park': 'Brooklyn', 'red-hook': 'Brooklyn',
  'lower-east-side': 'Manhattan', 'east-village': 'Manhattan', chelsea: 'Manhattan', soho: 'Manhattan', 'battery-park-city': 'Manhattan',
  'central-park': 'Manhattan', 'upper-west-side': 'Manhattan', harlem: 'Manhattan', 'washington-heights': 'Manhattan', 'inwood-hill-park': 'Manhattan',
  astoria: 'Queens', 'jackson-heights': 'Queens', 'long-island-city': 'Queens', 'flushing-meadows': 'Queens', 'forest-hills': 'Queens',
  'jamaica-bay': 'Queens', 'rockaway-beach': 'Queens',
  'mott-haven': 'The Bronx', 'bronx-park': 'The Bronx', 'van-cortlandt-park': 'The Bronx', 'pelham-bay-park': 'The Bronx',
  'st-george': 'Staten Island', 'clove-lakes-park': 'Staten Island', 'great-kills-park': 'Staten Island',
};

/** Other names people use, for the borough and for the place itself. */
const BOROUGH_NAMES: Record<Borough, string[]> = {
  Brooklyn: ['brooklyn', 'bk', 'kings county'],
  Manhattan: ['manhattan', 'new york', 'nyc', 'the city'],
  Queens: ['queens'],
  'The Bronx': ['bronx', 'the bronx', 'bx'],
  'Staten Island': ['staten island', 'si'],
  'Jersey City': ['jersey city', 'jc', 'jersey', 'nj', 'new jersey'],
};
const NICKNAMES: Record<string, string[]> = {
  'upper-west-side': ['uws'],
  'lower-east-side': ['les'],
  'bed-stuy': ['bedford stuyvesant', 'bed stuy', 'bedstuy'],
  'long-island-city': ['lic'],
  'battery-park-city': ['bpc', 'financial district', 'fidi'],
  soho: ['so ho', 'nolita', 'tribeca'],
  'east-village': ['ev', 'alphabet city'],
  'washington-heights': ['wash heights', 'the heights uptown'],
  'downtown-jc': ['downtown jersey city', 'grove street', 'paulus hook', 'hamilton park'],
  'exchange-place': ['paulus hook', 'newport'],
  'jamaica-bay': ['broad channel'],
  'flushing-meadows': ['flushing', 'corona'],
  'the-heights': ['jc heights'],
};

export function boroughOf(place: Place): Borough {
  return place.city === 'Jersey City' ? 'Jersey City' : BOROUGH[place.id] ?? 'Brooklyn';
}

/** Lowercase, no punctuation or "the", single spaces: "Bed-Stuy" and "bed stuy" match. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|avenue|ave|street|st)\b/g, (w) => ({ avenue: 'ave', street: 'st' })[w as 'avenue' | 'street'] ?? (w === 'the' ? '' : w))
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Places matching what's typed, best first: names that start with it, then names that
 * contain it, then borough or nickname matches, then places with a matching spot inside.
 * An empty search returns every place.
 */
export function searchPlaces(all: Place[], query: string): Place[] {
  const q = norm(query);
  if (!q) return all;
  const score = (p: Place): number => {
    const name = norm(p.name);
    if (name.startsWith(q)) return 4;
    if (name.includes(q)) return 3;
    const names = [...(NICKNAMES[p.id] ?? []), ...BOROUGH_NAMES[boroughOf(p)]].map(norm);
    if (names.some((n) => n === q || n.startsWith(q))) return 2;
    const spots = Object.values(p.local).flat().map(norm);
    return spots.some((s) => s.includes(q)) ? 1 : 0;
  };
  return all
    .map((p, i) => ({ p, s: score(p), i }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p);
}
