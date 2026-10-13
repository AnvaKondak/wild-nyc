import { encounters, facts, moments, placeKinds, places, seasonChapters, species } from '@/content';
import type { Period, Season } from '@/content/types';
import { favoritesStory } from '../favoritesStory';
import type { StoryContext, StoryPlace } from '../neighborStory';
import type { Sightings } from '../sightings';

const ctxOf = (season: Season, period: Period, sightings: Sightings = {}): StoryContext => ({
  allSpecies: species,
  moments,
  facts,
  chapters: seasonChapters,
  encounters,
  sightings,
  season,
  period,
  live: new Map(),
  weather: [],
});
const placeOf = (id: string, label?: string): StoryPlace => {
  const p = places.find((x) => x.id === id)!;
  return { cell: p.id, kind: p.kind, placeName: label ?? p.name, where: placeKinds[p.kind].where, local: p.local, placeId: p.id };
};
const allYear = (counts: Record<string, number>) => ({ spring: counts, summer: counts, fall: counts, winter: counts });
const story = (favorites: string[], season: Season, period: Period, sightings: Sightings = {}, saved = [placeOf('williamsburg')]) =>
  favoritesStory({ favorites, ctx: ctxOf(season, period, sightings), saved, places, kinds: placeKinds, date: '2026-10-12' });

describe('favoritesStory', () => {
  it('tells each favorite in the order they were added, then all of them', () => {
    const slides = story(['rock-pigeon', 'blue-jay'], 'fall', 'midday');
    expect(slides.map((s) => s.id)).toEqual(['favorite:rock-pigeon', 'favorite:blue-jay', 'favorites']);
    expect(slides[0].kicker).toBe('Your favorites · 1 of 2');
    expect(slides[2].aroundSpecies).toEqual(['rock-pigeon', 'blue-jay']);
    expect(slides[0].cta).toBe('Meet the pigeons');
  });

  it('says when they are near one of your neighborhoods, or where in the city they are', () => {
    const data: Sightings = { williamsburg: allYear({ 'blue-jay': 6 }), 'van-cortlandt-park': allYear({ 'white-tailed-deer': 40 }) };
    const [jay, deer] = story(['blue-jay', 'white-tailed-deer'], 'fall', 'midday', data);
    expect(jay.status).toBe('Near Williamsburg');
    expect(deer.status).toBe('Around Van Cortlandt Park');
    expect(deer.scene).toBe('park');
  });

  it('falls back to the city when there are no records', () => {
    expect(story(['rock-pigeon'], 'fall', 'midday')[0].status).toBe('Around the city');
  });

  it('naps at the wrong end of the day', () => {
    const [raccoon, pigeon] = story(['raccoon', 'rock-pigeon'], 'fall', 'midday');
    expect(raccoon.status).toBe('Napping');
    expect(raccoon.mood).toBe('sleepy');
    expect(pigeon.mood).toBeUndefined();
    expect(story(['rock-pigeon'], 'fall', 'night')[0].status).toBe('Napping');
  });

  it('is away out of season, with when they come back', () => {
    const [swift] = story(['chimney-swift'], 'winter', 'midday');
    expect(swift.status).toMatch(/^Away until \w+$/);
    expect(swift.title).toBe('The chimney swifts are away for the winter');
  });

  it('has something to say for every favorite, every season and time of day', () => {
    for (const season of ['spring', 'summer', 'fall', 'winter'] as const)
      for (const period of ['dawn', 'midday', 'dusk', 'night'] as const)
        for (const s of story(species.map((x) => x.id), season, period).filter((x) => x.kind === 'favorite')) {
          expect(s.title.length).toBeGreaterThan(5);
          expect(s.body.length).toBeGreaterThan(10);
          expect(s.title + s.body).not.toMatch(/[{}]/);
        }
  });

  it('invites you to add some when there are none', () => {
    const [empty] = story([], 'fall', 'midday');
    expect(empty.kind).toBe('favorites-empty');
  });
});
