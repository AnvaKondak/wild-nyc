// Which drawing of a neighbor fits a slide: if the words say they're asleep, they're
// drawn asleep; eating, they're drawn with a snack; singing, with music notes; startled,
// wide-eyed; puffed up in the cold, with snowflakes; checking something out, curious (a raised brow);
// playing, delighted. When the words don't say, the everyday drawings take turns so a
// story doesn't repeat one.

import type { Mood, StorySlide } from '@/content/types';

const SLEEPY = /\b(asleep|sleeps?|sleeping|slept|naps?|napping|doz(e|es|ing)|snooz\w*|roost(s|ing)?|tucked in|curled up|hibernat\w*|dream\w*|bedtime|resting|hunker\w*)\b/;
const SURPRISED = /\b(startl\w*|spook\w*|surpris\w*|alarm(s|ed)?|whoa|uh-oh|oops|sudden(ly)?|scatter(s|ed|ing)?|dive-bomb\w*|scold(s|ing)?|mob(s|bing)?|on alert|jumps?|bolts?|flinch\w*|yikes)\b/;
const SINGING = /\b(sings?|singing|sang|songs?|tunes?|whistl\w*|chirp\w*|trill\w*|coo(s|ing)?|warbl\w*|chorus|concerts?|serenad\w*|caw(s|ing)?|honk\w*|quack\w*|chatter\w*|calling|squawk\w*|hoot(s|ing)?|buzz(es|ing)?|duet)\b/;
const SNACK = /\b(eats?|eating|ate|snacks?|food|feed(s|ing)?|forag\w*|munch\w*|nibbl\w*|crumbs?|seeds?|berr(y|ies)|nuts?|acorns?|worms?|bugs?|insects?|hunt(s|ing)?|catch(es|ing)?|caught|fish(ing)?|prey|nectar|lunch|breakfast|dinner|meals?|peck(s|ing)?|gulp\w*|cach(e|es|ing)|stash\w*|bur(y|ies|ying)|grub\w*|sips?|sipping|drinks?)\b/;
// Not plain "cold": a "cold gray ocean" on a mild night shouldn't bring snowflakes.
const CHILLY = /\b(chilly|frost\w*|freez\w*|snow\w*|icy|shiver\w*|puff(s|ed|ing)? up|puffed|puffer|fluff(s|ed|ing)? up|down jacket|winter coats?|huddl\w*|bundled|in the cold|cold (morning|evening|night|day|air|wind|ledge|rooftop))\b/;
const HAPPY = /\b(play(s|ing|ful)?|fun|love\w*|court\w*|friends?|together|cuddl\w*|bath(es|ing)?|splash\w*|sunbath\w*|sunning|happy|joy\w*|danc\w*|chas(e|es|ing)|greet\w*|cozy|show(s|ing)? off|cheer\w*)\b/;
const CURIOUS = /\b(curious\w*|peek\w*|peer(s|ing)?|inspect\w*|investigat\w*|explor\w*|check(s|ing)?|watch(es|ing)?|keep(s|ing)? an eye|eyeing|sniff\w*|nos(y|ing)|look(s|ing)? around|tilt\w*|wonder\w*|scout\w*|studying)\b/;

/** What the words of one slide suggest, if anything. Strongest signal first. */
export function moodFromWords(text: string): Mood | undefined {
  const t = text.toLowerCase();
  if (SLEEPY.test(t)) return 'sleepy';
  if (SURPRISED.test(t)) return 'surprised';
  if (SINGING.test(t)) return 'singing';
  if (SNACK.test(t)) return 'snack';
  if (CHILLY.test(t)) return 'chilly';
  if (HAPPY.test(t)) return 'happy';
  if (CURIOUS.test(t)) return 'curious';
  return undefined;
}

/**
 * A mood for each slide. A mood already set (asleep, in the favorites story) stays;
 * otherwise the words decide (the title counts most, then the body). Kindness slides
 * are a warm goodbye: happy. Otherwise hello and happy take turns, so two slides in a
 * row don't show the same drawing.
 */
export function withMoods(slides: StorySlide[]): StorySlide[] {
  let last: Mood | undefined;
  return slides.map((slide) => {
    const kindness = slide.id.endsWith(':kindness');
    const said = slide.mood ?? (kindness ? 'happy' : (moodFromWords(slide.title) ?? moodFromWords(slide.body)));
    const mood: Mood = said ?? (last === 'hello' ? 'happy' : 'hello');
    last = mood;
    return { ...slide, mood };
  });
}
