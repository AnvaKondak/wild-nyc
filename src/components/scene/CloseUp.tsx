// A close-up scene for a story slide, drawn to fill the whole screen: the animal right in
// their setting, instead of a round sticker over the wide neighborhood scene.
//
// Every story setting maps to one of a handful of scenes, picked to suit the animal's
// pose: a pink brownstone (ledges, fences, sidewalks, a puddle for walkers at the water),
// a tree branch, a tree trunk (for woodpeckers), a hedge, a lawn, flowers, a burrow, a
// wire under open sky, open sky (for fliers), a pond (for swimmers and waders), a shore
// or pier, reeds, and a web.
//
// The screen is built around the `band` where the sticker would sit: sky (or stone)
// above, the animal in the band, and the ground carrying on below, under the story card.
// Leaves follow the season; the sky shows the sun, moon, clouds, rain or snow.
//
// Motion is gentle and never visibly restarts: leaves flutter, ripples drift one way,
// rain and snow fall on seamless loops. Branches and animals hold still. Reduce Motion
// stops it all.

import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Action, Crowd, Mood, Period, PlaceKind, Season, Setting } from '@/content/types';
import { getSpecies } from '@/content';
import { inks, type Ink } from '../art/inks';
import type { Sky } from '@/lib/weather';
import { colors } from '@/theme/tokens';
import { useReduceMotion } from '../backdrop/motion';
import { Character, cutoutFeet, cutoutPose, hasCutout } from '../characters/Character';
import { cutoutXml } from '../characters/xml';
import { lookFor, type Building, type Landmark } from './looks';

export type CloseUpSetting =
  | 'building' | 'puddle' | 'branch' | 'trunk' | 'hedge' | 'lawn' | 'flowers' | 'burrow'
  | 'wire' | 'sky' | 'water' | 'wade' | 'shore' | 'pier' | 'reeds' | 'web' | 'fireescape' | 'highledge' | 'hollow';

// Who walks to the water rather than swims: at a puddle in the city.
const CITY_WALKERS = ['rock-pigeon', 'house-sparrow', 'european-starling', 'raccoon', 'eastern-gray-squirrel', 'american-robin', 'northern-cardinal'];
// Who lives in burrows and dens on the ground.
const BURROWERS = ['groundhog', 'virginia-opossum'];
// Never up in trees or on ledges.
const GROUND_ONLY = ['white-tailed-deer', 'canada-goose', 'groundhog', 'pond-slider'];
// Where each city walker's mouth is on their drawing (fractions), for the drinking straw.
const MOUTH: Record<string, [number, number]> = {
  'rock-pigeon': [0.12, 0.34],
  'eastern-gray-squirrel': [0.4, 0.49],
  raccoon: [0.45, 0.5],
};

/** The close-up scene for this animal in this setting, or nothing (then the sticker shows). */
// Who really does what. Only these get drawn doing it; for anyone else the action is ignored.
const SWIFT = 'chimney-swift';
// Sleep inside tree cavities: everyone else sleeps where they normally rest.
const HOLLOW_SLEEPERS = ['raccoon', 'eastern-gray-squirrel', 'downy-woodpecker', 'red-bellied-woodpecker', 'tufted-titmouse', 'european-starling'];
// Real dust-bathers.
const DUST_BATHERS = ['house-sparrow', 'song-sparrow', 'white-throated-sparrow'];

/** Does this neighbor really do this? (Squirrels don't fly; deer don't dust-bathe.) */
export function canDo(speciesId: string, action: Action): boolean {
  if (!hasCutout(speciesId)) return false;
  const pose = cutoutPose(speciesId);
  const bird = getSpecies(speciesId)?.group === 'birds';
  switch (action) {
    case 'fly':
      // Birds who are drawn perched or standing get wings; swimmers and fliers are drawn as they are.
      return bird && pose !== 'swim' && pose !== 'fly';
    case 'sleep':
      return speciesId !== SWIFT && pose !== 'web';
    case 'dust':
      return DUST_BATHERS.includes(speciesId);
    case 'drink':
      return CITY_WALKERS.includes(speciesId);
    case 'dry':
      return speciesId === 'double-crested-cormorant';
  }
}

/** Where they go to do it: a nap happens wherever that animal really sleeps. */
function sceneForAction(speciesId: string, action: Action): CloseUpSetting | undefined {
  const pose = cutoutPose(speciesId);
  if (action === 'fly') return 'sky';
  if (action === 'dust') return 'building';
  if (action === 'drink') return 'puddle';
  if (action === 'dry') return undefined; // wherever they are, wings spread
  if (HOLLOW_SLEEPERS.includes(speciesId)) return 'hollow';
  if (BURROWERS.includes(speciesId) || speciesId === 'groundhog') return 'burrow';
  if (pose === 'swim') return 'water';
  if (pose === 'stand' && getSpecies(speciesId)?.group !== 'birds') return 'lawn';
  return 'branch';
}

