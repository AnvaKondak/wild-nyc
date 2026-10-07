// Which drawing of a neighbor fits a slide: if the words say they're asleep, they're
// drawn asleep; eating, they're drawn with a snack; singing or playing, delighted.
// When the words don't say, the drawings take turns so a story doesn't repeat one.

import type { Mood, StorySlide } from '@/content/types';

const SLEEPY = /\b(asleep|sleeps?|sleeping|slept|naps?|napping|doz(e|es|ing)|snooz\w*|roost(s|ing)?|tucked in|curled up|hibernat\w*|dream\w*|bedtime|resting|hunker\w*)\b/;
const SNACK = /\b(eats?|eating|ate|snacks?|food|feed(s|ing)?|forag\w*|munch\w*|nibbl\w*|crumbs?|seeds?|berr(y|ies)|nuts?|acorns?|worms?|bugs?|insects?|hunt(s|ing)?|catch(es|ing)?|caught|fish(ing)?|prey|nectar|lunch|breakfast|dinner|meals?|peck(s|ing)?|gulp\w*|cach(e|es|ing)|stash\w*|bur(y|ies|ying)|grub\w*|sips?|sipping|drinks?)\b/;
const HAPPY = /\b(sings?|singing|songs?|play(s|ing|ful)?|fun|love\w*|court\w*|friends?|together|cuddl\w*|bath(es|ing)?|splash\w*|sunbath\w*|sunning|happy|joy\w*|danc\w*|chas(e|es|ing)|greet\w*|cozy|show(s|ing)? off|cheer\w*)\b/;

/** What the words of one slide suggest, if anything. */
export function moodFromWords(text: string): Mood | undefined {
  const t = text.toLowerCase();
  if (SLEEPY.test(t)) return 'sleepy';
  if (SNACK.test(t)) return 'snack';
  if (HAPPY.test(t)) return 'happy';
  return undefined;
}

/**
 * A mood for each slide. The words decide first (the title counts most, then the
 * body). Kindness slides are a warm goodbye: happy. Otherwise hello and happy take
 * turns, so two slides in a row don't show the same drawing.
 */
export function withMoods(slides: StorySlide[]): StorySlide[] {
  let last: Mood | undefined;
  return slides.map((slide) => {
    const kindness = slide.id.endsWith(':kindness');
    const said = kindness ? 'happy' : (moodFromWords(slide.title) ?? moodFromWords(slide.body));
    const mood: Mood = said ?? (last === 'hello' ? 'happy' : 'hello');
    last = mood;
    return { ...slide, mood };
  });
}
