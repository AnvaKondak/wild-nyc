// Which ambient loop plays behind the story: a gentle sound of the kind of place you're
// looking at. Birds by day (dawn and midday), crickets by night (dusk and night): water
// lapping by the waterfront, birdsong or crickets in a park, a calm street on the block.
// When it's raining, the rain. The loops are mixed by scripts/build_soundscapes.py.

import type { Period, PlaceKind } from '@/content/types';
import type { WeatherTag } from './weather';

export type Soundscape = `${PlaceKind}-${'day' | 'night'}` | 'rain';

export function pickSoundscape(kind: PlaceKind, period: Period, tags: WeatherTag[] = []): Soundscape {
  if (tags.includes('rain')) return 'rain';
  return `${kind}-${period === 'dawn' || period === 'midday' ? 'day' : 'night'}`;
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  'waterfront-day': 'water lapping and birds',
  'waterfront-night': 'water lapping and crickets',
  'park-day': 'birdsong in the trees',
  'park-night': 'crickets in the grass',
  'block-day': 'a calm street and birds',
  'block-night': 'a quiet street and crickets',
  rain: 'the rain',
};