/** The close-up scene for this animal in this setting (and action), or nothing (then the sticker shows). */
export function closeUpFor(speciesId: string | undefined, setting: Setting | undefined, action?: Action): CloseUpSetting | undefined {
  if (!hasCutout(speciesId) || !setting) return undefined;
  // Swifts sleep clinging inside chimneys, which we don't draw: their sleeping slides keep the sticker.
  if (speciesId === SWIFT && action === 'sleep') return undefined;
  // Animals who never climb or perch (deer, geese, groundhogs) stay on the ground.
  if (GROUND_ONLY.includes(speciesId) && ['branch', 'trunk', 'ledge', 'rooftop', 'wire', 'fire-escape', 'sky', 'night-sky', 'fence', 'streetlight'].includes(setting) && action !== 'fly') {
    return 'lawn';
  }
  if (action && canDo(speciesId, action)) {
    const scene = sceneForAction(speciesId, action);
    if (scene) return scene;
  }
  const pose = cutoutPose(speciesId);
  if (pose === 'web') return 'web';
  if (pose === 'cling') return 'trunk';
  if (pose === 'fly') {
    if (setting === 'flowers' || setting === 'branch' || setting === 'hedge' || setting === 'fence') return 'flowers';
    if (setting === 'reeds' || setting === 'water') return 'reeds';
    if (setting === 'lawn' || setting === 'night-sky') return 'lawn';
    return 'sky';
  }
  if (pose === 'swim') return 'water';
  if (setting === 'fire-escape') return 'fireescape';
  if (pose === 'wade') return setting === 'branch' ? 'branch' : 'wade';
  switch (setting) {
    case 'branch':
    case 'trunk':
      return 'branch';
    case 'den':
      return BURROWERS.includes(speciesId) ? 'burrow' : HOLLOW_SLEEPERS.includes(speciesId) ? 'hollow' : 'branch';
    case 'hedge':
      return 'hedge';
    case 'lawn':
    case 'flowers':
      return 'lawn';
    case 'ledge':
    case 'rooftop':
      // Up high: a stone ledge with the city's rooftops far below.
      return 'highledge';
    case 'sidewalk':
    case 'fence':
    case 'trashcan':
    case 'streetlight':
      return 'building';
    case 'wire':
    case 'sky':
    case 'night-sky':
      return 'wire';
    case 'water':
      return CITY_WALKERS.includes(speciesId) ? 'puddle' : 'shore';
    case 'shore':
      return 'shore';
    case 'pier':
      return 'pier';
    case 'reeds':
      return pose === 'perch' ? 'reeds' : 'shore';
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------- friends and family

/**
 * One neighbor in a close-up: who, where along the ground (a fraction of the screen
 * width), how big (a fraction of the scene's usual size), how far above the ground (a
 * fraction of the band, for fliers), facing right instead of left, what they're doing,
 * and whether they're a little one (drawn as a baby where babies look different: fuzzy
 * ducklings, spotted fawns; otherwise as a small grown-up).
 */
export type Figure = { id: string; x: number; scale: number; dy?: number; flip?: boolean; action?: Action; young?: boolean };
export type Plan = { scene: CloseUpSetting; figures: Figure[] };

const PERCHES: CloseUpSetting[] = ['branch', 'wire', 'highledge', 'fireescape', 'reeds'];

/** Can this neighbor be drawn in this scene, as they really are (no ducks on wires, no deer on branches)? */
function fits(id: string, scene: CloseUpSetting): boolean {
  if (!hasCutout(id)) return false;
  const pose = cutoutPose(id);
  switch (scene) {
    case 'web':
    case 'trunk':
      return false;
    case 'water':
      return pose === 'swim';
    case 'wade':
      return pose === 'wade' || pose === 'swim';
    case 'flowers':
      return pose === 'fly';
    case 'sky':
      return pose === 'fly' || canDo(id, 'fly');
    case 'hollow':
      return HOLLOW_SLEEPERS.includes(id);
  }
  // Bugs hover over grass and hedges; swimmers, clingers and spiders stay in their own scenes.
  if (pose === 'fly') return scene === 'lawn' || scene === 'hedge' || scene === 'reeds';
  if (pose === 'swim' || pose === 'cling' || pose === 'web') return false;
  if (PERCHES.includes(scene)) {
    if (GROUND_ONLY.includes(id)) return false;
    if (scene === 'wire') return pose === 'perch';
    if (scene === 'reeds') return pose === 'perch' || pose === 'wade';
  }
  return true;
}

/**
 * Several of the same neighbor: a pair facing each other, a few in a row, or a parent
 * with little ones trailing behind. They all do the same thing (three sparrows in one
 * dust bath), except a drink: only one gets the straw, the others wait their turn.
 */
function layout(scene: CloseUpSetting, id: string, crowd: Crowd | undefined, action: Action | undefined): Figure[] {
  const place = PLACE[scene];
  const act = action && canDo(id, action) ? action : undefined;
  const max = scene === 'web' || scene === 'trunk' ? 1 : scene === 'hollow' ? 2 : 3;
  const count = Math.min(max, crowd?.count ?? 1);
  if (count <= 1) return [{ id, x: place.x, scale: 1, action: act }];
  const airy = scene === 'sky' || scene === 'flowers' || cutoutPose(id) === 'fly';
  const lift = (i: number) => (airy ? [0.06, -0.14, 0.12][i] : 0);
  if (act === 'drink') {
    // One at the puddle with the straw; the others line up behind.
    return [{ id, x: 0.46, scale: 0.86, action: act }, ...Array.from({ length: count - 1 }, (_, i) => ({ id, x: 0.84 - i * 0.03, scale: 0.56 - i * 0.08 }))];
  }
  const young = Math.min(crowd?.young ?? 0, count - 1);
  if (young > 0) {
    // The grown-up in front, the little ones following behind.
    const kids = young === 1 ? [0.72] : [0.64, 0.85];
    return [
      { id, x: 0.34, scale: 0.8, action: act, dy: lift(0) },
      ...kids.map((x, i) => ({ id, x, scale: 0.48, action: act, dy: lift(i + 1), young: true })),
    ];
  }
  if (scene === 'hollow') return [{ id, x: 0.38, scale: 0.66, flip: true, action: act }, { id, x: 0.63, scale: 0.66, action: act }];
  if (count === 2) return [{ id, x: 0.3, scale: 0.74, flip: true, action: act, dy: lift(0) }, { id, x: 0.7, scale: 0.74, action: act, dy: lift(1) }];
  return [0.2, 0.5, 0.8].map((x, i) => ({ id, x, scale: 0.62, flip: i === 0, action: act, dy: lift(i) }));
}

/**
 * Who's in the close-up and where. Alone, with others of their kind (from the words),
 * or with a different neighbor (an encounter): side by side and facing each other when
 * both belong in the scene; a bird who doesn't (a hawk over the lawn) flies in overhead;
 * otherwise they meet in the other one's place, if the lead belongs there too. Nothing
 * when the two can't be drawn together (the round group sticker shows instead).
 */
export function planCloseUp(speciesId: string | undefined, setting: Setting | undefined, action?: Action, opts: { crowd?: Crowd; cast?: string[] } = {}): Plan | undefined {
  const scene = closeUpFor(speciesId, setting, action);
  if (!scene || !speciesId) return undefined;
  const others = (opts.cast ?? []).filter((id) => id !== speciesId).slice(0, 2);
  if (others.length === 0) return { scene, figures: layout(scene, speciesId, opts.crowd, action) };
  if (!others.every(hasCutout)) return undefined;
  const together = (where: CloseUpSetting): Plan | undefined => {
    const act = (id: string) => (action && action !== 'drink' && canDo(id, action) ? action : undefined);
    const figures: Figure[] = [{ id: speciesId, x: 0.7, scale: 0.76, action: act(speciesId) }];
    let ground = 0;
    for (const id of others) {
      // Said to be flying (and the lead can't): overhead. Otherwise beside the lead if they belong here.
      if (act(id) === 'fly' && where !== 'sky') {
        figures.push({ id, x: 0.3, scale: 0.56, dy: 0.62, flip: true, action: 'fly' });
      } else if (fits(id, where)) {
        figures.push({ id, x: ground === 0 ? 0.3 : 0.12, scale: ground === 0 ? 0.76 : 0.6, flip: true, action: act(id) });
        ground++;
      } else if (canDo(id, 'fly') || cutoutPose(id) === 'fly') {
        figures.push({ id, x: 0.3, scale: 0.56, dy: 0.62, flip: true, action: cutoutPose(id) === 'fly' ? undefined : 'fly' });
      } else {
        return undefined;
      }
    }
    return { scene: where, figures };
  };
  const here = together(scene);
  if (here) return here;
  // Meet where the other one lives, if the lead belongs there too.
  const theirs = closeUpFor(others[0], setting);
  return theirs && theirs !== scene && fits(speciesId, theirs) ? together(theirs) : undefined;
}

/** A point on a Bézier curve (2 or 3 control points after the start). */
function bezier(pts: [number, number][], t: number): [number, number] {
  const n = pts.length - 1;
  const weights = n === 3 ? [1, 3, 3, 1] : [1, 2, 1];
  let x = 0;
  let y = 0;
  pts.forEach(([px, py], k) => {
    const c = weights[k] * (1 - t) ** (n - k) * t ** k;
    x += c * px;
    y += c * py;
  });
  return [x, y];
}

/** The curve's height under `x`, found by sampling. */
function curveY(pts: [number, number][], x: number): number {
  let best = pts[0][1];
  let gap = Infinity;
  for (let i = 0; i <= 48; i++) {
    const [px, py] = bezier(pts, i / 48);
    if (Math.abs(px - x) < gap) {
      gap = Math.abs(px - x);
      best = py;
    }
  }
  return best;
}

/**
 * Where to stand someone at `x` (screen points) when the scene's one animal would stand
 * at `x0` on `ground`: the same, except on the branch and the wire, which aren't level.
 */
function groundAt(scene: CloseUpSetting, w: number, ground: number, bh: number, x: number, x0: number): number {
  let curve: [number, number][] | undefined;
  if (scene === 'branch') {
    const t = bh * 0.07;
    curve = [[-w * 0.05, ground + t * 0.9], [w * 0.3, ground + t * 0.5], [w * 0.65, ground + t * 0.6], [w * 1.05, ground - t * 0.3]];
  } else if (scene === 'wire') {
    curve = [[w * 0.06 + 5, ground - bh * 0.02], [w * 0.55, ground + bh * 0.06], [w + 10, ground - bh * 0.04]];
  }
  return curve ? ground + curveY(curve, x) - curveY(curve, x0) : ground;
}

const INK = colors.ink;
const LEAVES: Record<Season, string[]> = {
  spring: ['#9BD27A', '#7FBF5A', '#FFB3CB'],
  summer: ['#3FA66B', '#5FC48E', '#2F8F5A'],
  fall: ['#F28C28', '#E5484D', '#FFD23F', '#E8A23C'],
  winter: [],
};
const WATER: Record<Period, string> = { dawn: '#9DB9F2', midday: '#8FB3E8', dusk: '#6F8FE0', night: '#3E4A78' };
const BARK = '#8A6247';
// A pink brownstone: dusty rose sandstone in big smooth blocks.
const BRICK: Record<Period, [string, string]> = { dawn: ['#E2BAB1', '#CEA59C'], midday: ['#D9AFA6', '#C49A91'], dusk: ['#B88E92', '#A37C80'], night: ['#5A4048', '#4A343C'] };
const PAVEMENT: Record<Period, string> = { dawn: '#E6E1EA', midday: '#DAD7E0', dusk: '#B9B6C8', night: '#55546A' };
const FAR: Record<Period, string> = { dawn: '#F2C4D4', midday: '#F2DFA0', dusk: '#4A6FE0', night: '#3B3A50' };
const GRASS: Record<Period, string> = { dawn: '#A9D394', midday: '#9CCB86', dusk: '#4C7A5A', night: '#2F4A3A' };
const SAND: Record<Period, string> = { dawn: '#F2DDBE', midday: '#EAD3AE', dusk: '#B9A07E', night: '#5A5046' };
const HEDGE: Record<Season, string[]> = { spring: ['#6FB45A', '#8DC772'], summer: ['#3E9A5E', '#56B070'], fall: ['#5E9A4E', '#C9873A'], winter: ['#4E7A5A', '#5E8A6A'] };

type Props = {
  setting: CloseUpSetting;
  speciesId: string;
  mood?: Mood | number;
  width: number;
  height: number;
  /** Where the sticker would sit, in screen points: the animal goes here. */
  band: { top: number; height: number };
  period: Period;
  season: Season;
  /** The time of day's background color, used for the sky. */
  sky: string;
  /** What the sky is doing, for the sun, moon, clouds, rain or snow. */
  weather?: Sky;
  /** Whose neighborhood this is: sets the building, the water and the landmark. */
  placeId?: string;
  placeKind?: PlaceKind;
  /** Which version of the scene, so the same animal doesn't always get the same view. */
  variant?: number;
  /** What they're doing: flying, sleeping, dust bathing or drinking. */
  action?: Action;
  /** Everyone in the picture (see planCloseUp). Omit for just this one neighbor. */
  figures?: Figure[];
};

/** Where the animal's feet go (from the band's top, as a fraction of its height) and how big they are, per scene. */
const PLACE: Record<CloseUpSetting, { ground: number; size: number; x: number }> = {
  building: { ground: 0.94, size: 1.0, x: 0.5 },
  puddle: { ground: 0.94, size: 1.0, x: 0.52 },
  branch: { ground: 0.8, size: 0.86, x: 0.5 },
  trunk: { ground: 0.95, size: 1.0, x: 0.42 },
  hedge: { ground: 0.94, size: 0.9, x: 0.5 },
  lawn: { ground: 0.94, size: 0.95, x: 0.5 },
  flowers: { ground: 0.72, size: 0.75, x: 0.5 },
  burrow: { ground: 0.94, size: 0.92, x: 0.42 },
  wire: { ground: 0.82, size: 0.82, x: 0.5 },
  sky: { ground: 0.75, size: 0.85, x: 0.5 },
  water: { ground: 0.82, size: 0.9, x: 0.5 },
  wade: { ground: 0.96, size: 1.05, x: 0.5 },
  shore: { ground: 0.94, size: 0.95, x: 0.5 },
  pier: { ground: 0.92, size: 0.95, x: 0.5 },
  reeds: { ground: 0.82, size: 0.8, x: 0.5 },
  web: { ground: 0.86, size: 0.95, x: 0.5 },
  fireescape: { ground: 0.84, size: 0.84, x: 0.5 },
  highledge: { ground: 0.86, size: 0.9, x: 0.46 },
  hollow: { ground: 0.86, size: 0.86, x: 0.5 },
};
const OPEN_SKY: CloseUpSetting[] = ['highledge', 'hollow', 'branch', 'trunk', 'hedge', 'lawn', 'flowers', 'burrow', 'wire', 'sky', 'water', 'wade', 'shore', 'pier', 'reeds', 'web'];

export function CloseUp({ setting, speciesId, mood, width: w, height: h, band, period, season, sky, weather, placeId, placeKind = 'block', variant = 0, action, figures }: Props) {
  const look = lookFor(placeId, placeKind);
  const bt = band.top;
  const bh = band.height;
  const place = PLACE[setting];
  const ground = bt + bh * place.ground;
  const cast = figures ?? [{ id: speciesId, x: place.x, scale: 1, action: action && canDo(speciesId, action) ? action : undefined }];
  // Where each one stands: their feet on the scene's ground (or perch), fliers lifted up.
  const spots = cast.map((f) => {
    // Little ones who look different from their parents have their own drawing.
    if (f.young && hasCutout(`${f.id}:young`)) f = { ...f, id: `${f.id}:young` };
    const size = bh * place.size * f.scale;
    const gx = w * f.x;
    const top = groundAt(setting, w, ground, bh, gx, w * place.x) - bh * (f.dy ?? 0) - size * cutoutFeet(f.id);
    return { f, size, top, left: gx - size * 0.45 };
  });
  // The first one leads: the web, the trunk and the straw are drawn around them.
  const { size, top, left } = spots[0];
  // Smaller ones (further back, or little) first, so the bigger ones stand in front.
  const animal = [...spots]
    .map((spot, i) => ({ ...spot, i }))
    .sort((a, b) => a.size - b.size)
    .map(({ f, size: s, top: y, left: x, i }) => (
      <View key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, transform: f.flip ? [{ scaleX: -1 }] : undefined }}>
        <Acting action={f.action} speciesId={f.id} size={s} setting={setting}>
          {/* Cormorants drying off are drawn with their wings spread wide. */}
          <Character speciesId={f.action === 'dry' && canDo(f.id, 'dry') ? `${f.id}:spread` : f.id} size={s} mood={mood} cutout />
        </Acting>
      </View>
    ));
  const horizon = bt + bh * 0.5; // the far shore, by the water
  const pavement = ground - bh * 0.08; // where the sidewalk starts
  const leaves = LEAVES[season];
  const city = setting === 'building' || setting === 'puddle';
  const watery = setting === 'water' || setting === 'wade' || setting === 'reeds' || setting === 'shore' || setting === 'pier';
  // How deep the water comes up, in front of whoever's in it.
  const waterline = setting === 'wade' ? bt + bh * 0.8 : ground;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: sky, overflow: 'hidden' }}>
      {OPEN_SKY.includes(setting) && <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} behind sunLeft={!!look.landmark && setting !== 'wire' && setting !== 'sky'} />}
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {city && (
          <>
            {/* Up close, the brownstone fills the whole screen. */}
            <Facade look={look.building} w={w} bottom={pavement} band={band} period={period} />
            <Cornice w={w} y={4} period={period} brackets={false} />
            <WallBranch y={bt} bh={bh} w={w} />
            <Sidewalk w={w} h={h} top={pavement} period={period} />
          </>
        )}
        {setting === 'hollow' && <Hollow w={w} h={h} ground={ground} bh={bh} period={period} season={season} />}
        {setting === 'highledge' && <HighLedge w={w} h={h} y={ground} bh={bh} bt={bt} period={period} look={look.building} variant={variant % 3} />}
        {setting === 'fireescape' && <FireEscape w={w} h={h} y={ground} bh={bh} period={period} look={look.building} />}
        {setting === 'puddle' && (
          <>
            <Ellipse cx={w * 0.3} cy={ground + bh * 0.03} rx={w * 0.2} ry={bh * 0.06} fill={WATER[period]} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${w * 0.2} ${ground + bh * 0.02} q${w * 0.04} -4 ${w * 0.08} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
        )}
        {/* The neighborhood's landmark, far off on the horizon, behind the trees or rooftops. */}
        {/* The Wonder Wheel only shows by the water; nothing peeks out from behind rooftops. */}
        {look.landmark && look.landmark !== 'wonder-wheel' && (setting === 'hedge' || setting === 'lawn' || setting === 'flowers' || setting === 'burrow') && (
          <LandmarkShape kind={look.landmark} x={w * 0.78} base={ground - bh * 0.22} size={bh * 0.75} period={period} top={bt} />
        )}
        {look.landmark && look.landmark !== 'wonder-wheel' && (setting === 'branch' || setting === 'web' || setting === 'trunk') && (
          <LandmarkShape kind={look.landmark} x={w * 0.78} base={ground + bh * (setting === 'trunk' ? 0.4 : 0.9)} size={bh * 0.75} period={period} top={bt} />
        )}
        {(setting === 'branch' || setting === 'web') && (
          <>
            <Treeline w={w} h={h} base={ground + bh * 0.9} period={period} season={season} />
            <Branch w={w} y={ground} bh={bh} />
          </>
        )}
        {setting === 'web' && <Web cx={left + size * 0.5} cy={top + size * 0.5} r={bh * 0.6} />}
        {setting === 'trunk' && <TrunkScene w={w} h={h} bt={bt} bh={bh} ground={ground} trunkX={left + size * 0.69} period={period} season={season} />}
        {(setting === 'hedge' || setting === 'lawn' || setting === 'flowers' || setting === 'burrow') && (
          <Park w={w} h={h} ground={setting === 'flowers' ? bt + bh * 0.94 : ground} bh={bh} period={period} season={season} />
        )}
        {setting === 'hedge' && <Hedge w={w} ground={ground} bh={bh} season={season} period={period} />}
        {setting === 'burrow' && <Burrow x={w * 0.78} ground={ground} bh={bh} />}
        {(setting === 'wire' || setting === 'sky') && <Skyline w={w} h={h} base={bt + bh * 1.25} bh={bh} period={period} />}
        {setting === 'wire' && <Wire w={w} y={ground} bh={bh} />}
        {watery && look.water === 'river' && <River w={w} h={h} horizon={horizon} period={period} landmark={look.landmark} top={bt} />}
        {watery && look.water === 'beach' && <Ocean w={w} h={h} horizon={horizon} period={period} landmark={look.landmark} top={bt} />}
        {watery && look.water === 'pond' && <Pond w={w} h={h} horizon={horizon} period={period} season={season} />}
        {setting === 'reeds' && <Reeds w={w} ground={ground} bh={bh} back />}
        {setting === 'reeds' && <BentReed w={w} y={ground} bh={bh} />}
        {setting === 'shore' && (look.water === 'river' ? <Pier w={w} h={h} top={ground - bh * 0.04} /> : <Shore w={w} h={h} top={ground - bh * 0.06} period={period} />)}
        {setting === 'pier' && <Pier w={w} h={h} top={ground - bh * 0.04} />}
      </Svg>

      {city && leaves.length > 0 && WALL_LEAVES.map((l, i) => <Leaf key={`w${i}`} {...l} w={w} y={bt} bh={bh} color={leaves[i % leaves.length]} />)}
      {(setting === 'branch' || setting === 'web') && leaves.length > 0 && BACK_LEAVES.map((l, i) => <Leaf key={i} {...l} w={w} y={ground} bh={bh} color={leaves[i % leaves.length]} />)}
      {(setting === 'water' || setting === 'wade' || setting === 'reeds') && <Ripples w={w} from={horizon} to={waterline} />}
      {animal}
      {(setting === 'water' || setting === 'wade') && (
        <>
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <Rect x={0} y={waterline} width={w} height={h - waterline} fill={WATER[period]} />
            <Path d={`M0 ${waterline} H${w}`} stroke={INK} strokeWidth={1} opacity={0.4} />
          </Svg>
          <Ripples w={w} from={waterline} to={h} />
        </>
      )}
      {setting === 'flowers' && (
        <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
          <Flowers w={w} ground={bt + bh * 0.94} bh={bh} period={period} />
        </Svg>
      )}
      {setting === 'reeds' && (
        <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
          <Reeds w={w} ground={ground + bh * 0.2} bh={bh} />
        </Svg>
      )}
      {setting === 'puddle' && action === 'drink' && canDo(speciesId, 'drink') && (
        // Standing tall, sipping through a bendy straw. (Pure silliness: they really just dip their beaks.)
        <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
          {(() => {
            const [mx, my] = MOUTH[speciesId] ?? [0.2, 0.37];
            const sx = left + size * mx;
            const sy = top + size * my;
            const px = w * 0.3;
            const py = ground + bh * 0.03;
            const d = `M${sx} ${sy} L${sx - 14} ${sy + 6} Q${sx - 26} ${sy + 10} ${sx - 26} ${sy + 22} L${px + 6} ${py}`;
            return (
              <G>
                <Path d={d} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Path d={d} stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Path d={d} stroke={colors.pink} strokeWidth={6} fill="none" strokeDasharray="6 6" strokeLinejoin="round" />
              </G>
            );
          })()}
        </Svg>
      )}
      {setting === 'hollow' && (
        <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
          {/* The lower lip of the hollow, in front, so they're snug inside. */}
          <Path d={`M${w * 0.24} ${ground - 4} Q${w * 0.5} ${ground + bh * 0.14} ${w * 0.76} ${ground - 4} L${w * 0.78} ${ground + 18} Q${w * 0.5} ${ground + bh * 0.24} ${w * 0.22} ${ground + 18} Z`} fill={BARK} stroke={INK} strokeWidth={1.5} />
        </Svg>
      )}
      {setting === 'branch' && leaves.length > 0 && FRONT_LEAVES.map((l, i) => <Leaf key={i} {...l} w={w} y={ground} bh={bh} color={leaves[(i + 1) % leaves.length]} />)}
      <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} />
    </View>
  );
}

