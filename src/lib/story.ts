// Builds the Right now story for one place, season and time of day.

import type { Period, PlaceKind, Season, StorySlide } from '@/content/types';

type Options = {
  season: Season;
  period: Period;
  placeKind: PlaceKind;
  /** Replaces {where} in slide text: "on your block", "in the park"… */
  where: string;
};

/**
 * Scene slides for (season × period) in this kind of place, then the season's
 * Arriving and Goodbye chapter slides, with {where} filled in.
 */
export function buildStory(all: StorySlide[], { season, period, placeKind, where }: Options): StorySlide[] {
  const inPlace = (s: StorySlide) => !s.places || s.places.includes(placeKind);
  const inSeason = all.filter((s) => s.season === season && inPlace(s));

  const scenes = inSeason.filter((s) => (s.kind ?? 'scene') === 'scene' && s.period === period);
  const arriving = inSeason.filter((s) => s.kind === 'arriving');
  const goodbye = inSeason.filter((s) => s.kind === 'goodbye');

  return [...scenes, ...arriving, ...goodbye].map((s) => ({
    ...s,
    body: s.body.split('{where}').join(where),
    title: s.title.split('{where}').join(where),
  }));
}
