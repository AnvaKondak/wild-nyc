// The "Tomorrow" teaser at the end of the story: a reason to come back that never
// guilts. Picks the most interesting true thing about tomorrow, in this order:
//
//   1. someone due to arrive for the season within the week,
//   2. a migration wind tonight (north winds carry birds south in fall, south winds
//      carry them north in spring),
//   3. first frost, snow, rain or a hot day in tomorrow's forecast,
//   4. otherwise, tomorrow morning's neighbor.

import type { Species, StorySlide } from '@/content/types';
import { fillPlace, placePhrase } from './localStory';
import { pickLead, poolFor, type StoryContext, type StoryPlace } from './neighborStory';
import { dateKey, seasonOf } from './time';
import type { Forecast } from './weather';

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Days until this species' usual arrival date, if it's within the coming week. */
export function arrivingWithin(s: Species, today: Date, days = 7): number | null {
  if (!s.arrives) return null;
  const [m, d] = s.arrives.split('-').map(Number);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (const year of [start.getFullYear(), start.getFullYear() + 1]) {
    const diff = Math.round((new Date(year, m - 1, d).getTime() - start.getTime()) / DAY);
    if (diff >= 1 && diff <= days) return diff;
  }
  return null;
}

/** Is the wind coming from the north (fall migrants ride it) or the south (spring)? */
const fromNorth = (deg: number) => deg >= 300 || deg <= 60;
const fromSouth = (deg: number) => deg >= 120 && deg <= 240;

export type TomorrowInput = {
  places: StoryPlace[];
  index: number;
  ctx: StoryContext;
  now: Date;
  forecast?: Forecast;
  random: () => number;
};

export function buildTomorrow({ places, index, ctx, now, forecast, random }: TomorrowInput): StorySlide {
  const place = places[index];
  const phrase = placePhrase(place.placeName, place.where);
  const fill = (text: string) => fillPlace(text, phrase, place.local, random);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const season = seasonOf(tomorrow);
  const pool = poolFor(place.kind, { ...ctx, season }, place.placeId);
  const has = (id: string) => ctx.allSpecies.find((s) => s.id === id && s.seasons.includes(season));
  const slide = (title: string, body: string, speciesId?: string): StorySlide => ({
    id: 'tomorrow',
    season,
    period: 'any',
    kind: 'tomorrow',
    kicker: 'Tomorrow',
    title,
    body: fill(body),
    speciesId,
    cta: 'See you tomorrow',
  });

  // 1. Someone due this week, who'll live here.
  const due = ctx.allSpecies
    .filter((s) => (s.onlyAt ? !!place.placeId && s.onlyAt.includes(place.placeId) : s.spots[place.kind] && !s.sightingsOnly))
    .map((s) => ({ s, days: arrivingWithin(s, now) }))
    .filter((x): x is { s: Species; days: number } => x.days !== null)
    .sort((a, b) => a.days - b.days)[0];
  if (due) {
    const [m, d] = due.s.arrives!.split('-').map(Number);
    const name = due.s.friendlyName.toLowerCase();
    const spot = due.s.homeScene === 'waterfront' ? '{water}' : due.s.homeScene === 'park' ? '{green}' : '{street}';
    return slide(
      due.days === 1 ? `The ${name} are due any day now` : `The ${name} are due this week`,
      `They usually reach NYC and Jersey City around ${MONTHS[m - 1]} ${d}. Keep an eye out near ${spot}: one morning, there they'll be.`,
      due.s.id,
    );
  }

  if (forecast) {
    // 2. A migration wind tonight.
    if (season === 'fall' && fromNorth(forecast.windFrom) && forecast.windMph >= 8) {
      const who = has('white-throated-sparrow') ?? has('yellow-rumped-warbler');
      return slide('A north wind tonight', 'Migrating birds wait for winds like this and ride them south in the dark. Tomorrow morning, look for new faces in the hedges and trees near {green}.', who?.id);
    }
    if (season === 'spring' && fromSouth(forecast.windFrom) && forecast.windMph >= 8) {
      const who = has('yellow-rumped-warbler') ?? has('gray-catbird');
      return slide('A south wind tonight', 'Spring travelers ride warm south winds north through the night. Tomorrow morning, the trees near {green} could be full of birds who weren\'t there today.', who?.id);
    }
    // 3. Weather you'll notice.
    if (forecast.sky === 'snow') return slide('Snow tomorrow', 'The juncos will be in their element, and every hop and paw print will show. Look for tracks along {street}.', has('dark-eyed-junco')?.id ?? has('eastern-gray-squirrel')?.id);
    if ((season === 'fall' || season === 'spring') && forecast.lowF <= 33) {
      return slide('Frost tomorrow morning', 'The grass will crunch and the last crickets will go quiet. Look for birds fluffed up into round little balls near {green}.', has('house-sparrow')?.id);
    }
    if (forecast.sky === 'rain' || forecast.sky === 'storm' || forecast.sky === 'drizzle') {
      return slide('Rain tomorrow', 'Rain brings the worms up. The robins will be busy on the lawns near {green}, and the ducks won\'t mind at all.', has('american-robin')?.id ?? has('mallard')?.id);
    }
    if (forecast.highF >= 88) return slide('A hot one tomorrow', 'Look for squirrels splooting flat on shady branches and birds with their beaks open in the shade near {green}.', has('eastern-gray-squirrel')?.id);
  }

  // 4. Tomorrow morning's neighbor.
  const morning = { ...ctx, season, period: 'dawn' as const, weather: [] };
  const yesterday = dateKey(now);
  const lead = pickLead(places, index, morning, dateKey(tomorrow), yesterday) ?? pool[0];
  return slide(
    `Tomorrow morning: the ${lead.friendlyName.toLowerCase()}`,
    `${lead.rightNow[season]} Come say good morning ${phrase}.`,
    lead.id,
  );
}