// ---------------------------------------------------------------- actions

/** A smooth 0 → 1 → 0 loop (seamless: it starts and ends at the same place). */
function useSine(duration: number, still: boolean) {
  const t = useLinear(duration, still);
  return t;
}
// Where each bird's wings join their back, calculated from their drawing (see
// scripts/build_characters.js), so wings sprout from the shoulders on every body shape.
const shoulderOf = (id: string): [number, number] => cutoutXml[id]?.shoulder ?? [0.55, 0.48];

const WING_FILL = 'M0 52 C6 26 32 6 70 4 C80 4 90 6 98 10 L90 16 L97 20 L88 25 L94 30 L84 33 L88 39 L76 40 L78 46 L64 45 L62 51 C40 55 20 56 0 52 Z';
const WING_EDGE = 'M12 30 C22 16 40 6 70 4 C80 4 90 6 98 10 L90 16 L97 20 L88 25 L94 30 L84 33 L88 39 L76 40 L78 46 L64 45 L62 51 C46 53 32 54 18 53';
const wave = (t: Animated.Value, a: number | string, b: number | string) =>
  t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [a, b, a, b, a] as never });

/**
 * Wraps the animal in what they're doing, if they really do it (see canDo). Flying: both
 * wings flap and they float gently, legs tucked. Sleeping: fluffed up into a round ball.
 * Dust bathing: sitting still in the dust, just fluttering their wings, dust puffing up. Drinking: standing tall, sipping through a straw (drawn by the scene).
 */
function Acting({ action: wanted, speciesId, size, setting, children }: { action?: Action; speciesId: string; size: number; setting: CloseUpSetting; children: React.ReactNode }) {
  const still = useReduceMotion();
  const action = wanted && canDo(speciesId, wanted) ? wanted : undefined;
  const t = useSine(action === 'fly' ? 900 : action === 'dust' ? 520 : 3000, still || !action || action === 'drink');
  const species = getSpecies(speciesId);
  const wingColor = inks[(species?.art.second ?? species?.art.main ?? 'gray') as Ink] ?? '#9C9AB0';
  const wing = (k: number, flutter: boolean) => (
    <Animated.View
      key={k}
      style={{
        position: 'absolute',
        // The wing's base sits on the shoulder; it spreads up and out from there.
        left: size * (shoulderOf(speciesId)[0] - (flutter ? 0.06 : k ? 0.03 : 0.08)),
        top: size * (shoulderOf(speciesId)[1] - (flutter ? 0.16 : 0.32)),
        width: size * (flutter ? 0.34 : 0.6),
        height: size * (flutter ? 0.2 : 0.34),
        transformOrigin: 'left bottom',
        transform: [{ rotate: wave(t, flutter ? '-6deg' : k ? '-30deg' : '-22deg', flutter ? '-28deg' : k ? '20deg' : '26deg') as never }],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 56">
        {/* A broad wing with long separate feathers at the tip. Outlined everywhere except
            where it joins the body, so it reads as part of them, not stuck on. */}
        <Path d={WING_FILL} fill={wingColor} opacity={k === 0 && !flutter ? 0.85 : 1} />
        <Path d={WING_EDGE} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M40 36 L86 14 M36 42 L84 26 M34 47 L74 38" stroke={INK} strokeWidth={2.5} fill="none" opacity={0.35} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
  if (action === 'fly') {
    // The far wing behind the body, the near wing in front: both flap together.
    return (
      <Animated.View style={{ transform: [{ translateY: wave(t, 0, -size * 0.04) }] }}>
        {wing(0, false)}
        <View style={{ width: size, height: size * (cutoutFeet(speciesId) - 0.07), overflow: 'hidden' }}>{children}</View>
        {wing(1, false)}
      </Animated.View>
    );
  }
  if (action === 'sleep') {
    return <Animated.View style={{ transformOrigin: 'center bottom', transform: [{ scaleX: 1.08 }, { scaleY: 0.88 }] }}>{children}</Animated.View>;
  }
  if (action === 'dust') {
    // Settled low in a dusty dip: a quick tail wiggle and fluttering wings, dust puffing up.
    return (
      <View>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Ellipse cx={size * 0.5} cy={size * cutoutFeet(speciesId)} rx={size * 0.46} ry={size * 0.07} fill="#C9A87A" stroke={INK} strokeWidth={1.5} />
        </Svg>
        <View>{children}</View>
        {wing(1, true)}
        {[0, 1, 2, 3, 4].map((k) => (
          <DustPuff key={k} k={k} size={size} still={still} />
        ))}
      </View>
    );
  }
  return <>{children}</>;
}

/** One soft puff of dust rising from the ground and fading. */
function DustPuff({ k, size, still }: { k: number; size: number; still: boolean }) {
  const t = useLinear(1600 + k * 230, still);
  const x = size * (0.18 + k * 0.16);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size * 0.05,
        top: size * 0.74,
        opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.85, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.18] }) }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }) }],
      }}
    >
      <Svg width={size * 0.24} height={size * 0.18} viewBox="0 0 40 30">
        <Path d="M6 24 C0 24 0 14 8 14 C8 6 20 4 22 12 C28 6 38 10 34 18 C40 20 38 28 32 27 Z" fill="#E8D7B4" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- more places

