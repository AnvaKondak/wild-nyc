import { lowerName, possessive } from '../names';

describe('names in sentences', () => {
  it('lowercases ordinary words and keeps names', () => {
    expect(lowerName('Blue Jays')).toBe('blue jays');
    expect(lowerName('Canada Geese')).toBe('Canada geese');
    expect(lowerName("Cooper's Hawks")).toBe("Cooper's hawks");
  });

  it('makes possessives that read right', () => {
    expect(possessive('robins')).toBe("robins'");
    expect(possessive('white-tailed deer')).toBe("white-tailed deer's");
    expect(possessive('brant')).toBe("brant's");
  });
});
