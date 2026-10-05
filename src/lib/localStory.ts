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

import type { LocalNames, Moment, Period, PlaceKind, Season, Species, StorySlide } from '@/content/types';
import type { LiveMap } from './live';
import { pick, seededRandom, shuffle } from './random';
import { buildStory } from './story';

const FEATURED = 4; // species moments per story
const MIN_SCENES = 3;

export type LocalStoryInput = {
  moments: Moment[];
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
 * with the neighborhood's real spots. */
export function fillPlace(text: string, phrase: string, local?: LocalNames): string {
  let out = text.split('{place}').join(phrase).split('{where}').join(phrase);
  if (local) {
    for (const key of ['green', 'water', 'landmark', 'street'] as const) out = out.split(`{${key}}`).join(local[key]);
  }
  return out;
}

export function buildLocalStory(input: LocalStoryInput): StorySlide[] {
  const { moments, slides, residents, allSpecies, season, period, placeKind, placeName, where, local, live, seed } = input;
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
      title: fillPlace(variant.title, phrase, local),
      body: fillPlace(variant.body, phrase, local),
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

  return [...featured, ...chapters];
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