/** A big tree trunk with a cozy hollow, for napping in. */
function Hollow({ w, h, ground, bh, period, season }: { w: number; h: number; ground: number; bh: number; period: Period; season: Season }) {
  const top = ground - bh * 0.9;
  return (
    <G>
      <Treeline w={w} h={h} base={ground + bh * 0.9} period={period} season={season} />
      <Rect x={w * 0.14} y={0} width={w * 0.72} height={h} fill={BARK} />
      <Path d={`M${w * 0.14} 0 V${h} M${w * 0.86} 0 V${h}`} stroke={INK} strokeWidth={2} />
      {[0.2, 0.32, 0.72, 0.8].map((x, i) => (
        <Path key={i} d={`M${w * x} ${i % 2 ? 20 : 60} C${w * x - 6} ${ground * 0.4} ${w * x + 6} ${ground * 0.7} ${w * x} ${h}`} stroke="#6E4E38" strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      {/* The hollow: a dark, cozy opening with a lighter rim. */}
      <Ellipse cx={w * 0.5} cy={(top + ground) / 2} rx={w * 0.31} ry={(ground - top) / 2 + 10} fill="#B07E58" stroke={INK} strokeWidth={1.5} />
      <Ellipse cx={w * 0.5} cy={(top + ground) / 2 + 4} rx={w * 0.27} ry={(ground - top) / 2} fill="#3B2A20" />
    </G>
  );
}

/** High up on a building: a carved stone ledge across the screen, the wall rising at the right, and the city's rooftops far below. */
function HighLedge({ w, h, y, bh, bt, period, look, variant }: { w: number; h: number; y: number; bh: number; bt: number; period: Period; look: Building; variant: number }) {
  if (variant === 1) return <BridgeGirder w={w} h={h} y={y} bh={bh} period={period} />;
  if (variant === 2) return <WaterTowerRoof w={w} h={h} y={y} bh={bh} period={period} />;
  const [stone, line] = look === 'ivy' ? IVY_BRICK[period] : BRICK[period];
  const trim = period === 'night' ? '#6E6A80' : period === 'dusk' ? '#B3ABA0' : '#E3DACB';
  const shade = period === 'night' ? '#55546A' : period === 'dusk' ? '#9A9086' : '#C2B6A3';
  const wallX = w * 0.74;
  return (
    <G>
      {/* The city's rooftops far below. */}
      <Skyline w={w} h={h} base={y + bh * 1.05} bh={bh} period={period} />
      {/* The building this ledge belongs to, rising at the right: stone blocks, arched windows with hoods, a flower box. */}
      {/* It runs all the way down: the ledge juts out from a real building, not a floating one. */}
      <Rect x={wallX} y={0} width={w - wallX} height={h} fill={stone} />
      {Array.from({ length: Math.ceil(h / 30) }, (_, r) => (
        <G key={r}>
          <Path d={`M${wallX} ${30 * (r + 1)} H${w}`} stroke={line} strokeWidth={1.2} />
          <Path d={`M${wallX + ((w - wallX) * (r % 2 ? 0.5 : 0.25))} ${30 * r} V${30 * (r + 1)}`} stroke={line} strokeWidth={1.2} />
        </G>
      ))}
      <Path d={`M${wallX} 0 V${h}`} stroke={INK} strokeWidth={1.5} />
      {[bt - bh * 0.1, bt + bh * 0.42, y + bh * 0.5, y + bh * 1.05].map((wy, i) => {
        const wx = wallX + (w - wallX) * 0.2;
        const ww = (w - wallX) * 0.6;
        const wh = bh * 0.4;
        return (
          <G key={i}>
            <Path d={`M${wx - 5} ${wy + ww / 2 - 1} Q${wx + ww / 2} ${wy - ww * 0.3} ${wx + ww + 5} ${wy + ww / 2 - 1} V${wy + ww / 2 + 5} Q${wx + ww / 2} ${wy - ww * 0.16} ${wx - 5} ${wy + ww / 2 + 5} Z`} fill={trim} stroke={INK} strokeWidth={1.2} />
            <Path d={`M${wx} ${wy + wh} V${wy + ww / 2} A${ww / 2} ${ww / 2} 0 0 1 ${wx + ww} ${wy + ww / 2} V${wy + wh} Z`} fill={period === 'dusk' || period === 'night' ? '#FFD23F' : '#BFD0F5'} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${wx + ww / 2} ${wy + 4} V${wy + wh} M${wx} ${wy + wh * 0.6} H${wx + ww}`} stroke={INK} strokeWidth={1} />
            <Rect x={wx - 4} y={wy + wh} width={ww + 8} height={6} fill={trim} stroke={INK} strokeWidth={1.2} />
            {i === 1 && [0.2, 0.5, 0.8].map((f, k) => <Circle key={k} cx={wx + ww * f} cy={wy + wh - 3} r={4} fill={k % 2 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={0.8} />)}
          </G>
        );
      })}
      {/* The ledge: a thick stone slab with a carved edge and brackets below. */}
      <Rect x={-4} y={y} width={w + 8} height={16} fill={trim} stroke={INK} strokeWidth={1.5} />
      <Rect x={-4} y={y + 16} width={w + 8} height={10} fill={shade} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: 6 }, (_, i) => {
        const bx = ((i + 0.5) * w) / 6;
        return <Path key={i} d={`M${bx - 8} ${y + 26} H${bx + 8} V${y + 34} Q${bx} ${y + 46} ${bx - 8} ${y + 34} Z`} fill={shade} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />;
      })}
    </G>
  );
}

/** Up on a bridge: a blue steel girder with rivets, cables rising, the river and the city far below. */
function BridgeGirder({ w, h, y, bh, period }: { w: number; h: number; y: number; bh: number; period: Period }) {
  const steel = dim(period, '#7F97C9', '#5E74B0', '#34405E');
  const dark = dim(period, '#5E74A8', '#46588E', '#262E48');
  const river = y + bh * 0.95;
  return (
    <G>
      <FarCity w={w} base={river} period={period} />
      <Rect x={0} y={river} width={w} height={h - river} fill={WATER[period]} />
      <Path d={`M0 ${river} H${w}`} stroke={INK} strokeWidth={1} opacity={0.4} />
      {/* A tower and its cables sweeping up and away. */}
      <Rect x={w * 0.84} y={0} width={22} height={y} fill={steel} stroke={INK} strokeWidth={1.5} />
      {[0.2, 0.4, 0.6].map((f, i) => <Path key={i} d={`M${w * 0.84} ${y * f} Q${w * 0.4} ${y * (f + 0.35)} ${-10} ${y * (f + 0.5)}`} stroke={dark} strokeWidth={3} fill="none" />)}
      {Array.from({ length: 8 }, (_, i) => <Path key={i} d={`M${w * 0.1 * i} ${y * 0.55 + i * 6} V${y}`} stroke={dark} strokeWidth={1.5} />)}
      {/* The girder: a beam with rivets and an X truss below. */}
      <Rect x={-4} y={y} width={w + 8} height={18} fill={steel} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: 18 }, (_, i) => <Circle key={i} cx={8 + (w / 17) * i} cy={y + 9} r={2} fill={dark} />)}
      {Array.from({ length: 5 }, (_, i) => {
        const x = (w / 5) * i;
        return <Path key={i} d={`M${x} ${y + 18} L${x + w / 5} ${y + 70} M${x + w / 5} ${y + 18} L${x} ${y + 70}`} stroke={steel} strokeWidth={5} />;
      })}
      <Rect x={-4} y={y + 70} width={w + 8} height={10} fill={steel} stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

/** A rooftop: a classic wooden water tower on stilts, a parapet to perch on, and towers in the distance. */
function WaterTowerRoof({ w, h, y, bh, period }: { w: number; h: number; y: number; bh: number; period: Period }) {
  const wood = dim(period, '#C9955E', '#A9785A', '#5A4A44');
  const band = dim(period, '#55546A', '#3B3A50', '#1F1F2E');
  const roof = dim(period, '#B8B2C2', '#8E88A0', '#3E3A50');
  const tx = w * 0.72;
  const tw = w * 0.26;
  return (
    <G>
      <FarCity w={w} base={y - bh * 0.05} period={period} tower />
      {/* The water tower. */}
      <Path d={`M${tx + 8} ${y} L${tx + 14} ${y - bh * 0.3} M${tx + tw - 8} ${y} L${tx + tw - 14} ${y - bh * 0.3} M${tx + 12} ${y - bh * 0.15} L${tx + tw - 12} ${y - bh * 0.22} M${tx + tw - 12} ${y - bh * 0.15} L${tx + 12} ${y - bh * 0.22}`} stroke={INK} strokeWidth={3} />
      <Rect x={tx} y={y - bh * 0.78} width={tw} height={bh * 0.48} rx={4} fill={wood} stroke={INK} strokeWidth={1.5} />
      {[0.25, 0.55, 0.85].map((f, i) => <Path key={i} d={`M${tx} ${y - bh * 0.78 + bh * 0.48 * f} H${tx + tw}`} stroke={band} strokeWidth={3} />)}
      {Array.from({ length: 5 }, (_, i) => <Path key={i} d={`M${tx + (tw / 5) * (i + 0.5)} ${y - bh * 0.78} V${y - bh * 0.3}`} stroke={dim(period, '#A87A4E', '#8A6048', '#4A3E38')} strokeWidth={1.5} />)}
      <Path d={`M${tx - 6} ${y - bh * 0.78} L${tx + tw / 2} ${y - bh * 1.02} L${tx + tw + 6} ${y - bh * 0.78} Z`} fill={wood} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx={tx + tw / 2} cy={y - bh * 1.04} r={4} fill={band} />
      {/* The roof and its parapet. */}
      <Rect x={0} y={y + 14} width={w} height={h - y} fill={roof} />
      <Rect x={-4} y={y} width={w + 8} height={16} fill={dim(period, '#E3DACB', '#B3ABA0', '#5E5A6E')} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: 10 }, (_, i) => <Path key={i} d={`M${(w / 9) * i} ${y} V${y + 16}`} stroke={INK} strokeWidth={1} opacity={0.5} />)}
    </G>
  );
}

/** Upstairs on the building: the wall, a big window behind, and a black iron fire escape to perch on. */
function FireEscape({ w, h, y, bh, period, look }: { w: number; h: number; y: number; bh: number; period: Period; look: Building }) {
  const [stone, line] = look === 'ivy' ? IVY_BRICK[period] : BRICK[period];
  const row = look === 'ivy' ? 15 : 34;
  const per = look === 'ivy' ? 9 : 3;
  const lit = period === 'dusk' || period === 'night';
  const iron = '#1F1F2E';
  const winX = w * 0.26;
  const winW = w * 0.48;
  const winTop = y - bh * 0.95;
  const winH = bh * 0.82;
  const railTop = y - bh * 0.34;
  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill={stone} />
      {Array.from({ length: Math.ceil(h / row) }, (_, r) => (
        <G key={r}>
          <Path d={`M0 ${row * (r + 1)} H${w}`} stroke={line} strokeWidth={1} />
          {Array.from({ length: per + 1 }, (_, c) => (
            <Path key={c} d={`M${(w / per) * c + (r % 2 ? w / per / 2 : 0)} ${row * r} V${row * (r + 1)}`} stroke={line} strokeWidth={1} />
          ))}
        </G>
      ))}
      {/* The window behind the fire escape: white frame, four panes, curtains. */}
      <Rect x={winX - 6} y={winTop - 12} width={winW + 12} height={10} fill="#F7F3EC" stroke={INK} strokeWidth={1.2} />
      <Rect x={winX} y={winTop} width={winW} height={winH} fill="#F7F3EC" stroke={INK} strokeWidth={1.5} />
      <Rect x={winX + 5} y={winTop + 5} width={winW - 10} height={winH - 10} fill={lit ? '#FFD23F' : '#BFD0F5'} />
      <Path d={`M${winX + 6} ${winTop + 6} Q${winX + winW * 0.2} ${winTop + winH * 0.45} ${winX + 6} ${winTop + winH - 8} Z M${winX + winW - 6} ${winTop + 6} Q${winX + winW * 0.8} ${winTop + winH * 0.45} ${winX + winW - 6} ${winTop + winH - 8} Z`} fill={colors.pinkTint} stroke={INK} strokeWidth={1} />
      <Path d={`M${winX + winW / 2} ${winTop + 5} V${winTop + winH - 5} M${winX + 5} ${winTop + winH / 2} H${winX + winW - 5}`} stroke="#F7F3EC" strokeWidth={3} />
      {/* The fire escape: a slatted platform, a railing with bars, and a ladder going up. */}
      <Path d={`M${w * 0.82} ${y} L${w * 0.86} ${winTop - 20} M${w * 0.9} ${y} L${w * 0.94} ${winTop - 20}`} stroke={iron} strokeWidth={3} />
      {Array.from({ length: 8 }, (_, k) => {
        const f = (k + 1) / 9;
        const ly = y + (winTop - 20 - y) * f;
        return <Path key={k} d={`M${w * 0.82 + w * 0.04 * f} ${ly} H${w * 0.9 + w * 0.04 * f}`} stroke={iron} strokeWidth={2} />;
      })}
      <Path d={`M${w * 0.04} ${railTop} H${w * 0.96}`} stroke={iron} strokeWidth={4} strokeLinecap="round" />
      <Path d={`M${w * 0.04} ${railTop + bh * 0.14} H${w * 0.96}`} stroke={iron} strokeWidth={2} />
      {Array.from({ length: 15 }, (_, k) => <Path key={k} d={`M${w * 0.04 + (w * 0.92 * k) / 14} ${railTop} V${y}`} stroke={iron} strokeWidth={2} />)}
      <Rect x={w * 0.02} y={y} width={w * 0.96} height={8} fill={iron} />
      {Array.from({ length: 20 }, (_, k) => <Path key={k} d={`M${w * 0.03 + (w * 0.94 * k) / 19} ${y + 8} V${y + 16}`} stroke={iron} strokeWidth={2} />)}
      <Path d={`M${w * 0.02} ${y + 16} H${w * 0.98}`} stroke={iron} strokeWidth={3} />
      {/* A little pot of flowers on the platform. */}
      <Path d={`M${w * 0.12} ${y - 18} H${w * 0.12 + 22} L${w * 0.12 + 19} ${y} H${w * 0.12 + 3} Z`} fill="#E07A4A" stroke={INK} strokeWidth={1.2} />
      {[-6, 0, 6].map((dx, k) => <Circle key={k} cx={w * 0.12 + 11 + dx} cy={y - 24 - (k === 1 ? 4 : 0)} r={5} fill={k === 1 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />)}
    </G>
  );
}

/** Park ground: far trees on a grassy rise, grass down to the bottom of the screen. */
function Park({ w, h, ground, bh, period, season }: { w: number; h: number; ground: number; bh: number; period: Period; season: Season }) {
  const top = ground - bh * 0.22;
  return (
    <G>
      <FarTrees w={w} base={top} period={period} season={season} />
      <Rect x={0} y={top} width={w} height={h - top} fill={GRASS[period]} />
      <Path d={`M0 ${top} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.4} />
      {[0.08, 0.2, 0.33, 0.7, 0.86, 0.95].map((x, i) => (
        <Path key={i} d={`M${w * x} ${ground + bh * (0.08 + (i % 3) * 0.07)} l-3 -9 M${w * x} ${ground + bh * (0.08 + (i % 3) * 0.07)} l3 -10`} stroke="#5E8A4A" strokeWidth={2} strokeLinecap="round" />
      ))}
    </G>
  );
}

/** A long, bushy hedge behind the animal: one scalloped shape with leaf details, in the season's greens. */
function Hedge({ w, ground, bh, season, period }: { w: number; ground: number; bh: number; season: Season; period: Period }) {
  const [a, b] = HEDGE[season];
  const dark = period === 'night' || period === 'dusk';
  const top = ground - bh * 0.48;
  const bumps = 7;
  const bw = w / (bumps - 1);
  // A scalloped top edge: a row of soft bumps.
  let d = `M-10 ${ground} L-10 ${top + 10}`;
  for (let i = 0; i < bumps; i++) d += ` Q${i * bw - bw / 2} ${top - bh * 0.1 - (i % 2) * 8} ${i * bw} ${top + 6}`;
  d += ` L${w + 10} ${top + 6} L${w + 10} ${ground} Z`;
  const leaf = (x: number, y: number, r: number, k: number) => (
    <Path key={k} d={`M${x - r} ${y} Q${x} ${y - r * 0.9} ${x + r} ${y} Q${x} ${y + r * 0.9} ${x - r} ${y} Z`} transform={`rotate(${(k * 37) % 60 - 30} ${x} ${y})`} fill={b} stroke={INK} strokeWidth={1} opacity={0.9} />
  );
  return (
    <G opacity={dark ? 0.85 : 1}>
      <Path d={d} fill={a} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      {Array.from({ length: 18 }, (_, k) => leaf(((k * 53) % 100) / 100 * w, top + bh * 0.08 + ((k * 31) % 100) / 100 * (ground - top - bh * 0.12), 7, k))}
      {(season === 'fall' || season === 'spring') &&
        Array.from({ length: 6 }, (_, k) => <Circle key={`b${k}`} cx={((k * 41 + 9) % 100) / 100 * w} cy={top + bh * 0.12 + ((k * 23) % 50)} r={4} fill={season === 'fall' ? '#E5484D' : '#FFB3CB'} stroke={INK} strokeWidth={1} />)}
    </G>
  );
}

/** A few big, friendly flowers in front, for bees and butterflies to hover over: round petals, a sunny middle, leaves on the stem. */
function Flowers({ w, ground, bh, period }: { w: number; ground: number; bh: number; period: Period }) {
  const petals = period === 'night' ? ['#C9A0C9', '#D9C98A', '#A9A0D9'] : ['#FF8FB0', '#FFD23F', '#B4A2F2', '#FFB3CB'];
  return (
    <G>
      {[0.1, 0.28, 0.72, 0.9].map((x, i) => {
        const cx = w * x;
        const cy = ground - bh * (0.12 + (i % 2) * 0.14);
        const r = bh * 0.06;
        const stem = `M${cx} ${cy} C${cx + 6} ${cy + bh * 0.15} ${cx - 6} ${cy + bh * 0.25} ${cx} ${ground + bh * 0.3}`;
        return (
          <G key={i}>
            <Path d={stem} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            <Path d={stem} stroke="#4FA85E" strokeWidth={3} fill="none" strokeLinecap="round" />
            {[-1, 1].map((s) => (
              <Path
                key={s}
                d={`M${cx} ${cy + bh * 0.16} q${s * 10} -10 ${s * 20} -4 q${-s * 6} 10 ${-s * 20} 4 Z`}
                fill="#6FC27E"
                stroke={INK}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            ))}
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
              return <Ellipse key={k} cx={cx + Math.cos(a) * r * 0.95} cy={cy + Math.sin(a) * r * 0.95} rx={r * 0.62} ry={r * 0.52} transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r * 0.95} ${cy + Math.sin(a) * r * 0.95})`} fill={petals[i % petals.length]} stroke={INK} strokeWidth={1.2} />;
            })}
            <Circle cx={cx} cy={cy} r={r * 0.5} fill={colors.yellow} stroke={INK} strokeWidth={1.2} />
            <Circle cx={cx - r * 0.15} cy={cy - r * 0.15} r={r * 0.14} fill="#FFFFFF" />
          </G>
        );
      })}
    </G>
  );
}

/** A burrow: a mound of earth with a round dark entrance. */
function Burrow({ x, ground, bh }: { x: number; ground: number; bh: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={ground} rx={bh * 0.32} ry={bh * 0.14} fill="#B98A5E" stroke={INK} strokeWidth={1.5} />
      <Ellipse cx={x} cy={ground - bh * 0.02} rx={bh * 0.12} ry={bh * 0.08} fill="#4A3426" stroke={INK} strokeWidth={1.5} />
    </G>
  );
}

/** A row of cute little buildings along the bottom of an open sky: outlined, with windows (some lit), varied rooftops and a water tower. */
function Skyline({ w, h, base, bh, period }: { w: number; h: number; base: number; bh: number; period: Period }) {
  const night = period === 'night' || period === 'dusk';
  const walls = night ? ['#4A4A72', '#5A4A6E', '#3E4A72'] : period === 'dawn' ? ['#F2C4D4', '#E8D4F2', '#FADADA'] : ['#E8D4F2', '#FADADA', '#D4E2F7', '#F7E3C4'];
  const glass = night ? '#FFD23F' : '#BFD0F5';
  const blocks: [number, number, number][] = [[-0.02, 0.2, 0.2], [0.17, 0.17, 0.28], [0.33, 0.2, 0.16], [0.52, 0.16, 0.24], [0.67, 0.18, 0.19], [0.84, 0.2, 0.26]];
  return (
    <G>
      {blocks.map(([x, bw, bh2], i) => {
        const bx = w * x;
        const bwPx = w * bw;
        // Low enough to leave plenty of sky over the wire.
        const top = base - bh * bh2 * 1.6;
        const cols = 3;
        const rows = Math.ceil((h - top) / 26);
        return (
          <G key={i}>
            <Rect x={bx} y={top} width={bwPx} height={h} fill={walls[i % walls.length]} stroke={INK} strokeWidth={1.5} />
            {i % 2 === 0 ? (
              <Rect x={bx - 3} y={top - 6} width={bwPx + 6} height={7} fill={walls[(i + 1) % walls.length]} stroke={INK} strokeWidth={1.2} />
            ) : (
              <Path d={`M${bx} ${top} L${bx + bwPx / 2} ${top - 14} L${bx + bwPx} ${top} Z`} fill={walls[(i + 2) % walls.length]} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
            )}
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => (
                <Rect
                  key={`${r}:${c}`}
                  x={bx + bwPx * (0.14 + c * 0.28)}
                  y={top + 12 + r * 26}
                  width={bwPx * 0.16}
                  height={13}
                  rx={2}
                  fill={night && (r + c + i) % 3 === 0 ? glass : night ? '#2E2E44' : (r + c + i) % 4 === 0 ? '#FFFFFF' : glass}
                  stroke={INK}
                  strokeWidth={1}
                />
              )),
            )}
          </G>
        );
      })}
      {/* A water tower on top of the tallest building. */}
      <G>
        <Path d={`M${w * 0.21} ${base - bh * 0.448} l2 -10 M${w * 0.29} ${base - bh * 0.448} l-2 -10`} stroke={INK} strokeWidth={2} />
        <Rect x={w * 0.2} y={base - bh * 0.448 - 28} width={w * 0.1} height={18} rx={2} fill="#C9955E" stroke={INK} strokeWidth={1.2} />
        <Path d={`M${w * 0.195} ${base - bh * 0.448 - 28} L${w * 0.25} ${base - bh * 0.448 - 38} L${w * 0.305} ${base - bh * 0.448 - 28} Z`} fill="#C9955E" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      </G>
    </G>
  );
}

/** A utility wire sagging across the screen, from a pole at the left. */
function Wire({ w, y, bh }: { w: number; y: number; bh: number }) {
  return (
    <G>
      <Rect x={w * 0.06} y={y - bh * 0.5} width={10} height={bh * 2} fill="#8A6247" stroke={INK} strokeWidth={1.5} />
      <Rect x={w * 0.06 - 14} y={y - bh * 0.42} width={38} height={7} fill="#8A6247" stroke={INK} strokeWidth={1.5} />
      <Path d={`M${w * 0.06 + 5} ${y - bh * 0.02} Q${w * 0.55} ${y + bh * 0.06} ${w + 10} ${y - bh * 0.04}`} stroke={INK} strokeWidth={3} fill="none" />
      <Path d={`M${w * 0.06 + 5} ${y - bh * 0.32} Q${w * 0.55} ${y - bh * 0.22} ${w + 10} ${y - bh * 0.34}`} stroke={INK} strokeWidth={2} fill="none" opacity={0.6} />
    </G>
  );
}

/** The near shore: soft sand meeting the water in a frothy edge, with shells, pebbles and beach grass. */
function Shore({ w, h, top, period }: { w: number; h: number; top: number; period: Period }) {
  const sand = SAND[period];
  const darkSand = dim(period, '#DCC39C', '#A88E6E', '#4E463E');
  const foam = dim(period, '#FFFFFF', '#E8ECF7', '#9DA8C8');
  const edge = `M0 ${top + 10} Q${w * 0.25} ${top - 4} ${w * 0.5} ${top + 4} T${w} ${top + 2}`;
  return (
    <G>
      <Path d={`${edge} V${h} H0 Z`} fill={sand} stroke={INK} strokeWidth={1.5} />
      {/* Wet sand just past the foam, then the foam's scalloped edge. */}
      <Path d={`${edge} V${top + 30} Q${w * 0.5} ${top + 18} 0 ${top + 32} Z`} fill={darkSand} />
      <Path d={Array.from({ length: 12 }, (_, i) => `${i ? '' : `M0 ${top + 8}`} q${w / 24} 8 ${w / 12} 0`).join(' ')} stroke={foam} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* Speckles in the sand. */}
      {Array.from({ length: 26 }, (_, i) => (
        <Circle key={i} cx={((i * 37) % 100) / 100 * w} cy={top + 46 + ((i * 53) % 100) / 100 * (h - top - 60)} r={1.6} fill={darkSand} />
      ))}
      {/* A few shells and pebbles. */}
      {[[0.16, 60, '#FFC2D1'], [0.74, 90, '#FFE3B8'], [0.42, 130, '#F7D4E8']].map(([x, dy, c], i) => {
        const cx = w * (x as number);
        const cy = top + (dy as number);
        return (
          <G key={i}>
            <Path d={`M${cx - 10} ${cy + 4} Q${cx} ${cy - 14} ${cx + 10} ${cy + 4} Z`} fill={c as string} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
            {[-5, 0, 5].map((dx, k) => <Path key={k} d={`M${cx} ${cy + 4} L${cx + dx} ${cy - 7}`} stroke={INK} strokeWidth={0.8} opacity={0.6} />)}
          </G>
        );
      })}
      {[0.3, 0.86, 0.58].map((x, i) => <Ellipse key={i} cx={w * x} cy={top + 70 + i * 38} rx={8} ry={5} fill="#B8B2C2" stroke={INK} strokeWidth={1.2} />)}
      {/* Beach grass at the edges. */}
      {[0.02, 0.06, 0.94, 0.98].map((x, i) => (
        <Path key={i} d={`M${w * x} ${top + 60} q-6 -26 -2 -44 M${w * x} ${top + 60} q4 -24 10 -38 M${w * x} ${top + 60} q-1 -30 2 -50`} stroke="#7FA24A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ))}
    </G>
  );
}

/** A wooden pier from `top` down: staggered planks with grain and nails, two posts wrapped in rope, and a life ring. */
function Pier({ w, h, top }: { w: number; h: number; top: number }) {
  const plank = 22;
  const rows = Math.ceil((h - top) / plank);
  const woods = ['#C9955E', '#BE8A55', '#D2A06A'];
  return (
    <G>
      {Array.from({ length: rows }, (_, r) => {
        const y = top + r * plank;
        const seams = [0.22, 0.58, 0.86].map((f) => w * ((f + (r % 3) * 0.13) % 1));
        return (
          <G key={r}>
            <Rect x={0} y={y} width={w} height={plank} fill={woods[r % 3]} stroke={INK} strokeWidth={1.2} />
            <Path d={`M${w * 0.05} ${y + plank * 0.45} q${w * 0.1} -3 ${w * 0.2} 0 M${w * 0.55} ${y + plank * 0.6} q${w * 0.08} 3 ${w * 0.16} 0`} stroke="#9A6A44" strokeWidth={1.2} fill="none" opacity={0.7} />
            {seams.map((x, k) => (
              <G key={k}>
                <Path d={`M${x} ${y} V${y + plank}`} stroke={INK} strokeWidth={1} />
                <Circle cx={x - 5} cy={y + 6} r={1.4} fill="#5E4A3A" />
                <Circle cx={x - 5} cy={y + plank - 6} r={1.4} fill="#5E4A3A" />
              </G>
            ))}
          </G>
        );
      })}
      {/* Posts with rope wrapped around them. */}
      {[0.08, 0.92].map((x, i) => (
        <G key={i}>
          <Rect x={w * x - 10} y={top - 42} width={20} height={48} rx={5} fill="#8A6247" stroke={INK} strokeWidth={1.5} />
          <Ellipse cx={w * x} cy={top - 42} rx={10} ry={4} fill="#A87A58" stroke={INK} strokeWidth={1.2} />
          {[0, 1, 2].map((k) => <Path key={k} d={`M${w * x - 11} ${top - 26 + k * 6} q11 4 22 0`} stroke="#E8D7B4" strokeWidth={3} fill="none" />)}
        </G>
      ))}
      {/* A life ring hanging on the right post. */}
      <G>
        <Circle cx={w * 0.92} cy={top - 8} r={15} fill="none" stroke={INK} strokeWidth={9} />
        <Circle cx={w * 0.92} cy={top - 8} r={15} fill="none" stroke="#F7F3EC" strokeWidth={6} />
        {[0, 1, 2, 3].map((k) => {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          return <Path key={k} d={`M${w * 0.92 + Math.cos(a - 0.3) * 15} ${top - 8 + Math.sin(a - 0.3) * 15} A15 15 0 0 1 ${w * 0.92 + Math.cos(a + 0.3) * 15} ${top - 8 + Math.sin(a + 0.3) * 15}`} stroke="#E5484D" strokeWidth={6} fill="none" />;
        })}
      </G>
      {/* A coil of rope on the planks. */}
      <G>
        <Ellipse cx={w * 0.22} cy={top + 40} rx={20} ry={8} fill="none" stroke={INK} strokeWidth={6} />
        <Ellipse cx={w * 0.22} cy={top + 40} rx={20} ry={8} fill="none" stroke="#E8D7B4" strokeWidth={4} />
        <Ellipse cx={w * 0.22} cy={top + 38} rx={12} ry={5} fill="none" stroke="#E8D7B4" strokeWidth={3} />
      </G>
    </G>
  );
}

/** Cattails: tall stems with brown heads, at the sides (back) or along the bottom (front). */
function Reeds({ w, ground, bh, back = false }: { w: number; ground: number; bh: number; back?: boolean }) {
  const xs = back ? [0.03, 0.09, 0.15, 0.85, 0.91, 0.97] : [0.05, 0.12, 0.2, 0.8, 0.88, 0.95];
  return (
    <G opacity={back ? 0.8 : 1}>
      {xs.map((x, i) => {
        const top = ground - bh * (back ? 0.9 + (i % 3) * 0.12 : 0.45 + (i % 2) * 0.12);
        return (
          <G key={i}>
            <Path d={`M${w * x} ${ground + bh * 0.3} Q${w * x + 4} ${(ground + top) / 2} ${w * x - 2} ${top}`} stroke="#5E7A3A" strokeWidth={4} fill="none" strokeLinecap="round" />
            <Rect x={w * x - 6} y={top} width={12} height={bh * 0.14} rx={6} fill="#8A5A3A" stroke={INK} strokeWidth={1.2} />
          </G>
        );
      })}
    </G>
  );
}

/** A reed bent across the middle, for a blackbird or sparrow to perch on. */
function BentReed({ w, y, bh }: { w: number; y: number; bh: number }) {
  const d = `M${w * 0.1} ${y + bh * 0.4} Q${w * 0.35} ${y - bh * 0.02} ${w * 0.95} ${y + bh * 0.02}`;
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d={d} stroke="#7FA24A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Rect x={w * 0.88} y={y - bh * 0.04} width={bh * 0.16} height={12} rx={6} fill="#8A5A3A" stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

/** A big tree trunk for a woodpecker to cling to, with bark, a hole and a branch going off. */
function TrunkScene({ w, h, bt, bh, ground, trunkX, period, season }: { w: number; h: number; bt: number; bh: number; ground: number; trunkX: number; period: Period; season: Season }) {
  const tw = w * 0.34;
  return (
    <G>
      <Treeline w={w} h={h} base={ground + bh * 0.4} period={period} season={season} />
      <Rect x={trunkX} y={0} width={tw} height={h} fill={BARK} />
      <Path d={`M${trunkX} 0 V${h}`} stroke={INK} strokeWidth={2} />
      <Path d={`M${trunkX + tw} 0 V${h}`} stroke={INK} strokeWidth={2} />
      {[0.2, 0.5, 0.8].map((x, i) => (
        <Path key={i} d={`M${trunkX + tw * x} ${bt - bh * 0.3 + i * 40} C${trunkX + tw * x - 6} ${bt + bh * 0.2 + i * 30} ${trunkX + tw * x + 6} ${bt + bh * 0.6} ${trunkX + tw * x} ${bt + bh * 1.4}`} stroke="#6E4E38" strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      <Ellipse cx={trunkX + tw * 0.55} cy={bt + bh * 0.2} rx={tw * 0.16} ry={tw * 0.2} fill="#3B2A20" stroke={INK} strokeWidth={1.5} />
    </G>
  );
}

/** An orb web: spokes and rings, drawn fine and pale. */
function Web({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G opacity={0.85}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <Path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`} stroke={colors.white} strokeWidth={1.5} />;
      })}
      {[0.3, 0.5, 0.7, 0.9].map((k, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r * k} stroke={colors.white} strokeWidth={1.5} fill="none" />
      ))}
    </G>
  );
}

// ---------------------------------------------------------------- motion

/** 0 → 1 forever, at a steady pace: for one-way motion that loops seamlessly. */
function useLinear(duration: number, still: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [still, duration, v]);
  return v;
}

/** Ripples drifting one way across a band of water. The pattern repeats every `step`, so the loop never shows a seam. */
function Ripples({ w, from, to }: { w: number; from: number; to: number }) {
  const still = useReduceMotion();
  const t = useLinear(7000, still);
  const band = to - from;
  const step = w * 0.32;
  const rows = Math.max(1, Math.round(band / 64));
  const count = Math.ceil(w / step) + 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -step, top: from, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, step] }) }] }}
    >
      <Svg width={w + step * 2} height={band}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: count }, (_, i) => (
            <Path
              key={`${r}:${i}`}
              d={`M${step * i + (r % 2) * step * 0.5} ${band * ((r + 0.5) / rows)} q${w * 0.03} -5 ${w * 0.06} 0`}
              stroke={colors.paper}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          )),
        )}
      </Svg>
    </Animated.View>
  );
}

