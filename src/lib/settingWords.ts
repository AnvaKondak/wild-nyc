// Pictures follow the words: the scene behind a slide comes from what the slide says.
// "Sitting puffed up on sunny wires" puts them on a wire; "a few twigs on a fire escape"
// puts them on a fire escape. Most specific first ("a hollow tree" is a den, not a
// branch). Only lowercase words count, so place names filled into the text ("near Shore
// Road Park", "along Bedford Avenue") never move anyone.

import { getSpecies } from '@/content';
import type { Action, Crowd, Setting, StorySlide } from '@/content/types';

const RULES: [RegExp, Setting][] = [
  [/\bdust[- ]?bath/, 'sidewalk'],
  [/\bfire escapes?\b/, 'fire-escape'],
  [/\b(webs?|spinning|silk)\b/, 'web'],
  // A hive only when they're in it ("carrying water to cool the hive" happens at the water).
  [/\b(hollows?|dens?|burrows?|holes? in|tree holes?|attics?|(?:in|into|inside|at) (?:the|a|their) hive|hive door)\b/, 'den'],
  [/\b(flying|flies|fly over|soaring|soars|circling|circles|wheeling|overhead|in the air|on the wing|migrating|flock(?:s)? (?:over|across))\b/, 'sky'],
  [/\b(bridges?|tall buildings?|skyscrapers?|towers?|steeples?|spires?|high ledges?|up high)\b/, 'ledge'],
  [/\b(wires?|power lines?|phone lines?|telephone lines?|cables?)\b/, 'wire'],
  [/\b(windowsills?|window sills?|sills?|ledges?|air conditioners?|cornices?|eaves|under the bridge)\b/, 'ledge'],
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
  // Not twigs: those are usually nest material, carried to a ledge as often as a tree.
  [/\b(branch(?:es)?|treetops?|trees?|oaks?|limbs?)\b/, 'branch'],
];

/** The setting a piece of text describes, if it names one (lowercase words only). */
export function settingFromWords(text: string): Setting | undefined {
  for (const [re, setting] of RULES) if (re.test(text)) return setting;
  return undefined;
}

const ACTIONS: [RegExp, Action][] = [
  [/\b(drying|dry (?:their|its) wings|wings (?:out|spread|open|wide)|spread(?:ing)? (?:their )?wings|hanging (?:their )?wings)\b/, 'dry'],
  [/\bdust[- ]?bath/, 'dust'],
  [/\b(asleep|sleeps?|sleeping|napping|naps?|dozing|dozes|snoozing|roosting|tucked in|curled up)\b/, 'sleep'],
  [/\b(sips?|sipping|drinks?|drinking|slurp\w*)\b/, 'drink'],
  [/\b(flying|flies|soaring|soars|circling|wheeling|gliding|glides|on the wing|in flight|overhead|fly over|migrating)\b/, 'fly'],
];

/** What the words say they're doing, if it's something drawn differently. */
export function actionFromWords(text: string): Action | undefined {
  for (const [re, action] of ACTIONS) if (re.test(text)) return action;
  return undefined;
}

// How many are in the picture. "Two pigeons are preening each other" draws a pair;
// "The sparrows are taking a dust bath" draws a few; "A squirrel mom is checking on her
// babies" draws mom and two little ones. The title decides; the body can add a pair
// ("side by side") or little ones, never take anyone away.
const PAIR = /\b(two|pair|couple|both|twins|each other|side by side|partners?|mates?|duet)\b/;
const MANY = /\b(three|few|flocks?|famil(y|ies)|gang|groups?|crowds?|huddl\w*|bunch|everyone|everybody|together|rafts?|herds?|colon(y|ies)|pairs|couples|lines of|dozens?|hundreds?|thousands?|neighbors)\b/;
const YOUNG = /\b(bab(y|ies)|kids?|chicks?|youngsters?|young ones|young|fledglings?|kits?|squabs?|ducklings?|goslings?|cygnets?|fawns?|pups?|nestlings?|little ones|siblings?|juveniles?|teens?|brood|poults?)\b/;
const MANY_YOUNG = /\b(babies|kids|chicks|youngsters|young ones|fledglings|kits|squabs|ducklings|goslings|cygnets|fawns|pups|nestlings|little ones|siblings|juveniles|teens|brood|poults)\b/;

