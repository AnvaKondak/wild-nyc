// The favorites story: one slide per favorite, telling what that kind of animal is up to
// right now, this season and time of day. Where they are comes from the sightings
// snapshot: near one of your saved neighborhoods if they're recorded there, otherwise
// the place in the city they're recorded most. Always at neighborhood level, never an
// exact spot. Out of season, they're away; at the wrong end of the day, napping.

import type { Mood, Place, PlaceKind, Species, StorySlide } from '@/content/types';
import { fillPlace, placePhrase, pickVariant, usableVariants, withLocation } from './localStory';
import { lowerName } from './names';
import { momentsNow, type StoryContext, type StoryPlace } from './neighborStory';
import { pick, seededRandom } from './random';
import { recordedHere } from './sightings';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export type FavoritesInput = {
  favorites: string[];
  ctx: StoryContext;
  /** The person's saved neighborhoods, Home first. */
  saved: StoryPlace[];
  /** Every named place, to find where a favorite is recorded most. */
  places: Place[];
  /** "where" phrases and local names for unnamed kinds of places ("on your block"). */
  kinds: Record<PlaceKind, { where: string; local: StoryPlace['local'] }>;
  /** Today, so the story is steady for the day and new tomorrow. */
  date: string;
};

/** Where to tell a favorite's moment: one of your places, the city's best spot for them, or anywhere. */
function whereFor(s: Species, { ctx, saved, places, kinds }: FavoritesInput): { place: StoryPlace; status: string; near: boolean } {
  const mine = saved.find((p) => recordedHere(s, ctx.sightings, p.placeId, ctx.season));
  if (mine) return { place: mine, status: `Near ${mine.placeName ?? 'you'}`, near: true };
  const best = places
    .filter((p) => recordedHere(s, ctx.sightings, p.id, ctx.season))
    .map((p) => ({ p, n: ctx.sightings?.[p.id]?.[ctx.season]?.[s.id] ?? 0 }))
    .sort((a, b) => b.n - a.n)[0]?.p;
  if (best) {
    return {
      place: { cell: best.id, kind: best.kind, placeName: best.name, where: kinds[best.kind].where, local: best.local, placeId: best.id },
      status: `Around ${best.name}`,
      near: false,
    };
  }
  const kind = s.homeScene;
  return { place: { cell: kind, kind, placeName: null, where: kinds[kind].where, local: kinds[kind].local }, status: 'Around the city', near: false };
}

/** Asleep at this time of day: night animals by day, day animals at night. */
function asleep(s: Species, ctx: StoryContext): boolean {
  const day = ctx.period === 'dawn' || ctx.period === 'midday';
  return s.nocturnal ? day : ctx.period === 'night';
}

function favoriteSlide(s: Species, input: FavoritesInput, n: number, total: number): StorySlide {
  const { ctx, date } = input;
  const random = seededRandom(`${date}:${ctx.period}:${s.id}:favorite`);
  const name = lowerName(s.friendlyName);
  const base = {
    id: `favorite:${s.id}`,
    season: ctx.season,
    period: ctx.period,
    kind: 'favorite' as const,
    speciesId: s.id,
    cta: `Meet the ${name}`,
    kicker: `Your favorites · ${n} of ${total}`,
  };

  // Out of season: away, and back around their usual date.
  if (!s.seasons.includes(ctx.season)) {
    const back = s.arrives ? MONTHS[Number(s.arrives.slice(0, 2)) - 1] : undefined;
    return {
      ...base,
      title: `The ${name} are away for the ${ctx.season}`,
      body: s.rightNow[ctx.season],
      status: back ? `Away until ${back}` : `Away for the ${ctx.season}`,
      setting: 'sky',
      scene: s.homeScene,
      mood: 'sleepy',
    };
  }

  const where = whereFor(s, input);
  const phrase = placePhrase(where.place.placeName, where.place.where);
  const fill = (text: string) => fillPlace(text, phrase, where.place.local, random);
  const { weather, everyday } = momentsNow(s.id, ctx);
  const moment = weather.length > 0 ? pick(weather, random) : everyday.length > 0 ? pick(everyday, random) : undefined;
  const sleeping = asleep(s, ctx);
  const mood: Mood | undefined = sleeping ? 'sleepy' : undefined;
  if (!moment) {
    return { ...base, title: `The ${name} right now`, body: s.rightNow[ctx.season], status: sleeping ? 'Napping' : where.status, scene: where.place.kind, mood };
  }
  const v = pickVariant(usableVariants(moment, ctx.weather), where.place.placeName !== null, random);
  return {
    ...base,
    title: fill(withLocation(v.title, moment.setting, where.place.kind, random)),
    body: fill(v.body),
    status: sleeping ? 'Napping' : where.status,
    setting: moment.setting,
    scene: where.place.kind,
    placeId: where.place.placeId,
    mood,
  };
}

/** The whole favorites story: a slide per favorite, then all of them to jump between. */
export function favoritesStory(input: FavoritesInput): StorySlide[] {
  const { ctx } = input;
  const favs = input.favorites.map((id) => ctx.allSpecies.find((s) => s.id === id)).filter((s): s is Species => !!s);
  if (favs.length === 0) {
    return [
      {
        id: 'favorites-empty',
        season: ctx.season,
        period: ctx.period,
        kind: 'favorites-empty',
        kicker: 'Your favorites',
        title: 'No favorites yet',
        body: "Tap the ♥ on any neighbor's story or page, and they'll show up here with what they're doing right now, wherever they are in the city.",
        cta: 'Find a neighbor to love',
      },
    ];
  }
  return [
    ...favs.map((s, i) => favoriteSlide(s, input, i + 1, favs.length)),
    {
      id: 'favorites',
      season: ctx.season,
      period: ctx.period,
      kind: 'favorites',
      kicker: 'Your favorites',
      title: 'All your favorites',
      body: 'Tap someone to jump back to them.',
      aroundSpecies: favs.map((s) => s.id),
    },
  ];
}
