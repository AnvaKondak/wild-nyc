// The Right now story follows one neighbor: today's lead for this neighborhood and
// time of day. Then an "Also around today" card offers a few others, each with their
// own short story.
//
// Who leads is a seeded, weighted pick, so it holds still while you look and changes
// through the day. The weights make neighborhoods feel like themselves: animals whose
// home is this kind of place, who live in fewer kinds of places (pigeons are
// everywhere; brant are not), who were seen nearby lately, or who have something to
// say about today's weather.

import type { Encounter, Fact, LocalNames, Moment, Period, PlaceKind, SeasonChapter, Season, Species, StorySlide, WeatherTag } from '@/content/types';
import type { LiveMap } from './live';
import { fillPlace, pickFact, pickVariant, placePhrase, usableVariants, withLocation } from './localStory';
import { pick, seededRandom, shuffle } from './random';

const PERIODS: Period[] = ['dawn', 'midday', 'dusk', 'night'];
const AROUND = 6;

export type StoryPlace = {
  cell: string;
  kind: PlaceKind;
  /** "Liberty State Park", or null for an unnamed spot. */
  placeName: string | null;
  /** "on your block", for an unnamed spot. */
  where: string;
  local: LocalNames;
  /** The bundled place this is, if any (some neighbors live only in certain places). */
  placeId?: string;
};

export type StoryContext = {
  allSpecies: Species[];
  moments: Moment[];
  facts: Fact[];
  chapters: SeasonChapter[];
  season: Season;
  period: Period;
  live: LiveMap;
  weather: WeatherTag[];
  /** Two-neighbor encounters, for the middle of a story. */
  encounters?: Encounter[];
};

/**
 * Who lives here this season: everyone at home in this kind of place, plus neighbors
 * who only live in certain places (deer on Staten Island) when this is one of them,
 * plus anyone live data has seen nearby lately (when the optional server is running).
 */
export function poolFor(kind: PlaceKind, ctx: Pick<StoryContext, 'allSpecies' | 'season' | 'live'>, placeId?: string): Species[] {
  const seen = (s: Species) => (ctx.live.get(s.id)?.recent ?? 0) > 0;
  const lives = (s: Species) => (s.onlyAt ? !!placeId && s.onlyAt.includes(placeId) : !!s.spots[kind] && !s.sightingsOnly);
  return ctx.allSpecies.filter((s) => s.seasons.includes(ctx.season) && (lives(s) || seen(s)));
}

/** Moments for this species right now: weather ones when the weather fits, else everyday ones that don't clash. */
export function momentsNow(speciesId: string, ctx: Pick<StoryContext, 'moments' | 'season' | 'period' | 'weather'>): { weather: Moment[]; everyday: Moment[] } {
  const now = ctx.moments.filter((m) => m.speciesId === speciesId && m.seasons.includes(ctx.season) && m.periods.includes(ctx.period));
  return {
    weather: now.filter((m) => m.weather?.some((t) => ctx.weather.includes(t))),
    everyday: now.filter((m) => !m.weather && usableVariants(m, ctx.weather).length > 0),
  };
}

/** How likely this species is to lead here right now. 0 means they can't (nothing to say). */
export function leadWeight(s: Species, kind: PlaceKind, ctx: StoryContext): number {
  const { weather, everyday } = momentsNow(s.id, ctx);
  const count = weather.length + everyday.length;
  if (count === 0) return 0;
  let w = 1;
  if (s.homeScene === kind) w *= 2.2;
  const kinds = Object.keys(s.spots).length;
  if (kinds >= 3) w *= 0.35; // everywhere, so they don't make a place feel like itself
  else if (kinds === 1) w *= 1.6;
  if ((ctx.live.get(s.id)?.recent ?? 0) > 0) w *= 2.5;
  if (weather.length > 0) w *= 1.8;
  // After dark, follow someone who's up: raccoons and night herons beat a sleeping jay.
  if (ctx.period === 'night') w *= s.nocturnal ? 3 : 0.6;
  if (count === 1) w *= 0.4; // a thin story; better to lead with someone who has more
  return w;
}

function weightedPick<T>(items: { item: T; w: number }[], random: () => number): T | undefined {
  const total = items.reduce((sum, x) => sum + x.w, 0);
  if (total <= 0) return undefined;
  let r = random() * total;
  for (const x of items) {
    r -= x.w;
    if (r < 0) return x.item;
  }
  return items.at(-1)?.item;
}

