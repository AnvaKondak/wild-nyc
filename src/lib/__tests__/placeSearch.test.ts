import { places } from '@/content';
import { boroughOf, searchPlaces } from '../placeSearch';

const ids = (q: string) => searchPlaces(places, q).map((p) => p.id);

describe('searchPlaces', () => {
  it('finds a place by name, however it is typed', () => {
    expect(ids('park slope')[0]).toBe('park-slope');
    expect(ids('Bed Stuy')[0]).toBe('bed-stuy');
    expect(ids('bedstuy')[0]).toBe('bed-stuy');
    expect(ids('willi')[0]).toBe('williamsburg');
  });

  it('finds places by borough or city', () => {
    expect(ids('Queens')).toEqual(expect.arrayContaining(['astoria', 'jackson-heights', 'rockaway-beach']));
    expect(ids('Queens')).not.toContain('park-slope');
    expect(ids('jersey city').every((id) => places.find((p) => p.id === id)!.city === 'Jersey City')).toBe(true);
  });

  it('knows the nicknames', () => {
    expect(ids('UWS')[0]).toBe('upper-west-side');
    expect(ids('LIC')[0]).toBe('long-island-city');
  });

  it('finds a place by a spot inside it', () => {
    expect(ids('Bedford Ave')).toContain('williamsburg');
    expect(ids('high line')).toContain('chelsea');
  });

  it('shows everything for an empty search, and nothing for nonsense', () => {
    expect(ids('')).toHaveLength(places.length);
    expect(ids('zzzz')).toHaveLength(0);
  });

  it('gives every place a borough', () => {
    for (const p of places) expect(boroughOf(p)).toBeTruthy();
    expect(boroughOf(places.find((p) => p.id === 'liberty-state-park')!)).toBe('Jersey City');
  });
});