// Leaves, as fractions of the screen width (x) and of the band height below the branch (dy).
const BACK_LEAVES = [
  { x: 0.04, dy: -0.12, len: 0.15, angle: -30 },
  { x: 0.13, dy: -0.09, len: 0.13, angle: 20 },
  { x: 0.19, dy: 0.05, len: 0.12, angle: 140 },
  { x: 0.62, dy: -0.14, len: 0.12, angle: -50 },
  { x: 0.74, dy: -0.26, len: 0.14, angle: -20 },
  { x: 0.82, dy: -0.36, len: 0.13, angle: 30 },
  { x: 0.9, dy: -0.31, len: 0.15, angle: -60 },
  { x: 0.95, dy: -0.12, len: 0.13, angle: 10 },
  { x: 0.86, dy: -0.04, len: 0.12, angle: 150 },
];
// Leaves on the branch reaching over the wall, measured from the top of the wall.
const WALL_LEAVES = [
  { x: 0.05, dy: 0.02, len: 0.12, angle: -20 },
  { x: 0.12, dy: 0.12, len: 0.11, angle: 120 },
  { x: 0.19, dy: -0.01, len: 0.11, angle: -40 },
  { x: 0.25, dy: 0.1, len: 0.1, angle: 140 },
  { x: 0.31, dy: 0.03, len: 0.1, angle: 10 },
];
const FRONT_LEAVES = [
  { x: 0.27, dy: 0.06, len: 0.12, angle: 160 },
  { x: 0.33, dy: 0.1, len: 0.1, angle: 120 },
  { x: 0.78, dy: -0.18, len: 0.11, angle: 70 },
];

