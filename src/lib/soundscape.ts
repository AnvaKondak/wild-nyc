// Which ambient loop plays behind the story: a gentle sound of the kind of place you're
// looking at. Birds by day (dawn and midday), crickets by night (dusk and night): water
// lapping by the waterfront, birdsong or crickets in a park, a calm street on the block.
// Crickets go quiet in winter, so winter nights are just the water, the wind in the
// trees or the quiet street. When it's raining, the rain.
// The loops are mixed by scripts/build_soundscapes.py.

import type { Period, PlaceKind, Season } from '@/content/types';
import type { WeatherTag } from './weather';

export type Soundscape = `${PlaceKind}-${'day' | 'night' | 'winter-night'}` | 'rain';

export function pickSoundscape(kind: PlaceKind, period: Period, season: Season, tags: WeatherTag[] = []): Soundscape {
  if (tags.includes('rain')) return 'rain';
  if (period === 'dawn' || period === 'midday') return `${kind}-day`;
  return season === 'winter' ? `${kind}-winter-night` : `${kind}-night`;
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  'waterfront-day': 'water lapping and birds',
  'waterfront-night': 'water lapping and crickets',
  'waterfront-winter-night': 'water lapping in the dark',
  'park-day': 'birdsong in the trees',
  'park-night': 'crickets in the grass',
  'park-winter-night': 'wind in the bare trees',
  'block-day': 'a calm street and birds',
  'block-night': 'a quiet street and crickets',
  'block-winter-night': 'a quiet winter street',
  rain: 'the rain',
};