function pickOnce(place: StoryPlace, ctx: StoryContext, date: string, exclude: Set<string>): Species | undefined {
  const pool = poolFor(place.kind, ctx, place.placeId).filter((s) => !exclude.has(s.id));
  const random = seededRandom(`${place.cell}:${date}:${ctx.period}:lead`);
  return weightedPick(pool.map((s) => ({ item: s, w: leadWeight(s, place.kind, ctx) })), random);
}

/**
 * Today's lead for each time of day in `places[index]`. Someone new each time of day,
 * and never whoever leads the same time in a saved neighborhood listed earlier, so
 * your places don't all open on the same animal. Whoever led at this time yesterday is
 * skipped too (approximately: yesterday's first choice, before its own exclusions).
 */
export function pickLead(places: StoryPlace[], index: number, ctx: StoryContext, date: string, yesterday: string): Species | undefined {
  const memo = new Map<string, Species | undefined>();
  const lead = (i: number, period: Period): Species | undefined => {
    const key = `${i}:${period}`;
    if (memo.has(key)) return memo.get(key);
    const at = { ...ctx, period };
    const exclude = new Set<string>();
    const add = (s: Species | undefined) => s && exclude.add(s.id);
    add(pickOnce(places[i], at, yesterday, new Set()));
    for (const q of PERIODS.slice(0, PERIODS.indexOf(period))) add(lead(i, q));
    for (let j = 0; j < i; j++) add(lead(j, period));
    // If the exclusions leave nobody, fall back to an unrestricted pick.
    const out = pickOnce(places[i], at, date, exclude) ?? pickOnce(places[i], at, date, new Set());
    memo.set(key, out);
    return out;
  };
  return lead(index, ctx.period);
}

/**
 * The best encounter for this neighbor right now: one with `favor` (the lead, when
 * visiting someone else) if there is one, else with someone around today, else with
 * anyone who lives here. Encounters need both neighbors to be around this season.
 */
export function pickEncounter(s: Species, ctx: StoryContext, here: Set<string>, today: Set<string>, random: () => number, favor?: string): Encounter | undefined {
  const fits = (ctx.encounters ?? []).filter(
    (e) => e.species.includes(s.id) && e.seasons.includes(ctx.season) && (!e.periods || e.periods.includes(ctx.period)),
  );
  const other = (e: Encounter) => (e.species[0] === s.id ? e.species[1] : e.species[0]);
  for (const ok of [(id: string) => id === favor, (id: string) => today.has(id), (id: string) => here.has(id)]) {
    const best = fits.filter((e) => ok(other(e)));
    if (best.length > 0) return pick(best, random);
  }
  return undefined;
}

export type ArcOptions = {
  /** Who's around today (the lead and "Also around today"), so encounters are with them. */
  today?: string[];
  /** On a visit: the day's lead, so the two stories mention each other. */
  favor?: string;
};

/**
 * One neighbor's story, with a beginning, a middle and an end:
 *
 *   1. Right now: what they're doing (in this weather, when it fits).
 *   2. Then…: they run into a neighbor who's around today (or a chapter story).
 *   3. Meanwhile: another moment.
 *   4. This season: the bigger picture.
 *   5. Before you go: how to be a good neighbor to them.
 *
 * A visit (from "Also around today") gets 1, 2 and 5.
 */