/** One leaf on the branch, fluttering a little in the wind on their own rhythm. */
function Leaf({ x, dy, len, angle, w, y, bh, color }: { x: number; dy: number; len: number; angle: number; w: number; y: number; bh: number; color: string }) {
  const still = useReduceMotion();
  // Each leaf gets its own pace, so they don't move in lockstep.
  const t = useLinear(2600 + Math.round(x * 1700) + Math.round(len * 3000), still);
  const L = bh * len;
  const W = L * 0.42;
  const swing = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [`${angle}deg`, `${angle + 9}deg`, `${angle}deg`, `${angle - 6}deg`, `${angle}deg`] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: w * x - L / 2, top: y + bh * dy - L / 2, width: L, height: L, transform: [{ rotate: swing }] }}
    >
      <Svg width={L} height={L} viewBox={`${-L / 2} ${-L / 2} ${L} ${L}`}>
        {/* Stem at the left end (where the leaf joins the twig), pointed tip at the right. */}
        <Path d={`M${-L / 2} 0 C${-L / 6} ${-W} ${L / 4} ${-W * 0.8} ${L / 2} 0 C${L / 4} ${W * 0.8} ${-L / 6} ${W} ${-L / 2} 0 Z`} fill={color} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        <Path d={`M${-L / 2} 0 L${L * 0.38} 0`} stroke={INK} strokeWidth={1} opacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- weather

const RAINY: Sky[] = ['drizzle', 'rain', 'storm'];
const CLOUDY: Sky[] = ['cloudy', 'fog', 'drizzle', 'rain', 'storm', 'snow'];

/**
 * The sky's weather. `behind`: the sun or moon and clouds (drawn first). Otherwise:
 * rain or snow falling in front of everything.
 */
function SkyWeather({ w, h, bt, bh, period, weather, behind = false, sunLeft = false }: { w: number; h: number; bt: number; bh: number; period: Period; weather?: Sky; behind?: boolean; /** Put the sun or moon on the left, clear of a landmark on the right. */ sunLeft?: boolean }) {
  const still = useReduceMotion();
  const fall = useLinear(weather === 'snow' ? 9000 : 900, still || behind || !(weather === 'snow' || (weather && RAINY.includes(weather))));
  if (behind) {
    const day = period === 'dawn' || period === 'midday';
    const cloudy = !!weather && CLOUDY.includes(weather);
    const cloud = period === 'night' ? '#4A4A66' : period === 'dusk' ? '#6E8CE8' : '#FFFFFF';
    const cx = sunLeft ? w * 0.16 : w * 0.84;
    const cy = bt + bh * 0.12;
    return (
      <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
        {period === 'night' && [0.1, 0.27, 0.5, 0.68, 0.94].map((x, i) => <Circle key={i} cx={w * x} cy={bt * (0.35 + (i % 3) * 0.22)} r={1.8} fill={colors.paper} />)}
        {!cloudy && day && (
          <G>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <Path key={i} d={`M${cx + Math.cos(a) * 34} ${cy + Math.sin(a) * 34} L${cx + Math.cos(a) * 46} ${cy + Math.sin(a) * 46}`} stroke={colors.yellow} strokeWidth={5} strokeLinecap="round" />;
            })}
            <Circle cx={cx} cy={cy} r={26} fill={colors.yellow} stroke={INK} strokeWidth={1.5} />
          </G>
        )}
        {!cloudy && period === 'night' && <Path d={`M${cx + 6} ${cy - 24} a24 24 0 1 0 18 38 a20 20 0 1 1 -18 -38 Z`} fill={colors.yellow} stroke={INK} strokeWidth={1.5} />}
        {cloudy &&
          [[0.18, 0.02], [0.66, 0.1], [0.92, -0.02]].map(([x, dy], i) => (
            <G key={i} opacity={weather === 'fog' ? 0.6 : 0.95}>
              <Ellipse cx={w * x} cy={bt + bh * dy} rx={44} ry={18} fill={cloud} />
              <Circle cx={w * x - 16} cy={bt + bh * dy - 10} r={18} fill={cloud} />
              <Circle cx={w * x + 12} cy={bt + bh * dy - 14} r={22} fill={cloud} />
            </G>
          ))}
      </Svg>
    );
  }
  if (!weather || !(weather === 'snow' || RAINY.includes(weather))) return null;
  // Rain or snow: a tile of drops that repeats every `tile` points, sliding down one tile per loop.
  const tile = weather === 'snow' ? 180 : 140;
  const drops = weather === 'drizzle' ? 10 : weather === 'snow' ? 14 : 22;
  const rows = Math.ceil(h / tile) + 1;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: -tile, transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, tile] }) }] }}>
      <Svg width={w} height={tile * (rows + 1)}>
        {Array.from({ length: rows + 1 }, (_, r) =>
          Array.from({ length: drops }, (_, i) => {
            const x = ((i * 53) % 100) / 100 * w + (r % 2) * 9;
            const y = r * tile + ((i * 37) % tile);
            return weather === 'snow' ? (
              <Circle key={`${r}:${i}`} cx={x} cy={y} r={3} fill={colors.white} opacity={0.9} />
            ) : (
              <Path key={`${r}:${i}`} d={`M${x} ${y} l-3 12`} stroke={period === 'night' ? '#9DB9F2' : '#5E7FD6'} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            );
          }),
        )}
      </Svg>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- places

/** A few far-off trees: fluffy, cloud-like crowns with a little highlight, on chunky trunks. */
function FarTrees({ w, base, period, season, small = false }: { w: number; base: number; period: Period; season: Season; small?: boolean }) {
  const crown = period === 'night' || period === 'dusk' ? FAR[period] : LEAVES[season][0] ?? FAR[period];
  const shine = period === 'night' || period === 'dusk' ? '#FFFFFF22' : '#FFFFFF66';
  const trunk = period === 'night' ? '#2E2E44' : '#8A6247';
  const r = small ? 22 : 32;
  return (
    <G>
      {[0.08, 0.3, 0.52, 0.74, 0.94].map((x, i) => {
        const cr = r + (i % 3) * (small ? 5 : 8);
        const cx = w * x;
        const cy = base - cr * 1.9;
        // A crown is a few overlapping puffs: outline them all, then fill them all on top,
        // so it reads as one fluffy shape.
        const puffs: [number, number, number][] = [[0, 0, cr], [-cr * 0.7, cr * 0.35, cr * 0.72], [cr * 0.7, cr * 0.35, cr * 0.72], [0, -cr * 0.55, cr * 0.75]];
        return (
          <G key={i}>
            <Path d={`M${cx - 5} ${base} L${cx - 3} ${cy + cr * 0.6} L${cx + 3} ${cy + cr * 0.6} L${cx + 5} ${base} Z`} fill={trunk} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
            {puffs.map(([dx, dy, pr], k) => <Circle key={`o${k}`} cx={cx + dx} cy={cy + dy} r={pr} fill="none" stroke={INK} strokeWidth={2.4} />)}
            {puffs.map(([dx, dy, pr], k) => <Circle key={`f${k}`} cx={cx + dx} cy={cy + dy} r={pr} fill={crown} />)}
            <Ellipse cx={cx - cr * 0.3} cy={cy - cr * 0.55} rx={cr * 0.32} ry={cr * 0.18} fill={shine} />
          </G>
        );
      })}
    </G>
  );
}

