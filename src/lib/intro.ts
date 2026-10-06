// The first slide of every story: where we are, what time it is, what the air feels
// like, and who's up and who's asleep. "It's dawn in Park Slope. 54°, misty and cool.
// Fog is lying low over Prospect Park… The robins, the sparrows and the squirrels are
// waking up. The raccoons are heading to bed."

import type { LocalNames, Period, Season, Species, StorySlide } from '@/content/types';
import { fillPlace, placePhrase } from './localStory';
import { pick } from './random';
import { describeWeather, type Sky, type Weather } from './weather';

type SkyGroup = 'clear' | 'gray' | 'rain' | 'snow' | 'fog' | 'unknown';

function skyGroup(sky: Sky | undefined): SkyGroup {
  if (!sky) return 'unknown';
  if (sky === 'drizzle' || sky === 'storm') return 'rain';
  if (sky === 'cloudy') return 'gray';
  return sky;
}

/** What the neighborhood looks like right now. Unknown weather makes no claims about the sky. */
const SCENE: Record<Period, Record<SkyGroup, string[]>> = {
  dawn: {
    clear: ['The sun is just peeking up over {landmark}, and the light on {street} is turning gold.', 'The sky behind {landmark} is going peach, then pink, then bright.'],
    gray: ['The sky over {street} is going from dark gray to pale gray, slow and soft.'],
    rain: ['Rain is tapping on the awnings along {street}, and the puddles are catching the first light.'],
    snow: ['Snow is falling quietly on {street}, and everything is hushed and blue.'],
    fog: ['Fog is lying low over {green}, and the streetlights are glowing like little moons.'],
    unknown: ['The first light is coming up over {street}.'],
  },
  midday: {
    clear: ['The sun is high over {green}, and the shadows are short.', 'Sunlight is bouncing off the windows along {street}.'],
    gray: ['Clouds are sitting low and soft over {street}.'],
    rain: ['Rain is running down the windows along {street}, and {green} smells green and new.'],
    snow: ['Snow is piling up on the benches and branches around {green}.'],
    fog: ['Fog is drifting through {green}, and the far side has disappeared.'],
    unknown: ['The day is in full swing along {street}.'],
  },
  dusk: {
    clear: ['The sky over {landmark} is going pink and gold, and the streetlights are flickering on.'],
    gray: ['The gray light over {street} is fading, and windows are lighting up one by one.'],
    rain: ['Rain is shining under the streetlights on {street}, and the gutters are gurgling.'],
    snow: ['Snow is glowing blue in the last light around {green}.'],
    fog: ['Fog is rolling in over {water}, and the lights are going soft and fuzzy.'],
    unknown: ['The light is fading over {street}.'],
  },
  night: {
    clear: ['The moon is up over {landmark}, and {street} is quiet.', 'Stars are poking through the city glow over {green}.'],
    gray: ['It\'s dark and cloudy over {street}, and the city glow is bouncing off the clouds.'],
    rain: ['Rain is pattering on the leaves around {green}, and the street is shiny and black.'],
    snow: ['Snow is falling through the streetlight glow on {street}, soft and silent.'],
    fog: ['Fog is wrapped around the streetlights on {street}.'],
    unknown: ['It\'s dark and quiet along {street}.'],
  },
};

const FEEL = {
  wind: 'The wind is pushing the treetops around and rattling the signs.',
  heat: 'The air is thick and warm, and the sidewalks are giving off heat.',
  cold: 'The air is sharp, cold enough to see your breath.',
};

const KICKER: Record<Period, string> = { dawn: 'Good morning', midday: 'Hello, neighbor', dusk: 'Good evening', night: 'Good night' };
const WORD: Record<Period, string> = { dawn: 'dawn', midday: 'midday', dusk: 'dusk', night: 'nighttime' };
const UP: Record<Period, string> = { dawn: 'waking up', midday: 'out and about', dusk: 'still out', night: 'out' };
const WHEN: Record<Period, string> = { dawn: 'This morning', midday: 'Today', dusk: 'This evening', night: 'Tonight' };

/** "the robins, the sparrows and the squirrels". Friendly names are plural, so it's always "are". */
export function listNames(list: Species[]): string {
  const names = list.map((s) => `the ${s.friendlyName.toLowerCase()}`);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type IntroInput = {
  period: Period;
  season: Season;
  weather: Weather | null;
  placeName: string | null;
  /** "on your block", for an unnamed spot. */
  where: string;
  local: LocalNames;
  /** Who the story follows today. */
  lead?: Species;
  /** Others around right now. The first few are "up". */
  featured: Species[];
  /** Everyone who lives here this season, for who's asleep. */
  residents: Species[];
  random: () => number;
};

export function buildIntro({ period, season, weather, placeName, where, local, lead, featured, residents, random }: IntroInput): StorySlide {
  const night = period === 'night';
  // By day, the night crowd is asleep; at night, the day crowd is.
  // At night, the night crowd who live here are up even if the story isn't about them.
  const awake = [...featured, ...(night ? residents : [])].filter((s, i, all) => !!s.nocturnal === night && all.indexOf(s) === i && s.id !== lead?.id).slice(0, 3);
  const sleepers = residents.filter((s) => !!s.nocturnal !== night && !awake.includes(s) && s.id !== lead?.id);
  const asleep = night ? sleepers.filter((s) => featured.every((f) => f.id !== s.id)).slice(0, 2) : sleepers.slice(0, 2);

  const parts: string[] = [];
  if (weather) parts.push(`It's ${describeWeather(weather)}.`);
  parts.push(fillPlace(pick(SCENE[period][skyGroup(weather?.sky)], random), placePhrase(placeName, where), local, random));
  for (const tag of ['wind', 'heat', 'cold'] as const) if (weather?.tags.includes(tag)) parts.push(FEEL[tag]);
  if (awake.length > 0) parts.push(`${cap(listNames(awake))} are ${UP[period]}.`);
  if (asleep.length > 0) {
    // At dusk the night crowd is waking up rather than asleep.
    const verb: Record<Period, string> = { dawn: 'heading to bed', midday: 'fast asleep', dusk: 'just waking up', night: 'tucked in for the night' };
    parts.push(`${cap(listNames(asleep))} are ${verb[period]}.`);
  }
  if (lead) parts.push(`${WHEN[period]}, let's follow ${listNames([lead])}.`);

  return {
    id: 'intro',
    season,
    period,
    kind: 'intro',
    kicker: KICKER[period],
    title: placeName ? `It's ${WORD[period]} in ${placeName}` : `It's ${WORD[period]} ${where}`,
    body: parts.join(' '),
    cta: lead ? `Follow ${listNames([lead])}` : 'Meet the neighbors',
    introSpecies: [...(lead ? [lead] : []), ...awake].slice(0, 3).map((s) => s.id),
  };
}
