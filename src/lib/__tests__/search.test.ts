import { species } from '@/content';
import { searchSpecies } from '../search';

const ids = (list: { id: string }[]) => list.map((s) => s.id);

describe('searchSpecies', () => {
  it('finds everyone A to Z with no query', () => {
    const all = searchSpecies(species, '');
    expect(all).toHaveLength(species.length);
    expect(all[0].friendlyName.localeCompare(all[1].friendlyName)).toBeLessThanOrEqual(0);
  });

  it('matches names, scientific names and everyday kinds, in any case', () => {
    expect(ids(searchSpecies(species, 'PIGEON'))).toContain('rock-pigeon');
    expect(ids(searchSpecies(species, 'procyon'))).toEqual(['raccoon']);
    expect(ids(searchSpecies(species, 'hawk'))).toEqual(expect.arrayContaining(['red-tailed-hawk', 'coopers-hawk', 'peregrine-falcon']));
    expect(ids(searchSpecies(species, 'bee'))).toEqual(expect.arrayContaining(['western-honey-bee', 'common-eastern-bumble-bee']));
    expect(searchSpecies(species, 'unicorn')).toEqual([]);
  });

  it('needs every word to match', () => {
    expect(ids(searchSpecies(species, 'blue jay'))).toEqual(['blue-jay']);
  });
});

describe('searchSpecies: the newest neighbors', () => {
  it('finds them by everyday names, and not by borrowed art', () => {
    const ids = (q: string) => searchSpecies(species, q).map((s) => s.id);
    expect(ids('bunny')).toEqual(['eastern-cottontail']);
    expect(ids('fox')).toEqual(['red-fox']);
    expect(ids('bat')).toContain('bats');
    expect(ids('turkey')).toEqual(['wild-turkey']);
    expect(ids('deer')).toEqual(['white-tailed-deer']);
    expect(ids('mammal')).toEqual(expect.arrayContaining(['coyote', 'red-fox', 'bats', 'eastern-cottontail']));
  });
});
