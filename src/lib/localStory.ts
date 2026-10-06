// Shared pieces for building story slides: filling in a neighborhood's real places,
// making sure every title names somewhere, keeping lines true to the weather, and
// picking a fitting fun fact. The story itself is built in neighborStory.ts.

import type { Fact, LocalNames, Moment, Period, PlaceKind, Season, Setting, WeatherTag } from '@/content/types';
import { pick } from './random';

/** "near Liberty State Park", or the place kind's phrase ("on your block"). */
export function placePhrase(placeName: string | null, where: string): string {
  return placeName ? `near ${placeName}` : where;
}

/** Fills {place}/{where} with the place phrase and {green}/{water}/{landmark}/{street}
 * with one of the neighborhood's real spots (picked with `random`, or the first). */
export function fillPlace(text: string, phrase: string, local?: LocalNames, random?: () => number): string {
  let out = text.split('{place}').join(phrase).split('{where}').join(phrase);
  if (local) {
    out = out.replace(/\{(green|water|landmark|street)\}/g, (_, key: keyof LocalNames) => {
      const names = local[key];
      return random ? pick(names, random) : names[0];
    });
  }
  return out;
}

/** Which kind of spot a setting happens at. */
const SPOT_FOR_SETTING: Record<Setting, 'water' | 'green' | 'street' | 'sky'> = {
  water: 'water', shore: 'water', pier: 'water', reeds: 'water',
  lawn: 'green', flowers: 'green', branch: 'green', trunk: 'green', hedge: 'green', den: 'green', web: 'green',
  ledge: 'street', rooftop: 'street', wire: 'street', streetlight: 'street', sidewalk: 'street', trashcan: 'street', fence: 'street',
  sky: 'sky', 'night-sky': 'sky',
};

/**
 * Every story title names somewhere in the neighborhood. If a title doesn't already,
 * add a place that fits where the moment happens: water moments get "by the harbor"
 * or "at the waterfront", rooftop moments "along Seventh Avenue" or "near the Colgate
 * clock", and so on. Returned with placeholders, for fillPlace to finish.
 */
export function withLocation(title: string, setting: Setting, kind: PlaceKind, random: () => number): string {
  if (/\{(place|where|green|water|landmark|street)\}/.test(title)) return title;
  const options: Record<'water' | 'green' | 'street' | 'sky', string[]> = {
    water: ['by {water}', 'out on {water}', ...(kind === 'waterfront' ? ['at the waterfront'] : [])],
    green: ['near {green}', 'over by {green}', ...(kind === 'park' ? ['in the park'] : [])],
    street: ['along {street}', 'near {landmark}', ...(kind === 'block' ? ['on the block'] : [])],
    sky: ['above {street}', 'over {green}', ...(kind === 'waterfront' ? ['over {water}'] : [])],
  };
  return `${title} ${pick(options[SPOT_FOR_SETTING[setting]], random)}`;
}

/**
 * Words that would make an everyday line untrue in this weather: no sunbathing
 * turtles in the rain, no frosty hedges in a heat wave.
 */
const CLASHES: Record<WeatherTag, RegExp> = {
  rain: /\b(sun|sunny|sunshine|sunlight|sunbath\w*|bask\w*|dry|dust)\b/i,
  snow: /\b(sun|sunny|sunshine|sunbath\w*|bask\w*|hot|heat|warm day|mild|flowers?|blooms?)\b/i,
  fog: /\b(sunny|sunshine|sunlight|sunbath\w*|bask\w*|bright)\b/i,
  wind: /\b(still air|calm water|glassy)\b/i,
  heat: /\b(snow\w*|frost\w*|freez\w*|icy|ice|cold|chilly|shiver\w*)\b/i,
  cold: /\b(hot|heat|warm day|mild|sweat\w*)\b/i,
};

export function clashesWithWeather(text: string, weather: WeatherTag[]): boolean {
  return weather.some((t) => CLASHES[t].test(text));
}

export function usableVariants(moment: Moment, weather: WeatherTag[]) {
  if (moment.weather) return moment.variants;
  return moment.variants.filter((v) => !clashesWithWeather(`${v.title} ${v.body}`, weather));
}

/**
 * A fact that fits right now. Facts tagged for this season and/or time of day beat
 * general ones; facts tagged for a different season or time never show.
 */
export function pickFact(facts: Fact[], speciesId: string, season: Season, period: Period, random: () => number): string | undefined {
  const fitting = facts.filter(
    (f) => f.speciesId === speciesId && (!f.seasons || f.seasons.includes(season)) && (!f.periods || f.periods.includes(period)),
  );
  if (fitting.length === 0) return undefined;
  const score = (f: Fact) => (f.seasons ? 1 : 0) + (f.periods ? 1 : 0);
  const best = Math.max(...fitting.map(score));
  // The most specific facts win most of the time; general ones still get a turn.
  const pool = random() < 0.7 ? fitting.filter((f) => score(f) === best) : fitting;
  return pick(pool, random).text;
}

const LOCAL_SPOT = /\{(green|water|landmark|street)\}/;

/** In a named neighborhood, lean toward versions that mention its real spots. */
export function pickVariant(variants: Moment['variants'], named: boolean, random: () => number) {
  const local = variants.filter((v) => LOCAL_SPOT.test(v.title + v.body));
  if (named && local.length > 0 && random() < 0.65) return pick(local, random);
  return pick(variants, random);
}
