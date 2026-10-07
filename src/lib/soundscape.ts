// Which ambient loop plays behind the story: a gentle sound of the kind of place you're
// looking at. By the water: water lapping and birds. In a park: crickets and birds. On
// the block: a calm street and birds. When it's raining, the rain.
// The loops are mixed by scripts/build_soundscapes.py.

import type { PlaceKind } from '@/content/types';
import type { WeatherTag } from './weather';

export type Soundscape = 'waterfront' | 'park' | 'block' | 'rain';

export function pickSoundscape(kind: PlaceKind, tags: WeatherTag[] = []): Soundscape {
  return tags.includes('rain') ? 'rain' : kind;
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  waterfront: 'water lapping and birds',
  park: 'crickets and birds',
  block: 'a calm street and birds',
  rain: 'the rain',
};
