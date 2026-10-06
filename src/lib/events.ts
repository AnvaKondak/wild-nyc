// The big moments of the season: the dawn chorus at its loudest, the first fireflies,
// the hawk migration, a big migration night, the first frost, a snow day. When one is
// happening, it opens the story as a special slide. Most are date windows (typical
// NYC timing); a few depend on the weather.

import type { LocalNames, Season, StorySlide } from '@/content/types';
import { fillPlace } from './localStory';
import { seasonOf } from './time';
import type { Weather } from './weather';

export type SeasonEvent = {
  id: string;
  /** "MM-DD" window, inclusive. Weather-only events (snow, heat) have none. */
  from?: string;
  to?: string;
  /** Needs tonight's wind from the north (a fall migration night). */
  wind?: 'north';
  /** Needs a frost: tomorrow's low at or below freezing, or it's freezing now. */
  frost?: boolean;
  /** Needs it to be snowing, or a heat wave, right now. */
  snow?: boolean;
  heat?: boolean;
  species: string[];
  kicker: string;
  title: string;
  body: string;
};

const mmdd = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function isHappening(e: SeasonEvent, now: Date, weather: Weather | null): boolean {
  if (e.from && e.to) {
    const today = mmdd(now);
    if (today < e.from || today > e.to) return false;
  }
  if (e.snow && weather?.sky !== 'snow') return false;
  if (e.heat && !weather?.tags.includes('heat')) return false;
  if (e.frost && !((weather?.tomorrow?.lowF ?? 99) <= 32 || (weather?.feelsF ?? 99) <= 32)) return false;
  if (e.wind === 'north') {
    const t = weather?.tomorrow;
    if (!t || t.windMph < 8 || !(t.windFrom >= 300 || t.windFrom <= 60)) return false;
  }
  return true;
}

/** The one big moment to tell today, if any: weather events beat date windows. */
export function activeEvent(events: SeasonEvent[], now: Date, weather: Weather | null): SeasonEvent | undefined {
  const on = events.filter((e) => isHappening(e, now, weather));
  const special = (e: SeasonEvent) => (e.snow || e.heat || e.frost || e.wind ? 1 : 0);
  return on.sort((a, b) => special(b) - special(a))[0];
}

export function eventSlide(e: SeasonEvent, now: Date, phrase: string, local: LocalNames, random: () => number): StorySlide {
  const season: Season = seasonOf(now);
  return {
    id: `event:${e.id}`,
    season,
    period: 'any',
    kind: 'event',
    kicker: e.kicker,
    title: e.title,
    body: fillPlace(e.body, phrase, local, random),
    speciesId: e.species[0],
    cast: e.species.length > 1 ? e.species.slice(0, 4) : undefined,
    cameo: e.species[0],
    setting: 'sky',
  };
}
