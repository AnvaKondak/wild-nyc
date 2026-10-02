import { decodeGeohash, distanceKm, encodeGeohash } from '../geohash';

describe('encodeGeohash', () => {
  it('matches the well-known reference value', () => {
    // Example from the original geohash.org description.
    expect(encodeGeohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
  });

  it('defaults to neighborhood precision (6 characters)', () => {
    expect(encodeGeohash(40.6710, -73.9814)).toHaveLength(6);
  });

  it('puts nearby points in the same cell and far points in different cells', () => {
    const a = encodeGeohash(40.67100, -73.98140);
    const b = encodeGeohash(40.67110, -73.98150); // ~15 m away
    const c = encodeGeohash(40.7812, -73.9665); // Central Park
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('decodeGeohash', () => {
  it('returns a center within the cell, close to the original point', () => {
    const point = { lat: 40.7178, lng: -74.0431 };
    const center = decodeGeohash(encodeGeohash(point.lat, point.lng));
    // A precision-6 cell is about 1.2 × 0.6 km, so the center is within ~0.7 km.
    expect(distanceKm(point, center)).toBeLessThan(0.7);
    expect(encodeGeohash(center.lat, center.lng)).toBe(encodeGeohash(point.lat, point.lng));
  });

  it('rejects characters that are not in the geohash alphabet', () => {
    expect(() => decodeGeohash('dr5a')).toThrow('Invalid geohash character');
  });
});

describe('distanceKm', () => {
  it('measures Park Slope to Central Park at roughly 12 km', () => {
    const d = distanceKm({ lat: 40.671, lng: -73.9814 }, { lat: 40.7812, lng: -73.9665 });
    expect(d).toBeGreaterThan(11);
    expect(d).toBeLessThan(13.5);
  });
});
