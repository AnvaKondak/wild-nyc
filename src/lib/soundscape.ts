// Which ambient loop plays behind the story: what you'd hear on the block right now.
// Weather you can hear wins (rain, wind, the hush of snow), then the waterfront's
// waves and gulls, then the season and time of day: the dawn chorus in spring,
// crickets on summer nights, wind through bare trees in winter.
// The loops are mixed by scripts/build_soundscapes.py.

import type { Period, PlaceKind, Season } from '@/content/types';
import type { Sky, WeatherTag } from './weather';

export type Soundscape =
  | 'dawn-chorus' | 'day-birds' | 'dusk-birds' | 'summer-dusk' | 'summer-night'
  | 'fall-day' | 'fall-dusk' | 'fall-night' | 'winter-day' | 'quiet-night'
  | 'harbor' | 'harbor-night' | 'rain' | 'wind' | 'snow';

const BY_SEASON: Record<Season, Record<Period, Soundscape>> = {
  spring: { dawn: 'dawn-chorus', midday: 'day-birds', dusk: 'dusk-birds', night: 'quiet-night' },
  summer: { dawn: 'dawn-chorus', midday: 'day-birds', dusk: 'summer-dusk', night: 'summer-night' },
  fall: { dawn: 'fall-day', midday: 'fall-day', dusk: 'fall-dusk', night: 'fall-night' },
  winter: { dawn: 'winter-day', midday: 'winter-day', dusk: 'winter-day', night: 'quiet-night' },
};

export function pickSoundscape(season: Season, period: Period, placeKind: PlaceKind, sky?: Sky, tags: WeatherTag[] = []): Soundscape {
  if (tags.includes('rain')) return 'rain';
  if (sky === 'snow') return 'snow';
  if (tags.includes('wind')) return 'wind';
  if (placeKind === 'waterfront') return period === 'night' ? 'harbor-night' : 'harbor';
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
  harbor: 'waves and gulls',
  'harbor-night': 'water against the pilings',
  rain: 'the rain',
  wind: 'the wind',
  snow: 'the hush of snow',
};
