import { getSpecies, placeKinds, places, speciesFor } from '@/content';
import { buildIntro, listNames } from '../intro';
import { seededRandom } from '../random';
import { PREVIEW_WEATHER } from '../weather';

const lsp = places.find((p) => p.id === 'liberty-state-park')!;
const sp = (...ids: string[]) => ids.map((id) => getSpecies(id)!);
const base = {
  period: 'dawn' as const,
  season: 'fall' as const,
  weather: PREVIEW_WEATHER.fog,
  placeName: lsp.name,
  where: placeKinds.waterfront.where,
  local: lsp.local,
  featured: sp('american-robin', 'house-sparrow', 'eastern-gray-squirrel', 'herring-gull'),
  residents: [...sp('raccoon', 'virginia-opossum'), ...speciesFor('waterfront', 'fall')],
  random: seededRandom('intro'),
};

describe('buildIntro', () => {
  it('says where, when, how it feels, and who is up or asleep', () => {
    const intro = buildIntro(base);
    expect(intro.kind).toBe('intro');
    expect(intro.title).toBe('It\'s dawn in Liberty State Park');
    expect(intro.body).toMatch(/^It's 50°, misty and cool\. Fog/);
    expect(intro.body).toContain('The robins, the sparrows and the squirrels are waking up.');
    expect(intro.body).toMatch(/raccoons.*heading to bed/);
    expect(intro.body).not.toMatch(/[{}]/);
    expect(intro.introSpecies).toEqual(['american-robin', 'house-sparrow', 'eastern-gray-squirrel']);
  });

  it('flips at night: the night crowd is up and the day crowd is tucked in', () => {
    const intro = buildIntro({ ...base, period: 'night', featured: sp('raccoon', 'moths', 'herring-gull') });
    expect(intro.title).toBe('It\'s nighttime in Liberty State Park');
    expect(intro.body).toContain('The raccoons, the moths and the opossums are out.');
    expect(intro.body).toContain('tucked in for the night');
  });

  it('makes no claims about the sky without weather, and adds the feel of wind', () => {
    expect(buildIntro({ ...base, weather: null }).body).toMatch(/^The first light is coming up over /);
    expect(buildIntro({ ...base, weather: PREVIEW_WEATHER.wind }).body).toContain('The wind is pushing the treetops around');
  });

  it('names an unnamed spot by its kind', () => {
    expect(buildIntro({ ...base, placeName: null, where: 'on your block', local: placeKinds.block.local }).title).toBe('It\'s dawn on your block');
  });

  it('lists names like a person would', () => {
    expect(listNames(sp('raccoon'))).toBe('the raccoons');
    expect(listNames(sp('raccoon', 'moths'))).toBe('the raccoons and the moths');
  });
});
