// Migrants who just arrived for the season (white-throated sparrows in late September,
// chimney swifts in late April). For about three weeks after their usual arrival date,
// their arrival story opens the Right now story and they're first in "Also around today".

import type { LocalNames, Species, StorySlide, WeatherTag } from '@/content/types';
import { fillPlace } from './localStory';
import { seasonOf } from './time';

export const JUST_ARRIVED_DAYS = 21;
const DAY = 24 * 60 * 60 * 1000;

/** Days since this year's (or last year's) usual arrival date, or null for residents. */
export function daysSinceArrival(s: Species, today: Date): number | null {
  if (!s.arrives) return null;
  const [m, d] = s.arrives.split('-').map(Number);
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let arrival = new Date(today.getFullYear(), m - 1, d);
  if (arrival > day) arrival = new Date(today.getFullYear() - 1, m - 1, d);
  return Math.round((day.getTime() - arrival.getTime()) / DAY);
}

export function justArrived(s: Species, today: Date): boolean {
  const days = daysSinceArrival(s, today);
  return days !== null && days < JUST_ARRIVED_DAYS;
}

/** Newest arrivals first. */
export function arrivalsAmong(pool: Species[], today: Date): Species[] {
  return pool.filter((s) => justArrived(s, today)).sort((a, b) => daysSinceArrival(a, today)! - daysSinceArrival(b, today)!);
}

/**
 * Their arrival story (the season's "Arriving" journey from stories.json), told as
 * "Just arrived", with a line for tonight's weather when it fits.
 */
export function arrivalSlide(
  s: Species,
  journeys: StorySlide[],
  today: Date,
  phrase: string,
  local: LocalNames,
  weather: WeatherTag[],
  random: () => number,
): StorySlide | undefined {
  const [m, d] = s.arrives!.split('-').map(Number);
  const season = seasonOf(new Date(today.getFullYear(), m - 1, d));
  const mine = journeys.filter((j) => j.kind === 'arriving' && j.speciesId === s.id);
  const j = mine.find((x) => x.season === season) ?? mine[0];
  if (!j) return undefined;
  const note = weather.map((t) => j.weatherNote?.[t]).find(Boolean);
  const fill = (text: string) => fillPlace(text, phrase, local, random);
  return {
    ...j,
    id: `arrived:${s.id}`,
    kind: 'scene',
    kicker: 'Just arrived',
    title: fill(j.title),
    body: fill(note ? `${j.body} ${note}` : j.body),
    setting: 'sky',
    photoIndex: 3, // not the photo their own story opens with
  };
}
