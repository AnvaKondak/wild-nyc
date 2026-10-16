// Which ambient loop plays behind the story: calm birdsong over a soft healing tone
// everywhere, and soft waves with birdsong only in the neighborhoods right on the water.
// The favorites story spans the whole city, so it's always the birdsong.
// The loops are mixed by scripts/build_soundscapes.py.

export type Soundscape = 'birds' | 'birds-water';

/** The neighborhoods right on the water, where you hear the waves. */
export const WATER_PLACES = ['coney-island', 'red-hook', 'brooklyn-bridge-park', 'rockaway-beach', 'battery-park-city', 'exchange-place'];

export function pickSoundscape({ placeId, favorites }: { placeId?: string; favorites: boolean }): Soundscape {
  return !favorites && !!placeId && WATER_PLACES.includes(placeId) ? 'birds-water' : 'birds';
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  birds: 'soft birdsong',
  'birds-water': 'soft waves and birdsong',
};
