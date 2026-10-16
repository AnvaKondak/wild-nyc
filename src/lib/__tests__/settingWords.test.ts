import { getSpecies } from '@/content';
import type { StorySlide } from '@/content/types';
import { actionFromWords, countInWords, crowdFromWords, settingFromWords, withSettings } from '../settingWords';

const slide = (title: string, body: string, setting?: StorySlide['setting']): StorySlide => ({ id: 'x', season: 'winter', period: 'midday', kicker: '', title, body, kind: 'scene', setting });

describe('settingFromWords', () => {
  it('reads where the words put them', () => {
    expect(settingFromWords('Sitting puffed up on sunny wires, soaking in every bit of warmth.')).toBe('wire');
    expect(settingFromWords("a few twigs on a fire escape, somehow enough")).toBe('fire-escape');
    expect(settingFromWords('Curled up in a hollow, tail over their nose')).toBe('den');
    expect(settingFromWords('Gathering in small groups to pick seeds off the ground in parks and yards.')).toBe('lawn');
    expect(settingFromWords('Paddling along the edge of the pond')).toBe('water');
    expect(settingFromWords('Calling from deep in the hedge')).toBe('hedge');
    expect(settingFromWords('Peregrine nests on bridges and tall buildings are protected. Enjoy them from the street.')).toBe('ledge');
  });

  it('ignores place names filled into the text', () => {
    expect(settingFromWords('A robin is singing near Shore Road Park')).toBe(undefined);
    expect(settingFromWords('The jays are noisy along Bedford Avenue')).toBe(undefined);
  });
});

describe('withSettings', () => {
  it('puts the mourning dove on the wire when the words say wire', () => {
    const dove = getSpecies('mourning-dove')!;
    const [s] = withSettings([slide('The mourning doves this winter', dove.rightNow.winter, 'lawn')]);
    expect(s.setting).toBe('wire');
  });

  it('keeps the slide\'s own setting when the words name no place', () => {
    const [s] = withSettings([slide('Hello there', 'Just saying hi.', 'branch')]);
    expect(s.setting).toBe('branch');
  });
});

describe('actionFromWords', () => {
  it('reads what they are doing', () => {
    expect(actionFromWords('A sparrow is taking a dust bath in the planter')).toBe('dust');
    expect(actionFromWords('Curled up in a hollow, fast asleep')).toBe('sleep');
    expect(actionFromWords('A pigeon is sipping from a puddle')).toBe('drink');
    expect(actionFromWords('Gulls are wheeling over the harbor')).toBe('fly');
    expect(actionFromWords('Hello there')).toBeUndefined();
  });

  it('puts a dust bath on the ground', () => {
    expect(settingFromWords('A sparrow is taking a dust bath')).toBe('sidewalk');
  });
});

describe('crowdFromWords', () => {
  it('reads how many are in the picture', () => {
    expect(crowdFromWords('A pigeon is bobbing down the sidewalk', '', 'rock-pigeon')).toEqual({ count: 1, young: 0 });
    expect(crowdFromWords('Two pigeons are preening each other', '', 'rock-pigeon')).toEqual({ count: 2, young: 0 });
    expect(crowdFromWords('The sparrows are taking a dust bath', '', 'house-sparrow')).toEqual({ count: 3, young: 0 });
    expect(crowdFromWords('A pigeon couple is getting cozy', '', 'rock-pigeon')).toEqual({ count: 2, young: 0 });
    expect(crowdFromWords('The deer are grazing at the edge of the woods', '', 'white-tailed-deer')).toEqual({ count: 3, young: 0 });
    expect(crowdFromWords('A deer is grazing', '', 'white-tailed-deer')).toEqual({ count: 1, young: 0 });
  });

  it('draws a parent with little ones', () => {
    expect(crowdFromWords('A squirrel mom is checking on her babies', '', 'eastern-gray-squirrel')).toEqual({ count: 3, young: 2 });
    expect(crowdFromWords('A deer mom and her fawn are out together', '', 'white-tailed-deer')).toEqual({ count: 2, young: 1 });
  });

  it('lets the body add a pair, never take anyone away', () => {
    expect(crowdFromWords('A dove is on the wire', 'Side by side with their partner.', 'mourning-dove')).toEqual({ count: 2, young: 0 });
  });
});

describe('withSettings crowds', () => {
  it('shows at least two on a family slide', () => {
    const [s] = withSettings([{ ...slide('Cozy couples', 'Pairs stay close all winter.'), id: 'rock-pigeon:family', speciesId: 'rock-pigeon' }]);
    expect(s.crowd?.count).toBeGreaterThanOrEqual(2);
  });
});

describe('countInWords', () => {
  it('counts only the words about that neighbor', () => {
    const text = 'Three crows are taking turns swooping at a red-tailed hawk on a branch.';
    expect(countInWords(text, 'american-crow')).toBe(2);
    expect(countInWords(text, 'red-tailed-hawk')).toBe(1);
    expect(countInWords('Two night owls, one trash can. A raccoon and an opossum arrive.', 'raccoon')).toBe(1);
  });
});