export function buildArc(s: Species, place: StoryPlace, ctx: StoryContext, role: 'lead' | 'visit', random: () => number, opts: ArcOptions = {}): StorySlide[] {
  const { season, period } = ctx;
  const phrase = placePhrase(place.placeName, place.where);
  const fill = (text: string) => fillPlace(text, phrase, place.local, random);
  const { weather, everyday } = momentsNow(s.id, ctx);
  const named = place.placeName !== null;
  const friendly = s.friendlyName.toLowerCase();
  const slides: StorySlide[] = [];
  const usedFacts = new Set<string>();
  const fact = () => {
    for (let i = 0; i < 4; i++) {
      const f = pickFact(ctx.facts, s.id, season, period, random);
      if (f && !usedFacts.has(f)) {
        usedFacts.add(f);
        return f;
      }
    }
    return undefined;
  };

  const momentSlide = (m: Moment, kicker = m.kicker): StorySlide => {
    const v = pickVariant(usableVariants(m, ctx.weather), named, random);
    return {
      id: `${m.id}:${m.variants.indexOf(v)}`,
      season,
      period,
      kicker,
      title: fill(withLocation(v.title, m.setting, place.kind, random)),
      body: fill(v.body),
      speciesId: s.id,
      setting: m.setting,
      kind: 'scene',
      fact: fact(),
    };
  };

  // 1. The beginning: right now. Weather first when it fits.
  const first = weather.length > 0 ? pick(weather, random) : everyday.length > 0 ? pick(everyday, random) : undefined;
  if (first) slides.push(momentSlide(first));

  // 2. The middle: they run into a neighbor. Someone around today if possible.
  const here = new Set(poolFor(place.kind, ctx, place.placeId).map((x) => x.id));
  const today = new Set(opts.today ?? []);
  const meet = pickEncounter(s, ctx, here, today, random, opts.favor);
  if (meet) {
    const other = meet.species[0] === s.id ? meet.species[1] : meet.species[0];
    slides.push({
      id: `${s.id}:meets:${meet.id}`,
      season,
      period,
      kicker: 'Then…',
      title: fill(meet.title),
      body: fill(meet.body),
      speciesId: s.id,
      cast: [s.id, other],
      cameo: other,
      setting: first?.setting,
      kind: 'scene',
    });
  } else {
    const together = ctx.chapters.find((c) => c.season === season)?.stories.filter((st) => st.species.includes(s.id)) ?? [];
    if (together.length > 0) {
      const st = pick(together, random);
      slides.push({
        id: `${s.id}:together:${st.id}`,
        season,
        period,
        kicker: 'Then…',
        title: st.title,
        body: st.body,
        speciesId: s.id,
        cast: st.species.slice(0, 4),
        cameo: st.species.find((id) => id !== s.id),
        setting: first?.setting,
        kind: 'scene',
      });
    }
  }

  // 3. Meanwhile: another moment. Every neighbor gets a whole story, lead or not.
  const rest = shuffle([...weather, ...everyday].filter((m) => m !== first), random);
  if (rest[0]) slides.push(momentSlide(rest[0], 'Meanwhile'));
  // A visit gets one more moment when there is one, so it isn't over in a blink.
  if (role === 'visit' && !meet && rest[1]) slides.push(momentSlide(rest[1], 'Later'));

  // 4. The bigger picture: their season, in this place.
  slides.push({
    id: `${s.id}:season`,
    season,
    period,
    kicker: `This ${season}`,
    title: `The ${friendly}' ${season} ${phrase}`,
    body: s.rightNow[season],
    speciesId: s.id,
    setting: first?.setting,
    kind: 'scene',
  });

  // 5. The end: how to be a good neighbor to them.
  slides.push({
    id: `${s.id}:kindness`,
    season,
    period,
    kicker: `Before you go · Be a good neighbor ${phrase}`,
    title: s.kindness.title.replace(/[.!]$/, ''),
    body: s.kindness.body,
    speciesId: s.id,
    setting: first?.setting,
    kind: 'scene',
  });
  // A different photo on each slide, so the story doesn't repeat one picture.
  return slides.map((slide, i) => ({ ...slide, photoIndex: i }));
}

/**
 * Others around right now, for "Also around today": anyone who just arrived for the
 * season first, then those seen lately, then a seeded mix that leans local.
 */
export function pickAround(place: StoryPlace, ctx: StoryContext, lead: Species | undefined, seed: string, arrived: Species[] = []): Species[] {
  const random = seededRandom(`${seed}:around`);
  const pool = poolFor(place.kind, ctx, place.placeId).filter((s) => s.id !== lead?.id && leadWeight(s, place.kind, ctx) > 0);
  const seen = pool.filter((s) => (ctx.live.get(s.id)?.recent ?? 0) > 0).sort((a, b) => ctx.live.get(b.id)!.recent - ctx.live.get(a.id)!.recent);
  const newcomers = arrived.filter((s) => s.id !== lead?.id && pool.includes(s));
  const out = [...newcomers, ...seen.filter((s) => !newcomers.includes(s))].slice(0, AROUND);
  let rest = pool.filter((s) => !out.includes(s));
  while (out.length < AROUND && rest.length > 0) {
    const next = weightedPick(rest.map((s) => ({ item: s, w: leadWeight(s, place.kind, ctx) })), random)!;
    out.push(next);
    rest = rest.filter((s) => s !== next);
  }
  return out;
}

/** The last card: who else is around, to tap into. */
export function aroundSlide(place: StoryPlace, ctx: StoryContext, around: Species[], lead: Species | undefined, arrived: Species[] = []): StorySlide {
  const phrase = placePhrase(place.placeName, place.where);
  return {
    id: 'around',
    season: ctx.season,
    period: ctx.period,
    kind: 'around',
    kicker: `More neighbors ${phrase}`,
    title: 'Also around today',
    body: 'Tap someone to see what they\'re up to.',
    aroundSpecies: [...(lead ? [lead.id] : []), ...around.map((s) => s.id)],
    arrivedSpecies: arrived.map((s) => s.id),
    cta: 'Start over',
  };
}
