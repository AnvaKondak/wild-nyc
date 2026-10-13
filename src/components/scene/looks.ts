// How each neighborhood looks up close: the kind of building on the block, the kind of
// water nearby, and a landmark on the horizon where there's open sky. Places not listed
// here (and "Use where I am" spots) get a look from their kind of place.

import type { PlaceKind } from '@/content/types';

export type Building = 'brownstone' | 'tenement' | 'castiron' | 'glass' | 'rowhouse';
export type WaterLook = 'pond' | 'river' | 'beach';
export type Landmark = 'verrazzano' | 'williamsburg-bridge' | 'brooklyn-bridge' | 'liberty' | 'wonder-wheel' | 'unisphere' | 'skyline' | 'empire';

export type Look = { building: Building; water: WaterLook; landmark?: Landmark };

const LOOKS: Record<string, Partial<Look>> = {
  // Brooklyn
  'park-slope': { building: 'brownstone', landmark: 'skyline' },
  'prospect-park': { building: 'brownstone' },
  williamsburg: { building: 'tenement', water: 'river', landmark: 'williamsburg-bridge' },
  greenpoint: { building: 'rowhouse', water: 'river', landmark: 'empire' },
  'bed-stuy': { building: 'brownstone' },
  bensonhurst: { building: 'rowhouse' },
  'bay-ridge': { building: 'rowhouse', water: 'river', landmark: 'verrazzano' },
  'coney-island': { building: 'rowhouse', water: 'beach', landmark: 'wonder-wheel' },
  'brooklyn-bridge-park': { building: 'brownstone', water: 'river', landmark: 'brooklyn-bridge' },
  'red-hook': { building: 'tenement', water: 'river', landmark: 'liberty' },
  // Manhattan
  'lower-east-side': { building: 'tenement', water: 'river', landmark: 'williamsburg-bridge' },
  'east-village': { building: 'tenement', landmark: 'empire' },
  chelsea: { building: 'tenement', water: 'river', landmark: 'empire' },
  soho: { building: 'castiron', landmark: 'skyline' },
  'battery-park-city': { building: 'glass', water: 'river', landmark: 'liberty' },
  'central-park': { building: 'brownstone', landmark: 'skyline' },
  'upper-west-side': { building: 'brownstone', water: 'river', landmark: 'skyline' },
  harlem: { building: 'brownstone' },
  'washington-heights': { building: 'tenement', water: 'river' },
  'inwood-hill-park': { building: 'tenement', water: 'river' },
  // Queens
  astoria: { building: 'rowhouse', water: 'river', landmark: 'skyline' },
  'jackson-heights': { building: 'tenement' },
  'long-island-city': { building: 'glass', water: 'river', landmark: 'empire' },
  'flushing-meadows': { building: 'rowhouse', landmark: 'unisphere' },
  'forest-hills': { building: 'rowhouse' },
  'jamaica-bay': { building: 'rowhouse', landmark: 'skyline' },
  'rockaway-beach': { building: 'rowhouse', water: 'beach' },
  // The Bronx
  'mott-haven': { building: 'tenement', water: 'river' },
  'bronx-park': { building: 'tenement' },
  'van-cortlandt-park': { building: 'tenement' },
  'pelham-bay-park': { building: 'rowhouse', water: 'beach' },
  // Staten Island
  'st-george': { building: 'rowhouse', water: 'river', landmark: 'liberty' },
  'clove-lakes-park': { building: 'rowhouse' },
  'great-kills-park': { building: 'rowhouse', water: 'beach', landmark: 'verrazzano' },
  // Jersey City
  'downtown-jc': { building: 'brownstone', water: 'river', landmark: 'skyline' },
  'exchange-place': { building: 'glass', water: 'river', landmark: 'skyline' },
  'journal-square': { building: 'rowhouse', landmark: 'skyline' },
  'the-heights': { building: 'rowhouse', landmark: 'skyline' },
  'lincoln-park-jc': { building: 'rowhouse' },
  'liberty-state-park': { building: 'rowhouse', water: 'river', landmark: 'liberty' },
};

const BY_KIND: Record<PlaceKind, Look> = {
  block: { building: 'brownstone', water: 'pond' },
  park: { building: 'brownstone', water: 'pond' },
  waterfront: { building: 'glass', water: 'river' },
};

/** The look of a place: its own, or its kind's. */
export function lookFor(placeId: string | undefined, kind: PlaceKind): Look {
  return { ...BY_KIND[kind], ...(placeId ? LOOKS[placeId] : undefined) };
}
