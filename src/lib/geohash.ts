// Geohash: turns a lat/lng into a short string naming a grid cell.
// Precision 6 is about 1.2 × 0.6 km, our "neighborhood". The user's exact
// position is converted here, on the phone, and never stored or sent.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export const NEIGHBORHOOD_PRECISION = 6;

export function encodeGeohash(lat: number, lng: number, precision = NEIGHBORHOOD_PRECISION): string {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let hash = '';
  let bits = 0;
  let value = 0;
  let evenBit = true; // geohash alternates: longitude bit, latitude bit, ...

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        value = value * 2 + 1;
        lngMin = mid;
      } else {
        value *= 2;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        value = value * 2 + 1;
        latMin = mid;
      } else {
        value *= 2;
        latMax = mid;
      }
    }
    evenBit = !evenBit;
    bits++;
    if (bits === 5) {
      hash += BASE32[value];
      bits = 0;
      value = 0;
    }
  }
  return hash;
}

/** Center of a geohash cell. Good enough for sun times; never finer than the cell. */
export function decodeGeohash(hash: string): { lat: number; lng: number } {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let evenBit = true;

  for (const char of hash) {
    const value = BASE32.indexOf(char);
    if (value === -1) throw new Error(`Invalid geohash character: ${char}`);
    for (let bit = 4; bit >= 0; bit--) {
      const on = (value >> bit) & 1;
      if (evenBit) {
        const mid = (lngMin + lngMax) / 2;
        if (on) lngMin = mid;
        else lngMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (on) latMin = mid;
        else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }
  return { lat: (latMin + latMax) / 2, lng: (lngMin + lngMax) / 2 };
}

/** Great-circle distance in kilometers. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