/** Below the branch: far trees on a grassy hill at the bottom of the screen. */
function Treeline({ w, h, base, period, season }: { w: number; h: number; base: number; period: Period; season: Season }) {
  const grass = period === 'night' ? '#2F4A3A' : period === 'dusk' ? '#4C7A5A' : '#9CCB86';
  return (
    <G>
      <FarTrees w={w} base={base} period={period} season={season} />
      <Rect x={0} y={base} width={w} height={Math.max(0, h - base)} fill={grass} />
      <Path d={`M0 ${base} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.4} />
    </G>
  );
}

/** A pond: far trees on a grassy bank, reeds at the edges, water to the bottom of the screen. */
function Pond({ w, h, horizon, period, season }: { w: number; h: number; horizon: number; period: Period; season: Season }) {
  const grass = period === 'night' ? '#2F4A3A' : period === 'dusk' ? '#4C7A5A' : '#9CCB86';
  const bank = horizon - 14;
  return (
    <G>
      <FarTrees w={w} base={bank} period={period} season={season} small />
      <Rect x={0} y={bank} width={w} height={horizon - bank} fill={grass} />
      <Rect x={0} y={horizon} width={w} height={h - horizon} fill={WATER[period]} />
      <Path d={`M0 ${horizon} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
      {[0.05, 0.1, 0.88, 0.94].map((x, i) => (
        <Path key={i} d={`M${w * x} ${horizon + 2} q-3 -38 3 -60`} stroke="#5E7A5A" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
    </G>
  );
}

/** A big branch across the screen from the left, with a twig reaching up on the right. */
function Branch({ w, y, bh }: { w: number; y: number; bh: number }) {
  const t = bh * 0.07;
  const d = `M${-w * 0.05} ${y + t * 0.9} C${w * 0.3} ${y + t * 0.5} ${w * 0.65} ${y + t * 0.6} ${w * 1.05} ${y - t * 0.3}`;
  const twig = `M${w * 0.66} ${y + t * 0.2} C${w * 0.74} ${y - bh * 0.12} ${w * 0.82} ${y - bh * 0.22} ${w * 0.9} ${y - bh * 0.28}`;
  const twig2 = `M${w * 0.12} ${y + t * 0.6} C${w * 0.1} ${y - bh * 0.04} ${w * 0.06} ${y - bh * 0.1} ${w * 0.02} ${y - bh * 0.13}`;
  return (
    <G>
      {[twig2, twig].map((p, i) => (
        <G key={i}>
          <Path d={p} stroke={INK} strokeWidth={t * 0.7 + 3} strokeLinecap="round" fill="none" />
          <Path d={p} stroke={BARK} strokeWidth={t * 0.7} strokeLinecap="round" fill="none" />
        </G>
      ))}
      <Path d={d} stroke={INK} strokeWidth={t * 2 + 3} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={BARK} strokeWidth={t * 2} strokeLinecap="round" fill="none" />
      <Path d={`M${w * 0.05} ${y + t * 0.6} C${w * 0.25} ${y + t * 0.35} ${w * 0.4} ${y + t * 0.4} ${w * 0.5} ${y + t * 0.45}`} stroke="#6E4E38" strokeWidth={2} fill="none" />
    </G>
  );
}

// The ivy townhouse's brick, and its ivy.
const IVY_BRICK: Record<Period, [string, string]> = { dawn: ['#DE8C74', '#C77661'], midday: ['#D47D66', '#BA6853'], dusk: ['#A85E5C', '#8E4C4C'], night: ['#4E3434', '#3E2828'] };
const IVY: Record<Period, string[]> = { dawn: ['#4E9A54', '#6DB862', '#8BCB72'], midday: ['#3E8E4E', '#5FAE5E', '#7FC26A'], dusk: ['#2F6E48', '#3E8452', '#4E9658'], night: ['#24402E', '#2E5038', '#365A3E'] };

/** A little ivy leaf: a soft three-lobed heart. */
const ivyLeaf = (x: number, y: number, s: number, a: number, fill: string, k: string) => (
  <Path
    key={k}
    d={`M${x} ${y + s * 0.55} C${x - s * 1.05} ${y} ${x - s * 0.55} ${y - s * 0.95} ${x} ${y - s * 0.45} C${x + s * 0.55} ${y - s * 0.95} ${x + s * 1.05} ${y} ${x} ${y + s * 0.55} Z`}
    transform={`rotate(${a} ${x} ${y})`}
    fill={fill}
    stroke={INK}
    strokeWidth={0.8}
  />
);

/** Lush ivy along a vine (a list of points): a soft green mass with big overlapping leaves on top. */
function ivyAlong(points: [number, number][], period: Period, seed: number, spread = 14) {
  const greens = IVY[period];
  const leaves: ReactElement[] = [];
  let n = seed;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  leaves.push(<Path key={`${seed}:mass`} d={d} stroke={greens[0]} strokeWidth={spread * 2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.9} />);
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 7));
    for (let k = 0; k < steps; k++) {
      const f = k / steps;
      const x = x1 + (x2 - x1) * f + (rnd() - 0.5) * spread * 2.2;
      const y = y1 + (y2 - y1) * f + (rnd() - 0.5) * spread * 2.2;
      leaves.push(ivyLeaf(x, y, 8 + rnd() * 6, rnd() * 360, greens[1 + Math.floor(rnd() * (greens.length - 1))], `${seed}:${i}:${k}`));
    }
  }
  return leaves;
}

/**
 * The front of the building, up close, filling the screen from `top` to `bottom`: a pink
 * brownstone (tall arched windows under carved hoods, a black arched door, iron stoop
 * railings, a topiary) or a red brick townhouse covered in ivy (white trim, shutters, an
 * iron fence). A window on the left, the door up a stoop on the right.
 */
function Wall({ w, top, bottom, band, period, style = 'brownstone' }: { w: number; top: number; bottom: number; band: { top: number; height: number }; period: Period; style?: Building }) {
  const ivy = style === 'ivy';
  const [stone, line] = ivy ? IVY_BRICK[period] : BRICK[period];
  const pinkTrim = period === 'night' ? '#76586A' : period === 'dusk' ? '#D3AEB0' : '#EED3CC';
  const whiteTrim = period === 'night' ? '#7A7A8A' : period === 'dusk' ? '#D9D0C8' : '#F7F3EC';
  const trim = ivy ? whiteTrim : pinkTrim;
  const steps = ivy ? (period === 'night' ? '#5A4A44' : '#B9A094') : pinkTrim;
  const iron = '#1F1F2E';
  const row = ivy ? 15 : 34;
  const per = ivy ? 9 : 3;
  const rows = Math.ceil((bottom - top) / row);
  const lit = period === 'dusk' || period === 'night';
  const H = bottom - top;
  const floor = band.top;
  const FH = bottom - floor;
  const glass = lit ? '#FFD23F' : '#BFD0F5';
  // The window, on the left, and the door and stoop on the right: the same height, balanced.
  const winW = w * 0.16;
  const winX = w * 0.17;
  const winTop = floor + FH * 0.06;
  const winH = FH * 0.52;
  const dX = w * 0.66;
  const dW = w * 0.19;
  const dTop = floor + FH * 0.06;
  const landing = floor + FH * 0.58;
  const stepCount = 4;
  const stepH = (bottom - landing) / stepCount;

  const archWindow = (x: number, y: number, ww: number, wh: number, k: string) => (
    <G key={k}>
      {/* A carved hood over the window, then the arched frame and glass. */}
      <Path d={`M${x - 8} ${y + ww / 2 - 2} Q${x + ww / 2} ${y - ww * 0.25} ${x + ww + 8} ${y + ww / 2 - 2} L${x + ww + 8} ${y + ww / 2 + 6} Q${x + ww / 2} ${y - ww * 0.12} ${x - 8} ${y + ww / 2 + 6} Z`} fill={pinkTrim} stroke={INK} strokeWidth={1.2} />
      <Path d={`M${x} ${y + wh} V${y + ww / 2} A${ww / 2} ${ww / 2} 0 0 1 ${x + ww} ${y + ww / 2} V${y + wh} Z`} fill={iron} stroke={INK} strokeWidth={1.5} />
      <Path d={`M${x + 4} ${y + wh} V${y + ww / 2} A${ww / 2 - 4} ${ww / 2 - 4} 0 0 1 ${x + ww - 4} ${y + ww / 2} V${y + wh} Z`} fill={glass} />
      <Path d={`M${x + 4} ${y + wh * 0.5} H${x + ww - 4}`} stroke={iron} strokeWidth={3} />
      <Rect x={x - 6} y={y + wh} width={ww + 12} height={6} fill={pinkTrim} stroke={INK} strokeWidth={1.2} />
    </G>
  );
  const squareWindow = (x: number, y: number, ww: number, wh: number, k: string) => (
    <G key={k}>
      {/* Navy shutters, a white frame and lintel, six panes. */}
      <Rect x={x - ww * 0.32} y={y} width={ww * 0.28} height={wh} fill="#2E3A52" stroke={INK} strokeWidth={1.2} />
      <Rect x={x + ww + ww * 0.04} y={y} width={ww * 0.28} height={wh} fill="#2E3A52" stroke={INK} strokeWidth={1.2} />
      <Rect x={x - 4} y={y - 10} width={ww + 8} height={8} fill={whiteTrim} stroke={INK} strokeWidth={1.2} />
      <Rect x={x} y={y} width={ww} height={wh} fill={whiteTrim} stroke={INK} strokeWidth={1.5} />
      <Rect x={x + 4} y={y + 4} width={ww - 8} height={wh - 8} fill={glass} />
      <Path d={`M${x + ww / 2} ${y + 4} V${y + wh - 4} M${x + 4} ${y + wh / 3} H${x + ww - 4} M${x + 4} ${y + (wh * 2) / 3} H${x + ww - 4}`} stroke={whiteTrim} strokeWidth={2.5} />
      <Rect x={x - 6} y={y + wh} width={ww + 12} height={6} fill={whiteTrim} stroke={INK} strokeWidth={1.2} />
    </G>
  );
  const window = ivy ? squareWindow : archWindow;

  return (
    <G>
      <Rect x={0} y={top} width={w} height={H} fill={stone} />
      {Array.from({ length: rows }, (_, r) => (
        <G key={r}>
          <Path d={`M0 ${top + row * (r + 1)} H${w}`} stroke={line} strokeWidth={ivy ? 1 : 1.5} />
          {Array.from({ length: per + 1 }, (_, c) => (
            <Path key={c} d={`M${(w / per) * c + (r % 2 ? w / per / 2 : 0)} ${top + row * r} V${top + row * (r + 1)}`} stroke={line} strokeWidth={ivy ? 1 : 1.5} />
          ))}
        </G>
      ))}

      {/* Ivy climbs the brick: up the left side, along the top, around the door. Windows sit on top of it. */}
      {ivy && (
        <G>
          {/* Ivy stays below the header, so the time and weather always read. */}
          {ivyAlong([[w * 0.03, bottom], [w * 0.07, floor + FH * 0.5], [w * 0.04, floor + FH * 0.05], [w * 0.1, floor - 4]], period, 7, 18)}
          {ivyAlong([[w * 0.06, floor + 4], [w * 0.28, floor + 10], [w * 0.48, floor + 2], [w * 0.6, floor + 8]], period, 11, 12)}
          {ivyAlong([[w * 0.46, floor + 10], [w * 0.44, floor + FH * 0.3], [w * 0.5, floor + FH * 0.55]], period, 19, 12)}
          {ivyAlong([[w * 0.97, bottom - 20], [w * 0.93, landing], [w * 0.95, dTop + 6], [w * 0.88, floor + 4]], period, 17, 14)}
        </G>
      )}

      {window(winX, winTop, winW, winH, 'main')}
      {/* A flower box under the ground-floor window. */}
      {[0.15, 0.35, 0.55, 0.75, 0.92].map((f, i) => (
        <G key={i}>
          <Path d={`M${winX + winW * f} ${winTop + winH + 8} V${winTop + winH - 2}`} stroke="#3E8E4E" strokeWidth={2} />
          <Circle cx={winX + winW * f} cy={winTop + winH - 4} r={4.5} fill={i % 2 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />
        </G>
      ))}
      <Rect x={winX - 5} y={winTop + winH + 4} width={winW + 10} height={12} rx={3} fill="#9A6A44" stroke={INK} strokeWidth={1.2} />

      {/* The doorway: a heavy hood on carved brackets (brownstone) or a white columned surround (ivy), and the door. */}
      {ivy ? (
        <G>
          <Rect x={dX - 14} y={dTop - 14} width={dW + 28} height={10} fill={whiteTrim} stroke={INK} strokeWidth={1.5} />
          <Rect x={dX - 12} y={dTop - 4} width={10} height={landing - dTop + 4} fill={whiteTrim} stroke={INK} strokeWidth={1.2} />
          <Rect x={dX + dW + 2} y={dTop - 4} width={10} height={landing - dTop + 4} fill={whiteTrim} stroke={INK} strokeWidth={1.2} />
          <Rect x={dX} y={dTop - 4} width={dW} height={dW * 0.28} fill={glass} stroke={INK} strokeWidth={1.2} />
          <Rect x={dX} y={dTop - 4 + dW * 0.28} width={dW} height={landing - dTop + 4 - dW * 0.28} fill="#7A4E2A" stroke={INK} strokeWidth={1.5} />
          <Rect x={dX + dW * 0.16} y={dTop + dW * 0.4} width={dW * 0.68} height={(landing - dTop) * 0.36} rx={2} fill="none" stroke="#5E3A20" strokeWidth={2} />
          <Circle cx={dX + dW * 0.8} cy={(dTop + landing) / 2 + 10} r={2.6} fill={colors.yellow} stroke={INK} strokeWidth={0.8} />
          {/* A little lantern beside the door. */}
          <Rect x={dX + dW + 16} y={dTop + 20} width={10} height={14} rx={2} fill={lit ? colors.yellow : '#F7F3EC'} stroke={INK} strokeWidth={1.2} />
        </G>
      ) : (
        <G>
          <Path d={`M${dX - 18} ${dTop - 4} Q${dX + dW / 2} ${dTop - 30} ${dX + dW + 18} ${dTop - 4} L${dX + dW + 18} ${dTop + 4} Q${dX + dW / 2} ${dTop - 18} ${dX - 18} ${dTop + 4} Z`} fill={pinkTrim} stroke={INK} strokeWidth={1.5} />
          {[dX - 16, dX + dW + 6].map((bx, i) => (
            <Path key={i} d={`M${bx} ${dTop + 4} H${bx + 10} V${dTop + 22} Q${bx + 5} ${dTop + 30} ${bx} ${dTop + 22} Z`} fill={pinkTrim} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          ))}
          <Path d={`M${dX} ${landing} V${dTop + dW / 2} A${dW / 2} ${dW / 2} 0 0 1 ${dX + dW} ${dTop + dW / 2} V${landing} Z`} fill={iron} stroke={INK} strokeWidth={1.5} />
          <Path d={`M${dX + dW / 2} ${dTop + 8} V${landing}`} stroke="#3A3A4E" strokeWidth={2} />
          {[0.22, 0.62].map((f, i) => (
            <Rect key={i} x={dX + dW * (i ? 0.56 : 0.14)} y={dTop + dW * 0.6} width={dW * 0.3} height={(landing - dTop) * 0.38} rx={2} fill="none" stroke="#3A3A4E" strokeWidth={2} />
          ))}
          <Circle cx={dX + dW * 0.42} cy={(dTop + landing) / 2 + 8} r={2.6} fill={colors.yellow} stroke={INK} strokeWidth={0.8} />
        </G>
      )}
      {/* A boxwood topiary in a pot on the landing. */}
      <G>
        <Path d={`M${dX - 22} ${landing - 14} L${dX - 6} ${landing - 14} L${dX - 8} ${landing} L${dX - 20} ${landing} Z`} fill={ivy ? '#C9C1B4' : '#E3DACB'} stroke={INK} strokeWidth={1.2} />
        <Circle cx={dX - 14} cy={landing - 26} r={14} fill="#3E8E4E" stroke={INK} strokeWidth={1.2} />
        <Circle cx={dX - 18} cy={landing - 30} r={4} fill="#5FAE5E" />
      </G>

      {/* The stoop: steps fanning down to the sidewalk, with black iron railings. */}
      {Array.from({ length: stepCount }, (_, i) => {
        const y = landing + stepH * i;
        const spread = 8 + i * 5;
        return <Rect key={i} x={dX - spread} y={y} width={dW + spread * 2} height={stepH} fill={steps} stroke={INK} strokeWidth={1.2} />;
      })}
      {[
        [dX - 6, dX - 30],
        [dX + dW + 6, dX + dW + 30],
      ].map(([x1, x2], i) => (
        <G key={i}>
          <Path d={`M${x1} ${landing - 22} L${x2} ${bottom - 26}`} stroke={iron} strokeWidth={4} strokeLinecap="round" />
          {Array.from({ length: 5 }, (_, k) => {
            const f = (k + 0.5) / 5;
            const x = x1 + (x2 - x1) * f;
            const y = landing - 22 + (bottom - 26 - landing + 22) * f;
            return <Path key={k} d={`M${x} ${y} V${y + 22}`} stroke={iron} strokeWidth={2} />;
          })}
          <Rect x={x2 - 6} y={bottom - 30} width={12} height={30} rx={2} fill={iron} />
          <Circle cx={x2} cy={bottom - 33} r={6} fill={iron} />
        </G>
      ))}

      {/* An iron fence along the front, on the ivy townhouse. */}
      {ivy && (
        <G>
          <Path d={`M0 ${bottom - 24} H${dX - 40}`} stroke={iron} strokeWidth={3} />
          {Array.from({ length: Math.floor((dX - 40) / 12) }, (_, k) => (
            <G key={k}>
              <Path d={`M${6 + k * 12} ${bottom} V${bottom - 30}`} stroke={iron} strokeWidth={2} />
              <Path d={`M${2 + k * 12} ${bottom - 30} L${6 + k * 12} ${bottom - 38} L${10 + k * 12} ${bottom - 30} Z`} fill={iron} />
            </G>
          ))}
        </G>
      )}
    </G>
  );
}

/** A stone cornice along the top of the wall: a cap, a band and a soft shadow under it, with a few chunky brackets. */
function Cornice({ w, y, period, brackets: withBrackets = true }: { w: number; y: number; period: Period; /** Off at the very top, where the status bar sits. */ brackets?: boolean }) {
  const stone = period === 'night' ? '#6E6A80' : period === 'dusk' ? '#B3ABA0' : '#E3DACB';
  const shade = period === 'night' ? '#55546A' : period === 'dusk' ? '#9A9086' : '#C2B6A3';
  const brackets = withBrackets ? Math.max(4, Math.round(w / 70)) : 0;
  return (
    <G>
      <Rect x={-4} y={y - 14} width={w + 8} height={6} rx={2} fill={stone} stroke={INK} strokeWidth={1.5} />
      <Rect x={-4} y={y - 8} width={w + 8} height={10} fill={shade} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: brackets }, (_, i) => {
        const bx = ((i + 0.5) * w) / brackets;
        return <Path key={i} d={`M${bx - 7} ${y + 2} H${bx + 7} V${y + 8} Q${bx} ${y + 16} ${bx - 7} ${y + 8} Z`} fill={shade} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />;
      })}
    </G>
  );
}

/** A tree branch reaching over the wall from the left (its leaves are drawn separately, so they can flutter). */
function WallBranch({ w, y, bh }: { w: number; y: number; bh: number }) {
  const d = `M${-10} ${y + bh * 0.1} C${w * 0.1} ${y + bh * 0.04} ${w * 0.22} ${y + bh * 0.06} ${w * 0.34} ${y + bh * 0.02}`;
  const twig = `M${w * 0.14} ${y + bh * 0.06} C${w * 0.17} ${y + bh * 0.12} ${w * 0.22} ${y + bh * 0.15} ${w * 0.27} ${y + bh * 0.13}`;
  return (
    <G>
      {[d, twig].map((p, i) => (
        <G key={i}>
          <Path d={p} stroke={INK} strokeWidth={(i ? 5 : 9) + 3} strokeLinecap="round" fill="none" />
          <Path d={p} stroke={BARK} strokeWidth={i ? 5 : 9} strokeLinecap="round" fill="none" />
        </G>
      ))}
    </G>
  );
}

