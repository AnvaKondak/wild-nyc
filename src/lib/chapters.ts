// Chapters, as slides: each season's overview, the stories of neighbors together, and
// who's arriving and leaving. Each slide knows which neighbors it's about and which
// kind of place to draw behind them.

import { getSpecies, seasonChapters, stories } from '@/content';
import type { PlaceKind, Season } from '@/content/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type ChapterSlide = { id: string; kicker: string; title: string; body: string; species: string[]; place: PlaceKind };

/** The kind of place most of these neighbors call home, for the scene behind their story. */
export function placeFor(ids: string[]): PlaceKind {
  const count: Partial<Record<PlaceKind, number>> = {};
  for (const id of ids) {
    const home = getSpecies(id)?.homeScene;
    if (home) count[home] = (count[home] ?? 0) + 1;
  }
  return (Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] as PlaceKind) ?? 'park';
}

export function chapterSlides(season: Season): ChapterSlide[] {
  const chapter = seasonChapters.find((c) => c.season === season)!;
  const overviewCast = [...new Set(chapter.stories.map((st) => st.species[0]))].slice(0, 4);
  const journeys = stories
    .filter((s) => s.season === season && (s.kind === 'arriving' || s.kind === 'goodbye'))
    .sort((a, b) => Number(b.kind === 'arriving') - Number(a.kind === 'arriving'));
  return [
    { id: `${season}:overview`, kicker: `The ${season} chapter`, title: chapter.name, body: chapter.intro, species: overviewCast, place: 'park' },
    ...chapter.stories.map((st, n) => ({
      id: `${season}:${st.id}`,
      kicker: `${cap(season)} · Story ${n + 1} of ${chapter.stories.length}`,
      title: st.title,
      body: st.body,
      species: st.species,
      place: placeFor(st.species),
    })),
    ...journeys.map((j) => ({
      id: `${season}:${j.id}`,
      kicker: j.kind === 'arriving' ? `${cap(season)} · Arriving` : `${cap(season)} · Goodbye for now`,
      title: j.title,
      body: j.body.split('{where}').join('near you'),
      species: j.speciesId ? [j.speciesId] : [],
      place: placeFor(j.speciesId ? [j.speciesId] : []),
    })),
  ];
}

