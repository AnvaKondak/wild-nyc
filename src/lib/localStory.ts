// Builds the Right now story around who's actually been seen near this neighborhood.
//
//   1. Rank the species who live in this kind of place this season: seen nearby
//      lately first (live data), the rest in a seeded shuffle.
//   2. Take the first few who have a moment for this season and time of day, and
//      pick one variant of each, again seeded.
//   3. Top up with the generic slides if there aren't enough.
//   4. The season's Arriving and Goodbye chapters.
//
// Every slide is about one species; the story never lists species.
//
// The seed is neighborhood + date + time of day, so the story holds still while
// you look at it, changes tomorrow, and differs down the street.

import type { Fact, LocalNames, Moment, Period, PlaceKind, Season, Setting, Species, StorySlide } from '@/content/types';
import type { LiveMap } from './live';
import { pick, seededRandom, shuffle } from './random';
import { buildStory } from './story';

const FEATURED = 10; // species moments per story
const MIN_SCENES = 3;

export type LocalStoryInput = {
  moments: Moment[];
  facts: Fact[];
  slides: StorySlide[];
  /** Species who live in this kind of place and are around this season. */
  residents: Species[];
  allSpecies: Species[];
  season: Season;
  period: Period;
  placeKind: PlaceKind;
  /** "Liberty State Park", or null for an unnamed spot. */
  placeName: string | null;
  /** Fallback phrase for an unnamed spot: "on your block". */
  where: string;
  /** Real local spots ({green}, {water}, {landmark}, {street}), or generic stand-ins. */
  local: LocalNames;
  live: LiveMap;
  seed: string;
};

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

export function buildLocalStory(input: LocalStoryInput): StorySlide[] {
  const { moments, facts, slides, residents, allSpecies, season, period, placeKind, placeName, where, local, live, seed } = input;
  const random = seededRandom(seed);
  const phrase = placePhrase(placeName, where);

  // 1. Who to feature. Live data can add species the place list doesn't expect.
  const liveExtras = allSpecies.filter((s) => s.seasons.includes(season) && (live.get(s.id)?.recent ?? 0) > 0);
  const pool = uniqueById([...residents, ...liveExtras]);
  const seenLately = pool
    .filter((s) => (live.get(s.id)?.recent ?? 0) > 0)
    .sort((a, b) => live.get(b.id)!.recent - live.get(a.id)!.recent);
  const rest = shuffle(pool.filter((s) => !seenLately.includes(s)), random);
  const ranked = [...seenLately, ...rest];

  // 2. One moment each, for this season and time of day.
  const featured: StorySlide[] = [];
  for (const s of ranked) {
    if (featured.length >= FEATURED) break;
    const options = moments.filter((m) => m.speciesId === s.id && m.seasons.includes(season) && m.periods.includes(period));
    if (options.length === 0) continue;
    const moment = pick(options, random);
    const variant = pickVariant(moment, placeName !== null, random);
    featured.push({
      id: `${moment.id}:${moment.variants.indexOf(variant)}`,
      season,
      period,
      kicker: moment.kicker,
      title: fillPlace(withLocation(variant.title, moment.setting, placeKind, random), phrase, local, random),
      body: fillPlace(variant.body, phrase, local, random),
      speciesId: s.id,
      setting: moment.setting,
      kind: 'scene',
    });
  }

  // 3. Generic slides top up a thin story (and cover species without moments yet).
  const generic = buildStory(slides, { season, period, placeKind, where: phrase });
  const genericScenes = generic.filter((s) => (s.kind ?? 'scene') === 'scene');
  const chapters = generic.filter((s) => s.kind === 'arriving' || s.kind === 'goodbye');
  const featuredSpecies = new Set(featured.map((s) => s.speciesId));
  for (const s of genericScenes) {
    if (featured.length >= MIN_SCENES) break;
    if (s.speciesId && featuredSpecies.has(s.speciesId)) continue;
    featured.push(s);
  }

  // A fun fact on every species slide, fitting the season and time of day.
  return [...featured, ...chapters].map((s) => (s.speciesId ? { ...s, fact: pickFact(facts, s.speciesId, season, period, random) } : s));
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
function pickVariant(moment: Moment, named: boolean, random: () => number) {
  const local = moment.variants.filter((v) => LOCAL_SPOT.test(v.title + v.body));
  if (named && local.length > 0 && random() < 0.65) return pick(local, random);
  return pick(moment.variants, random);
}

function uniqueById(list: Species[]): Species[] {
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}
