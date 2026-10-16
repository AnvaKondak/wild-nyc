import { closeUpFor, planCloseUp } from '../CloseUp';

describe('planCloseUp', () => {
  it('draws one neighbor by default', () => {
    const plan = planCloseUp('rock-pigeon', 'sidewalk');
    expect(plan?.scene).toBe('building');
    expect(plan?.figures).toHaveLength(1);
  });

  it('puts a few of them in one dust bath, all bathing', () => {
    const plan = planCloseUp('house-sparrow', 'sidewalk', 'dust', { crowd: { count: 3, young: 0 } })!;
    expect(plan.figures).toHaveLength(3);
    expect(plan.figures.every((f) => f.action === 'dust')).toBe(true);
  });

  it('faces a pair toward each other', () => {
    const plan = planCloseUp('rock-pigeon', 'ledge', undefined, { crowd: { count: 2, young: 0 } })!;
    expect(plan.figures.filter((f) => f.flip)).toHaveLength(1);
  });

  it('draws little ones smaller, behind a parent', () => {
    const plan = planCloseUp('mallard', 'water', undefined, { crowd: { count: 3, young: 2 } })!;
    const [parent, ...kids] = plan.figures;
    expect(kids.every((k) => k.young && k.scale < parent.scale && k.x > parent.x)).toBe(true);
  });

  it('gives only one the straw at a puddle', () => {
    const plan = planCloseUp('rock-pigeon', 'water', 'drink', { crowd: { count: 2, young: 0 } })!;
    expect(plan.figures.filter((f) => f.action === 'drink')).toHaveLength(1);
  });

  it('keeps two in a hollow at most, and one on a web', () => {
    expect(planCloseUp('eastern-gray-squirrel', 'den', 'sleep', { crowd: { count: 3, young: 0 } })!.figures).toHaveLength(2);
    expect(planCloseUp('orb-weavers', 'web', undefined, { crowd: { count: 3, young: 0 } })!.figures).toHaveLength(1);
  });

  it('puts two different neighbors in one scene, facing each other', () => {
    const plan = planCloseUp('blue-jay', 'branch', undefined, { cast: ['blue-jay', 'eastern-gray-squirrel'] })!;
    expect(plan.scene).toBe('branch');
    expect(plan.figures.map((f) => f.id)).toEqual(['blue-jay', 'eastern-gray-squirrel']);
    expect(plan.figures[1].flip).toBe(true);
  });

  it('flies a bird in overhead when the words say flying', () => {
    const plan = planCloseUp('white-tailed-deer', 'lawn', 'fly', { cast: ['white-tailed-deer', 'red-tailed-hawk'] })!;
    const hawk = plan.figures.find((f) => f.id === 'red-tailed-hawk')!;
    expect(closeUpFor('white-tailed-deer', 'lawn')).toBe('lawn');
    expect(hawk.dy).toBeGreaterThan(0);
    expect(hawk.action).toBe('fly');
    expect(plan.figures[0].action).toBeUndefined();
  });

  it('meets a swimmer at the shore: one on the sand, one floating behind', () => {
    const plan = planCloseUp('rock-pigeon', 'sidewalk', undefined, { cast: ['rock-pigeon', 'mallard'] })!;
    expect(plan.scene).toBe('shore');
    expect(plan.figures.find((f) => f.id === 'mallard')!.dy).toBeGreaterThan(0);
  });

  it('draws as many of each as the words say, three at most', () => {
    const plan = planCloseUp('red-tailed-hawk', 'branch', 'fly', { cast: ['red-tailed-hawk', 'american-crow'], counts: { 'red-tailed-hawk': 1, 'american-crow': 2 } })!;
    expect(plan.figures.map((f) => f.id).sort()).toEqual(['american-crow', 'american-crow', 'red-tailed-hawk']);
  });

  it('puts a moth by the spider\'s web', () => {
    expect(planCloseUp('moths', 'lawn', undefined, { cast: ['moths', 'orb-weavers'] })?.scene).toBe('web');
  });
});
