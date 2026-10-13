import { getSpecies } from '@/content';
import type { StorySlide } from '@/content/types';
import { settingFromWords, withSettings } from '../settingWords';

const slide = (title: string, body: string, setting?: StorySlide['setting']): StorySlide => ({ id: 'x', season: 'winter', period: 'midday', kicker: '', title, body, kind: 'scene', setting });

describe('settingFromWords', () => {
  it('reads where the words put them', () => {
    expect(settingFromWords('Sitting puffed up on sunny wires, soaking in every bit of warmth.')).toBe('wire');
    expect(settingFromWords("a few twigs on a fire escape, somehow enough")).toBe('fire-escape');
    expect(settingFromWords('Curled up in a hollow, tail over their nose')).toBe('den');
    expect(settingFromWords('Gathering in small groups to pick seeds off the ground in parks and yards.')).toBe('lawn');
    expect(settingFromWords('Paddling along the edge of the pond')).toBe('water');
    expect(settingFromWords('Calling from deep in the hedge')).toBe('hedge');
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
