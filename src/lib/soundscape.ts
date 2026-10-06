// Which ambient loop plays behind the story: what you'd hear outside right now.
// Weather you can hear wins (rain, wind, the hush of snow), then the season and time
// of day: the dawn chorus in spring, crickets on summer nights, wind through bare trees
// in winter. It doesn't depend on the neighborhood, so moving between your places
// never changes or restarts it; the neighbors' own voices are layered on top.
// The loops are mixed by scripts/build_soundscapes.py.

import type { Period, Season } from '@/content/types';
import type { Sky, WeatherTag } from './weather';

export type Soundscape =
  | 'dawn-chorus' | 'day-birds' | 'dusk-birds' | 'summer-dusk' | 'summer-night'
  | 'fall-day' | 'fall-dusk' | 'fall-night' | 'winter-day' | 'quiet-night'
  | 'rain' | 'wind' | 'snow';

const BY_SEASON: Record<Season, Record<Period, Soundscape>> = {
  spring: { dawn: 'dawn-chorus', midday: 'day-birds', dusk: 'dusk-birds', night: 'quiet-night' },
  summer: { dawn: 'dawn-chorus', midday: 'day-birds', dusk: 'summer-dusk', night: 'summer-night' },
  fall: { dawn: 'fall-day', midday: 'fall-day', dusk: 'fall-dusk', night: 'fall-night' },
  winter: { dawn: 'winter-day', midday: 'winter-day', dusk: 'winter-day', night: 'quiet-night' },
};

export function pickSoundscape(season: Season, period: Period, sky?: Sky, tags: WeatherTag[] = []): Soundscape {
  if (tags.includes('rain')) return 'rain';
  if (sky === 'snow') return 'snow';
  if (tags.includes('wind')) return 'wind';
  return BY_SEASON[season][period];
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  'dawn-chorus': 'the dawn chorus',
  'day-birds': 'birds around the block',
  'dusk-birds': 'robins singing at dusk',
  'summer-dusk': 'the first crickets of the evening',
  'summer-night': 'crickets and katydids',
  'fall-day': 'blue jays and crows',
  'fall-dusk': 'crows heading home',
  'fall-night': 'the last crickets of the year',
  'winter-day': 'wind through bare trees',
  'quiet-night': 'the quiet city at night',
  rain: 'the rain',
  wind: 'the wind',
  snow: 'the hush of snow',
};