/** The sidewalk from `top` to the bottom of the screen: slabs and a curb. */
function Sidewalk({ w, h, top, period }: { w: number; h: number; top: number; period: Period }) {
  const curb = top + 140;
  return (
    <G>
      <Rect x={0} y={top} width={w} height={h - top} fill={PAVEMENT[period]} />
      <Path d={`M0 ${top} H${w}`} stroke={INK} strokeWidth={1.5} />
      {[0.18, 0.44, 0.7, 0.96].map((x, i) => (
        <Path key={i} d={`M${w * x} ${top} L${w * (x - 0.1)} ${curb}`} stroke="#B9B6C4" strokeWidth={2} />
      ))}
      <Rect x={0} y={curb} width={w} height={h - curb} fill="#A9A7BA" />
      <Path d={`M0 ${curb} H${w}`} stroke={INK} strokeWidth={1.5} />
    </G>
  );
}

// ---------------------------------------------------------------- neighborhood looks

/** The front of the building on this block, in the neighborhood's style. */
function Facade({ look, w, bottom, band, period }: { look: Building; w: number; bottom: number; band: { top: number; height: number }; period: Period }) {
  return <Wall w={w} top={0} bottom={bottom} band={band} period={period} style={look} />;
}

const dim = (period: Period, day: string, dusk: string, night: string) => (period === 'night' ? night : period === 'dusk' ? dusk : day);

/** A river or harbor: the city across the water, a stone edge on the far side. */
function River({ w, h, horizon, period, landmark, top = 0 }: { w: number; h: number; horizon: number; period: Period; landmark?: Landmark; top?: number }) {
  return (
    <G>
      <FarCity w={w} base={horizon - 2} period={period} />
      {landmark && <LandmarkShape kind={landmark} x={w * 0.72} base={horizon - 2} size={110} period={period} top={top} />}
      <Rect x={0} y={horizon - 4} width={w} height={6} fill={dim(period, '#C9C1B4', '#A39C90', '#4A4652')} />
      <Rect x={0} y={horizon} width={w} height={h - horizon} fill={WATER[period]} />
      <Path d={`M0 ${horizon} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
    </G>
  );
}

/** The ocean: a flat blue horizon with gentle rolling waves. */
function Ocean({ w, h, horizon, period, landmark, top = 0 }: { w: number; h: number; horizon: number; period: Period; landmark?: Landmark; top?: number }) {
  const sea = dim(period, '#7FA8E8', '#5E7FD6', '#2E3A62');
  return (
    <G>
      {landmark && <LandmarkShape kind={landmark} x={w * 0.75} base={horizon} size={120} period={period} top={top} />}
      <Rect x={0} y={horizon} width={w} height={h - horizon} fill={sea} />
      <Path d={`M0 ${horizon} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
      {[0.25, 0.5].map((k, i) => (
        <Path key={i} d={Array.from({ length: 8 }, (_, j) => `${j ? '' : `M0 ${horizon + 24 + i * 30}`} q${w / 16} -8 ${w / 8} 0`).join(' ')} stroke="#FFFFFF" strokeWidth={2.5} fill="none" opacity={0.7} />
      ))}
    </G>
  );
}

/** The city in the distance: a row of little pastel towers with outlines, windows and rooftops. */
function FarCity({ w, base, period, tower = false }: { w: number; base: number; period: Period; /** One tall, stepped skyscraper standing in the row. */ tower?: boolean }) {
  const night = period === 'night' || period === 'dusk';
  const walls = night ? ['#4A4A72', '#5A4A6E', '#3E4A72'] : period === 'dawn' ? ['#F2C4D4', '#E8D4F2', '#FADADA'] : ['#E8D4F2', '#FADADA', '#D4E2F7', '#F7E3C4'];
  const glass = night ? '#FFD23F' : '#BFD0F5';
  const towers: [number, number, number][] = [[0, 0.1, 40], [0.09, 0.08, 66], [0.16, 0.12, 48], [0.27, 0.07, 84], [0.33, 0.1, 56], [0.42, 0.09, 70], [0.5, 0.12, 44], [0.6, 0.08, 60], [0.86, 0.14, 50]];
  return (
    <G>
      {towers.map(([x, tw, th], i) => {
        if (tower && i === 3) return <Skyscraper key={i} x={w * 0.25} base={base} tw={w * 0.1} th={th * 1.7} wall={walls[i % walls.length]} glass={glass} night={night} />;
        const bx = w * x;
        const bw = w * tw;
        const top = base - th;
        const rows = Math.floor((th - 8) / 11);
        const cols = Math.max(2, Math.floor(bw / 10));
        return (
          <G key={i}>
            <Rect x={bx} y={top} width={bw} height={th} fill={walls[i % walls.length]} stroke={INK} strokeWidth={1} />
            {i % 3 === 1 ? (
              <Path d={`M${bx} ${top} L${bx + bw / 2} ${top - 8} L${bx + bw} ${top} Z`} fill={walls[(i + 1) % walls.length]} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
            ) : (
              <Rect x={bx - 1.5} y={top - 3} width={bw + 3} height={4} fill={walls[(i + 2) % walls.length]} stroke={INK} strokeWidth={0.8} />
            )}
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => (
                <Rect key={`${r}:${c}`} x={bx + 3 + c * ((bw - 6) / cols) + 1} y={top + 6 + r * 11} width={(bw - 6) / cols - 3} height={6} fill={(r + c + i) % 3 === 0 ? glass : night ? '#2E2E44' : '#FFFFFF'} stroke={INK} strokeWidth={0.6} />
              )),
            )}
          </G>
        );
      })}
    </G>
  );
}

/** A tall art-deco skyscraper: stepped setbacks, rows of windows, and a spire. */
function Skyscraper({ x, base, tw, th, wall, glass, night }: { x: number; base: number; tw: number; th: number; wall: string; glass: string; night: boolean }) {
  const tiers: [number, number][] = [[1, 0.62], [0.72, 0.22], [0.46, 0.12]];
  let top = base;
  const parts = tiers.map(([wf, hf], k) => {
    const pw = tw * wf;
    const ph = th * hf;
    top -= ph;
    const px = x + (tw - pw) / 2;
    const rows = Math.floor((ph - 6) / 9);
    const cols = Math.max(2, Math.floor(pw / 8));
    return (
      <G key={k}>
        <Rect x={px} y={top} width={pw} height={ph} fill={wall} stroke={INK} strokeWidth={1} />
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <Rect key={`${r}:${c}`} x={px + 2 + c * ((pw - 4) / cols) + 0.8} y={top + 4 + r * 9} width={(pw - 4) / cols - 2} height={5} fill={(r + c) % 3 === 0 ? glass : night ? '#2E2E44' : '#FFFFFF'} stroke={INK} strokeWidth={0.5} />
          )),
        )}
      </G>
    );
  });
  return (
    <G>
      {parts}
      <Path d={`M${x + tw / 2} ${top} V${top - th * 0.18}`} stroke={INK} strokeWidth={2} />
      <Circle cx={x + tw / 2} cy={top - th * 0.18} r={2} fill={colors.pink} />
    </G>
  );
}

/** A landmark on the horizon, small and soft so it never competes with the animal. */
function LandmarkShape({ kind, x, base, size, period, top = 0 }: { kind: Landmark; x: number; base: number; size: number; period: Period; /** Never reach above this (the header). */ top?: number }) {
  const fill = dim(period, '#B4ACD0', '#5468C0', '#3B3A58');
  const line = dim(period, '#8E86B0', '#3E4E9E', '#2A2A42');
  // Small enough that the tallest part stays below the header.
  const s = Math.min(size, Math.max(20, (base - top) / 1.1));
  const sw = { stroke: line, strokeWidth: 1.5 };
  switch (kind) {
    case 'verrazzano':
    case 'williamsburg-bridge':
    case 'brooklyn-bridge': {
      const tower = kind === 'brooklyn-bridge'
        ? (tx: number) => <Path d={`M${tx - 10} ${base} V${base - s * 0.7} H${tx + 10} V${base} Z M${tx - 5} ${base - s * 0.45} a5 7 0 0 1 10 0 V${base - s * 0.3} H${tx - 5} Z`} fill={fill} {...sw} />
        : (tx: number) => <Path d={`M${tx - 6} ${base} V${base - s * 0.8} H${tx + 6} V${base} Z`} fill={fill} {...sw} />;
      const a = x - s * 0.55;
      const b = x + s * 0.55;
      return (
        <G opacity={0.9}>
          <Path d={`M${x - s * 1.4} ${base - s * 0.2} H${x + s * 1.4}`} stroke={line} strokeWidth={4} />
          <Path d={`M${x - s * 1.4} ${base - s * 0.25} Q${a} ${base - s * 0.2} ${a} ${base - s * 0.78} Q${x} ${base - s * 0.15} ${b} ${base - s * 0.78} Q${b} ${base - s * 0.2} ${x + s * 1.4} ${base - s * 0.25}`} stroke={line} strokeWidth={1.5} fill="none" />
          {tower(a)}
          {tower(b)}
        </G>
      );
    }
    case 'liberty':
      return (
        <G opacity={0.95}>
          <Path d={`M${x - s * 0.14} ${base} L${x - s * 0.1} ${base - s * 0.3} H${x + s * 0.1} L${x + s * 0.14} ${base} Z`} fill={fill} {...sw} />
          <Path d={`M${x - s * 0.07} ${base - s * 0.3} L${x - s * 0.05} ${base - s * 0.72} H${x + s * 0.05} L${x + s * 0.07} ${base - s * 0.3} Z`} fill="#8FCBB8" {...sw} />
          <Circle cx={x} cy={base - s * 0.77} r={s * 0.05} fill="#8FCBB8" {...sw} />
          {[-0.08, -0.04, 0, 0.04, 0.08].map((dx, i) => <Path key={i} d={`M${x} ${base - s * 0.8} l${s * dx} ${-s * 0.06}`} stroke="#8FCBB8" strokeWidth={2} />)}
          <Path d={`M${x + s * 0.04} ${base - s * 0.66} L${x + s * 0.12} ${base - s * 0.95}`} stroke="#8FCBB8" strokeWidth={5} strokeLinecap="round" />
          <Circle cx={x + s * 0.12} cy={base - s * 0.98} r={s * 0.03} fill={colors.yellow} />
        </G>
      );
    case 'wonder-wheel': {
      // A cute pastel Ferris wheel: a double rim, colorful pods, a little star on top.
      const cy = base - s * 0.5;
      const r = s * 0.4;
      const pods = ['#FF8FB0', '#FFD23F', '#9DD0F5', '#8BD9B8', '#B4A2F2', '#FFB38A', '#FF8FB0', '#9DD0F5'];
      return (
        <G>
          <Path d={`M${x - s * 0.28} ${base} L${x} ${cy} L${x + s * 0.28} ${base}`} stroke={INK} strokeWidth={6} fill="none" strokeLinejoin="round" />
          <Path d={`M${x - s * 0.28} ${base} L${x} ${cy} L${x + s * 0.28} ${base}`} stroke="#9DB9F2" strokeWidth={3.5} fill="none" strokeLinejoin="round" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <Path key={i} d={`M${x} ${cy} l${Math.cos(a) * r} ${Math.sin(a) * r}`} stroke="#F7F3EC" strokeWidth={2} />;
          })}
          <Circle cx={x} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={6} />
          <Circle cx={x} cy={cy} r={r} fill="none" stroke={colors.pink} strokeWidth={3.5} />
          <Circle cx={x} cy={cy} r={r * 0.62} fill="none" stroke="#FFB3CB" strokeWidth={2} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const px = x + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            return <Path key={`p${i}`} d={`M${px - 6} ${py} H${px + 6} V${py + 7} Q${px} ${py + 13} ${px - 6} ${py + 7} Z`} fill={pods[i]} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />;
          })}
          <Circle cx={x} cy={cy} r={6} fill={colors.yellow} stroke={INK} strokeWidth={1.5} />
          <Path d={`M${x} ${cy - r - 12} l2.5 5 5.5 0.8 -4 3.8 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -3.8 5.5 -0.8 Z`} fill={colors.yellow} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        </G>
      );
    }
    case 'unisphere':
      return (
        <G opacity={0.9}>
          <Path d={`M${x} ${base} V${base - s * 0.25}`} stroke={line} strokeWidth={5} />
          <Circle cx={x} cy={base - s * 0.55} r={s * 0.32} fill="none" stroke={line} strokeWidth={2.5} />
          {[0.12, 0.22].map((k, i) => <Ellipse key={i} cx={x} cy={base - s * 0.55} rx={s * 0.32} ry={s * k} fill="none" stroke={line} strokeWidth={1.5} />)}
          <Ellipse cx={x} cy={base - s * 0.55} rx={s * 0.12} ry={s * 0.32} fill="none" stroke={line} strokeWidth={1.5} />
          <Ellipse cx={x - s * 0.08} cy={base - s * 0.6} rx={s * 0.1} ry={s * 0.06} fill={fill} />
        </G>
      );
    case 'empire':
      return (
        <G opacity={0.9}>
          <Path d={`M${x - s * 0.12} ${base} V${base - s * 0.5} H${x - s * 0.08} V${base - s * 0.66} H${x - s * 0.04} V${base - s * 0.8} H${x + s * 0.04} V${base - s * 0.66} H${x + s * 0.08} V${base - s * 0.5} H${x + s * 0.12} V${base} Z`} fill={fill} {...sw} />
          <Path d={`M${x} ${base - s * 0.8} V${base - s * 1.0}`} stroke={line} strokeWidth={2} />
          <Rect x={x - s * 0.4} y={base - s * 0.32} width={s * 0.18} height={s * 0.32} fill={fill} {...sw} />
          <Rect x={x + s * 0.22} y={base - s * 0.4} width={s * 0.16} height={s * 0.4} fill={fill} {...sw} />
        </G>
      );
    default:
      // The skyline: a cluster of towers, one with a spire.
      return (
        <G opacity={0.9}>
          {[[-0.45, 0.14, 0.4], [-0.28, 0.12, 0.62], [-0.12, 0.14, 0.5], [0.04, 0.1, 0.85], [0.16, 0.14, 0.55], [0.32, 0.12, 0.42]].map(([dx, tw, th], i) => (
            <Rect key={i} x={x + s * dx} y={base - s * th} width={s * tw} height={s * th} fill={fill} {...sw} />
          ))}
          <Path d={`M${x + s * 0.09} ${base - s * 0.85} V${base - s * 1.05}`} stroke={line} strokeWidth={2} />
        </G>
      );
  }
}
