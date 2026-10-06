// Story pieces for a neighbor's own page: a day in their life (one moment for each time
// of day, this season) and where they live, drawn as a scene.

import type { LocalNames, Moment, Period, Season, Setting, Species } from '@/content/types';
import { fillPlace } from './localStory';
import { pick, seededRandom } from './random';

const PERIODS: Period[] = ['dawn', 'midday', 'dusk', 'night'];

export type DayBeat = { period: Period; title: string; body: string };

/** Dawn to night, one everyday moment each, for this season. Times with nothing to say are skipped. */
export function dayInTheLife(s: Species, season: Season, moments: Moment[], phrase: string, local: LocalNames, seed: string): DayBeat[] {
  const random = seededRandom(`${s.id}:${seed}:day`);
  return PERIODS.flatMap((period) => {
    const options = moments.filter((m) => m.speciesId === s.id && !m.weather && m.seasons.includes(season) && m.periods.includes(period));
    if (options.length === 0) return [];
    const v = pick(pick(options, random).variants, random);
    return [{ period, title: fillPlace(v.title, phrase, local, random), body: fillPlace(v.body, phrase, local, random) }];
  });
}

/** Their favorite spot at home, as a scene setting. */
const SPOT_SETTING: Record<string, Setting> = {
  tree: 'branch', treetop: 'branch', trunk: 'trunk', hedge: 'hedge', shrubs: 'hedge', ledge: 'ledge', rooftop: 'rooftop',
  wire: 'wire', lamp: 'streetlight', flowerbox: 'flowers', flowers: 'flowers', trashcan: 'trashcan', fence: 'fence',
  sidewalk: 'sidewalk', lawn: 'lawn', grass: 'lawn', path: 'lawn', bench: 'lawn', pond: 'water', water: 'water',
  reeds: 'reeds', piling: 'pier', pier: 'pier', shore: 'shore', rocks: 'shore', log: 'water', sky: 'sky', railing: 'sky',
};

export function homeSetting(s: Species): Setting {
  return SPOT_SETTING[s.spots[s.homeScene] ?? 'sky'] ?? 'sky';
}
