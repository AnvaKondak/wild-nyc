import { clashesWithWeather, fillPlace, pickFact, placePhrase, withLocation } from '../localStory';
import { pick, seededRandom, shuffle } from '../random';

describe('random', () => {
  it('is the same for the same seed and different for another', () => {
    const a = seededRandom('dr5rdc:2026-10-04:night');
    const b = seededRandom('dr5rdc:2026-10-04:night');
    const c = seededRandom('dr5rke:2026-10-04:night');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    expect([c(), c(), c()]).not.toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('pick and shuffle use the generator', () => {
    const r = seededRandom('x');
    expect(['a', 'b', 'c']).toContain(pick(['a', 'b', 'c'], r));
    expect(shuffle([1, 2, 3, 4], seededRandom('y')).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('placePhrase', () => {
  it('names the place when there is one', () => {
    expect(placePhrase('Liberty State Park', 'by the water')).toBe('near Liberty State Park');
    expect(placePhrase(null, 'on your block')).toBe('on your block');
    expect(fillPlace('Look {place}. Or {where}.', 'near Astoria')).toBe('Look near Astoria. Or near Astoria.');
    const local = { green: ['Astoria Park'], water: ['the East River'], landmark: ['the Hell Gate Bridge'], street: ['Ditmars Boulevard'] };
    expect(fillPlace('Down {street}, past {green}, under {landmark}, to {water}.', 'near Astoria', local)).toBe(
      'Down Ditmars Boulevard, past Astoria Park, under the Hell Gate Bridge, to the East River.',
    );
  });
});

describe('pickFact', () => {
  const tagged = [
    { speciesId: 'x', text: 'any' },
    { speciesId: 'x', text: 'fall', seasons: ['fall' as const] },
    { speciesId: 'x', text: 'fall night', seasons: ['fall' as const], periods: ['night' as const] },
    { speciesId: 'x', text: 'spring', seasons: ['spring' as const] },
  ];

  it('never shows a fact tagged for another season or time', () => {
    for (let i = 0; i < 30; i++) expect(pickFact(tagged, 'x', 'fall', 'dawn', seededRandom(`f${i}`))).not.toMatch(/spring|night/);
  });

  it('prefers the most specific fact', () => {
    const picks = Array.from({ length: 40 }, (_, i) => pickFact(tagged, 'x', 'fall', 'night', seededRandom(`g${i}`)));
    expect(picks.filter((p) => p === 'fall night').length).toBeGreaterThan(20);
  });
});

describe('withLocation', () => {
  it('adds a place that fits the setting when the title has none', () => {
    const r = seededRandom('x');
    expect(withLocation('A crow is keeping an eye on things', 'rooftop', 'block', r)).toMatch(/ (along \{street\}|near \{landmark\}|on the block)$/);
    expect(withLocation('A gull is gliding', 'water', 'waterfront', r)).toMatch(/ (by \{water\}|out on \{water\}|at the waterfront)$/);
    expect(withLocation('A gull is gliding over {water}', 'water', 'waterfront', r)).toBe('A gull is gliding over {water}');
  });

});

describe('clashesWithWeather', () => {
  it('catches everyday lines that would be untrue in this weather', () => {
    expect(clashesWithWeather('Turtles are basking in the sun', ['rain'])).toBe(true);
    expect(clashesWithWeather('A squirrel is burying acorns', ['rain'])).toBe(false);
    expect(clashesWithWeather('Frost on the hedge', ['heat'])).toBe(true);
  });
});
