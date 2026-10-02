import { places } from '@/content';
import { decodeGeohash, distanceKm } from '../geohash';
import { nearestPlace, neighborhoodFromPlace, neighborhoodFromPosition } from '../neighborhood';

describe('neighborhoodFromPosition', () => {
  it('keeps only a 6-character cell, never the exact position', () => {
    const n = neighborhoodFromPosition(40.66912, -73.98267, places);
    expect(n.cell).toHaveLength(6);
    expect(JSON.stringify(n)).not.toContain('40.669');
    expect(JSON.stringify(n)).not.toContain('73.982');
  });

  it('takes the kind of a nearby bundled place', () => {
    const n = neighborhoodFromPosition(40.6615, -73.9695, places); // inside Prospect Park
    expect(n.kind).toBe('park');
    expect(n.placeId).toBe('prospect-park');
    expect(n.label).toBe('Home');
  });

  it('is a plain block far from any bundled place', () => {
    const n = neighborhoodFromPosition(40.6, -73.75, places); // far Queens
    expect(n.kind).toBe('block');
    expect(n.placeId).toBeUndefined();
  });
});

describe('neighborhoodFromPlace', () => {
  it('uses the place name and a cell near its center', () => {
    const jc = places.find((p) => p.id === 'downtown-jc')!;
    const n = neighborhoodFromPlace(jc);
    expect(n.label).toBe('Downtown JC');
    expect(distanceKm(decodeGeohash(n.cell), jc)).toBeLessThan(0.7);
    expect(nearestPlace(n.cell, places)?.id).toBe('downtown-jc');
  });
});
