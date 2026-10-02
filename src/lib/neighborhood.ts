// Turning a position or a picked place into a neighborhood. Coordinates go in,
// only a geohash-6 cell comes out; the exact position is never kept.

import type { Place, PlaceKind } from '@/content/types';
import { decodeGeohash, distanceKm, encodeGeohash } from './geohash';

export type Neighborhood = {
  id: string;
  /** Pill label: "Home", "Prospect Park"… */
  label: string;
  /** Geohash precision 6, about 1.2 × 0.6 km. */
  cell: string;
  kind: PlaceKind;
  /** The bundled place this cell is in or near, if any. */
  placeId?: string;
};

/** How close a cell must be to a bundled place to take its name and kind. */
const NEAR_KM = 2.5;

export function nearestPlace(cell: string, all: Place[]): Place | undefined {
  const center = decodeGeohash(cell);
  let best: { place: Place; d: number } | undefined;
  for (const place of all) {
    const d = distanceKm(center, place);
    if (!best || d < best.d) best = { place, d };
  }
  return best && best.d <= NEAR_KM ? best.place : undefined;
}

/** From the phone's position. The lat/lng is turned into a cell right away. */
export function neighborhoodFromPosition(lat: number, lng: number, all: Place[], label = 'Home'): Neighborhood {
  const cell = encodeGeohash(lat, lng);
  const place = nearestPlace(cell, all);
  return {
    id: `cell-${cell}`,
    label,
    cell,
    kind: place?.kind ?? 'block',
    placeId: place?.id,
  };
}

export function neighborhoodFromPlace(place: Place, label = place.name): Neighborhood {
  return {
    id: `place-${place.id}`,
    label,
    cell: encodeGeohash(place.lat, place.lng),
    kind: place.kind,
    placeId: place.id,
  };
}

/** Used before the user has picked anywhere: a generic block in Lower Manhattan. */
export const DEFAULT_NEIGHBORHOOD: Neighborhood = {
  id: 'default',
  label: 'Your block',
  cell: encodeGeohash(40.7128, -74.006),
  kind: 'block',
};
