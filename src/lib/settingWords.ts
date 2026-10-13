// Pictures follow the words: the scene behind a slide comes from what the slide says.
// "Sitting puffed up on sunny wires" puts them on a wire; "a few twigs on a fire escape"
// puts them on a fire escape. Most specific first ("a hollow tree" is a den, not a
// branch). Only lowercase words count, so place names filled into the text ("near Shore
// Road Park", "along Bedford Avenue") never move anyone.

import type { Setting, StorySlide } from '@/content/types';

const RULES: [RegExp, Setting][] = [
  [/\bfire escapes?\b/, 'fire-escape'],
  [/\b(webs?|spinning|silk)\b/, 'web'],
  [/\b(hollows?|dens?|burrows?|holes? in|tree holes?|attics?)\b/, 'den'],
  [/\b(flying|flies|fly over|soaring|soars|circling|circles|wheeling|overhead|in the air|on the wing|migrating|flock(?:s)? (?:over|across))\b/, 'sky'],
  [/\b(bridges?|tall buildings?|skyscrapers?|towers?|steeples?|spires?|high ledges?|up high)\b/, 'ledge'],
  [/\b(wires?|power lines?|phone lines?|telephone lines?|cables?)\b/, 'wire'],
  [/\b(windowsills?|window sills?|sills?|ledges?|air conditioners?|cornices?)\b/, 'ledge'],
  [/\b(rooftops?|roofs?|chimneys?|water towers?)\b/, 'rooftop'],
  [/\b(piers?|docks?|pilings?|posts? in the water)\b/, 'pier'],
  [/\b(beach|sand|shore|shoreline|mudflats?|tide line)\b/, 'shore'],
  [/\b(reeds?|cattails?|marsh(?:es)?)\b/, 'reeds'],
  [/\b(ponds?|lakes?|rivers?|harbor|water|swimming|swims|paddling|floating|dabbling|diving|puddles?|bath(?:ing)? in water)\b/, 'water'],
  [/\b(hedges?|bushes|bush|shrubs?|thickets?|tangles?|brambles?)\b/, 'hedge'],
  [/\b(flowers?|blossoms?|milkweed|clover|goldenrod|asters?|blooms?)\b/, 'flowers'],
  [/\b(trunks?|bark)\b/, 'trunk'],
  [/\b(fences?|railings?)\b/, 'fence'],
  [/\b(trash ?cans?|garbage|bins?)\b/, 'trashcan'],
  [/\b(streetlights?|street lights?|lamp ?posts?)\b/, 'streetlight'],
  [/\b(sidewalks?|street|curbs?|stoops?|cafés?|cafes?|crumbs)\b/, 'sidewalk'],
  [/\b(lawns?|grass|fields?|meadows?|on the ground|ground|yards?|leaf litter|dirt|dust)\b/, 'lawn'],
  [/\b(branch(?:es)?|treetops?|trees?|twigs?|oaks?|limbs?)\b/, 'branch'],
];

/** The setting a piece of text describes, if it names one (lowercase words only). */
export function settingFromWords(text: string): Setting | undefined {
  for (const [re, setting] of RULES) if (re.test(text)) return setting;
  return undefined;
}

/**
 * The scene for each slide: what the title says, else what the body says, else the
 * slide's own setting. So a slide that only inherited its setting (the season, family
 * or goodbye slides) gets the place its own words describe.
 */
export function withSettings(slides: StorySlide[]): StorySlide[] {
  return slides.map((slide) => {
    const said = settingFromWords(slide.title) ?? settingFromWords(slide.body);
    return said && said !== slide.setting ? { ...slide, setting: said } : slide;
  });
}