/** The species' name in a sentence: one ("pigeon") and several ("pigeons"). */
function namesOf(speciesId: string): { one: string; many: string } | undefined {
  const s = getSpecies(speciesId);
  if (!s) return undefined;
  const last = (name: string) => name.toLowerCase().split(' ').at(-1)!;
  return { one: last(s.commonName), many: last(s.friendlyName) };
}

/** How many of them the words put in the picture (1 to 3), and how many of those are little ones. */
export function crowdFromWords(title: string, body: string, speciesId: string | undefined, opts: { young?: 'title' | 'body' } = {}): Crowd {
  const t = title.toLowerCase();
  const b = body.toLowerCase();
  const names = speciesId ? namesOf(speciesId) : undefined;
  // "A pigeon is…", "One crow…": just them (unless the words go on to say a pair).
  const one = names ? new RegExp(`(^|\\b(a|an|one|this|that)\\s+([\\w'-]+\\s+)?)${names.one}\\b`).test(t) : /^(a|an|one)\b/.test(t);
  // "The pigeons are…"; for names that don't change (deer, brant), "the deer are…".
  const plural = !!names && (names.one !== names.many ? new RegExp(`\\b${names.many}\\b`).test(t) : new RegExp(`\\b${names.many} (are|were)\\b`).test(t));
  const single = one && !(names && names.one === names.many && plural);
  let count = PAIR.test(t) ? 2 : MANY.test(t) || (plural && !single) ? 3 : 1;
  if (count === 1 && PAIR.test(b)) count = 2;
  // Little ones only when the title is about them (a body can mention babies hidden away in a nest).
  const youngSaid = YOUNG.test(t) || (opts.young === 'body' && YOUNG.test(b));
  if (!youngSaid) return { count, young: 0 };
  // Little ones with a grown-up: one parent and one or two young.
  const young = MANY_YOUNG.test(t) || (opts.young === 'body' && MANY_YOUNG.test(b)) ? 2 : 1;
  return { count: 1 + young, young };
}

/**
 * How many of one species a sentence about several neighbors mentions: only words about
 * them count ("three crows", "the sparrows", "a pair of doves"), not "together" or "two
 * night owls" said of everyone. 1 or 2 (two stands in for a few).
 */
export function countInWords(text: string, speciesId: string): number {
  const names = namesOf(speciesId);
  if (!names) return 1;
  const t = text.toLowerCase();
  const name = `(?:${names.many}|${names.one})`;
  if (new RegExp(`\\b(two|three|four|a few|several|a pair of|a couple of|dozens of|hundreds of|a crowd of|a flock of|a gang of|a group of|a raft of|a family of)\\s+(?:[\\w'-]+\\s+)?${name}\\b`).test(t)) return 2;
  if (names.one !== names.many && new RegExp(`\\b${names.many}\\b`).test(t)) return 2;
  return 1;
}

/**
 * The scene for each slide: what the title says, else what the body says, else the
 * slide's own setting. So a slide that only inherited its setting (the season, family
 * or goodbye slides) gets the place its own words describe. Also who's in the picture:
 * one, a pair, a few, or a parent with little ones. Family slides always show at least two.
 */
export function withSettings(slides: StorySlide[]): StorySlide[] {
  return slides.map((slide) => {
    const said = settingFromWords(slide.title) ?? settingFromWords(slide.body);
    const action = actionFromWords(slide.title) ?? actionFromWords(slide.body);
    // Family slides are all about the young, so their body counts too.
    const family = slide.id.endsWith(':family');
    const crowd = slide.speciesId && !slide.cast ? crowdFromWords(slide.title, slide.body, slide.speciesId, { young: family ? 'body' : 'title' }) : undefined;
    if (crowd && family && crowd.count < 2) crowd.count = 2;
    // Two neighbors meeting: how many of each the words mention ("three crows… the hawk").
    const counts = slide.cast ? Object.fromEntries(slide.cast.map((id) => [id, countInWords(`${slide.title} ${slide.body}`, id)])) : undefined;
    return {
      ...slide,
      ...(counts ? { counts } : {}),
      ...(said ? { setting: said } : {}),
      ...(action ? { action } : {}),
      ...(crowd && crowd.count > 1 ? { crowd } : {}),
    };
  });
}
