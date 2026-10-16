// How each neighborhood looks up close: the kind of building on the block, the kind of
// water nearby, and a landmark on the horizon where there's open sky. Places not listed
// here (and "Use where I am" spots) get a look from their kind of place.

import type { PlaceKind } from '@/content/types';

/** Pink brownstones and ivy-covered brick townhouses: the prettiest of NYC's blocks. */
export type Building = 'brownstone' | 'ivy';
export type WaterLook = 'pond' | 'river' | 'beach';
export type Landmark = 'verrazzano' | 'williamsburg-bridge' | 'brooklyn-bridge' | 'liberty' | 'wonder-wheel' | 'unisphere' | 'skyline' | 'empire';

export type Look = { building: Building; water: WaterLook; landmark?: Landmark };

const LOOKS: Record<string, Partial<Look>> = {
  // Brooklyn
  'park-slope': { building: 'brownstone', landmark: 'skyline' },
  'prospect-park': { building: 'brownstone' },
  williamsburg: { building: 'ivy', water: 'river', landmark: 'williamsburg-bridge' },
  greenpoint: { building: 'ivy', water: 'river', landmark: 'empire' },
  'bed-stuy': { building: 'brownstone' },
  bensonhurst: { building: 'brownstone' },
  'bay-ridge': { building: 'brownstone', water: 'river', landmark: 'verrazzano' },
  'coney-island': { building: 'brownstone', water: 'beach', landmark: 'wonder-wheel' },
  'brooklyn-bridge-park': { building: 'brownstone', water: 'river', landmark: 'brooklyn-bridge' },
  'red-hook': { building: 'ivy', water: 'river', landmark: 'liberty' },
  // Manhattan
  'lower-east-side': { building: 'ivy', water: 'river', landmark: 'williamsburg-bridge' },
  'east-village': { building: 'ivy', landmark: 'empire' },
  chelsea: { building: 'ivy', water: 'river', landmark: 'empire' },
  soho: { building: 'ivy', landmark: 'skyline' },
  'battery-park-city': { building: 'ivy', water: 'river', landmark: 'liberty' },
  'central-park': { building: 'brownstone', landmark: 'skyline' },
  'upper-west-side': { building: 'brownstone', water: 'river', landmark: 'skyline' },
  harlem: { building: 'brownstone' },
  'washington-heights': { building: 'ivy', water: 'river' },
  'inwood-hill-park': { building: 'ivy', water: 'river' },
  // Queens
  astoria: { building: 'ivy', water: 'river', landmark: 'skyline' },
  'jackson-heights': { building: 'ivy' },
  'long-island-city': { building: 'ivy', water: 'river', landmark: 'empire' },
  'flushing-meadows': { building: 'brownstone', landmark: 'unisphere' },
  'forest-hills': { building: 'ivy' },
  'jamaica-bay': { building: 'brownstone', landmark: 'skyline' },
  'rockaway-beach': { building: 'brownstone', water: 'beach' },
  // The Bronx
  'mott-haven': { building: 'ivy', water: 'river' },
  'bronx-park': { building: 'ivy' },
  'van-cortlandt-park': { building: 'ivy' },
  'pelham-bay-park': { building: 'brownstone', water: 'beach' },
  // Staten Island
  'st-george': { building: 'ivy', water: 'river', landmark: 'liberty' },
  'clove-lakes-park': { building: 'brownstone' },
  'great-kills-park': { building: 'brownstone', water: 'beach', landmark: 'verrazzano' },
  // Jersey City
  'downtown-jc': { building: 'brownstone', water: 'river', landmark: 'skyline' },
  'exchange-place': { building: 'ivy', water: 'river', landmark: 'skyline' },
  'journal-square': { building: 'brownstone', landmark: 'skyline' },
  'the-heights': { building: 'ivy', landmark: 'skyline' },
  'lincoln-park-jc': { building: 'brownstone' },
  'liberty-state-park': { building: 'brownstone', water: 'river', landmark: 'liberty' },
};

const BY_KIND: Record<PlaceKind, Look> = {
  block: { building: 'brownstone', water: 'pond' },
  park: { building: 'brownstone', water: 'pond' },
  waterfront: { building: 'brownstone', water: 'river' },
};

/** The look of a place: its own, or its kind's. */
export function lookFor(placeId: string | undefined, kind: PlaceKind): Look {
  return { ...BY_KIND[kind], ...(placeId ? LOOKS[placeId] : undefined) };
}
