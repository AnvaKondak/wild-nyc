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

import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Mood, Period, Season, Setting } from '@/content/types';
import type { Sky } from '@/lib/weather';
import { colors } from '@/theme/tokens';
import { useReduceMotion } from '../backdrop/motion';
import { Character, cutoutFeet, cutoutPose, hasCutout } from '../characters/Character';

export type CloseUpSetting =
  | 'building' | 'puddle' | 'branch' | 'trunk' | 'hedge' | 'lawn' | 'flowers' | 'burrow'
  | 'wire' | 'sky' | 'water' | 'wade' | 'shore' | 'pier' | 'reeds' | 'web';

// Who walks to the water rather than swims: at a puddle in the city.
const CITY_WALKERS = ['rock-pigeon', 'house-sparrow', 'european-starling', 'raccoon', 'eastern-gray-squirrel', 'american-robin', 'northern-cardinal'];
// Who lives in burrows and dens on the ground.
const BURROWERS = ['groundhog', 'virginia-opossum'];

/** The close-up scene for this animal in this setting, or nothing (then the sticker shows). */
export function closeUpFor(speciesId: string | undefined, setting: Setting | undefined): CloseUpSetting | undefined {
  if (!hasCutout(speciesId) || !setting) return undefined;
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
  if (pose === 'wade') return setting === 'branch' ? 'branch' : 'wade';
  switch (setting) {
    case 'branch':
    case 'trunk':
      return 'branch';
    case 'den':
      return BURROWERS.includes(speciesId) ? 'burrow' : 'branch';
    case 'hedge':
      return 'hedge';
    case 'lawn':
    case 'flowers':
      return 'lawn';
    case 'sidewalk':
    case 'ledge':
    case 'rooftop':
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
};

/** Where the animal's feet go (from the band's top, as a fraction of its height) and how big they are, per scene. */
const PLACE: Record<CloseUpSetting, { ground: number; size: number; x: number }> = {
  building: { ground: 0.94, size: 1.0, x: 0.5 },
  puddle: { ground: 0.94, size: 1.0, x: 0.58 },
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
};
const OPEN_SKY: CloseUpSetting[] = ['branch', 'trunk', 'hedge', 'lawn', 'flowers', 'burrow', 'wire', 'sky', 'water', 'wade', 'shore', 'pier', 'reeds', 'web'];

export function CloseUp({ setting, speciesId, mood, width: w, height: h, band, period, season, sky, weather }: Props) {
  const bt = band.top;
  const bh = band.height;
  const place = PLACE[setting];
  const ground = bt + bh * place.ground;
  const size = bh * place.size;
  const top = ground - size * cutoutFeet(speciesId);
  const left = w * place.x - size * 0.45;
  const animal = (
    <View style={{ position: 'absolute', left, top }}>
      <Character speciesId={speciesId} size={size} mood={mood} cutout />
    </View>
  );
  const horizon = bt + bh * 0.5; // the far shore, by the water
  const pavement = ground - bh * 0.08; // where the sidewalk starts
  const leaves = LEAVES[season];
  const city = setting === 'building' || setting === 'puddle';
  const watery = setting === 'water' || setting === 'wade' || setting === 'reeds' || setting === 'shore' || setting === 'pier';
  // How deep the water comes up, in front of whoever's in it.
  const waterline = setting === 'wade' ? bt + bh * 0.8 : ground;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: sky, overflow: 'hidden' }}>
      {OPEN_SKY.includes(setting) && <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} behind />}
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {city && (
          <>
            {/* Up close, the brownstone fills the whole screen. */}
            <Wall w={w} top={0} bottom={pavement} band={band} period={period} />
            <Cornice w={w} y={4} period={period} brackets={false} />
            <WallBranch y={bt} bh={bh} w={w} />
            <Sidewalk w={w} h={h} top={pavement} period={period} />
          </>
        )}
        {setting === 'puddle' && (
          <>
            <Ellipse cx={w * 0.3} cy={ground + bh * 0.03} rx={w * 0.2} ry={bh * 0.06} fill={WATER[period]} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${w * 0.2} ${ground + bh * 0.02} q${w * 0.04} -4 ${w * 0.08} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
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
        {(setting === 'wire' || setting === 'sky') && <Skyline w={w} h={h} base={bt + bh * 1.05} period={period} />}
        {setting === 'wire' && <Wire w={w} y={ground} bh={bh} />}
        {watery && <Pond w={w} h={h} horizon={horizon} period={period} season={season} />}
        {setting === 'reeds' && <Reeds w={w} ground={ground} bh={bh} back />}
        {setting === 'reeds' && <BentReed w={w} y={ground} bh={bh} />}
        {setting === 'shore' && <Shore w={w} h={h} top={ground - bh * 0.06} period={period} />}
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
      {setting === 'branch' && leaves.length > 0 && FRONT_LEAVES.map((l, i) => <Leaf key={i} {...l} w={w} y={ground} bh={bh} color={leaves[(i + 1) % leaves.length]} />)}
      <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} />
    </View>
  );
}

// ---------------------------------------------------------------- more places

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

/** A big rounded hedge behind the animal, in the season's greens. */
function Hedge({ w, ground, bh, season, period }: { w: number; ground: number; bh: number; season: Season; period: Period }) {
  const [a, b] = HEDGE[season];
  const dark = period === 'night' || period === 'dusk';
  const blobs = [0.04, 0.2, 0.38, 0.56, 0.74, 0.92];
  return (
    <G opacity={dark ? 0.85 : 1}>
      {blobs.map((x, i) => (
        <Circle key={i} cx={w * x} cy={ground - bh * (0.3 + (i % 2) * 0.12)} r={bh * (0.26 + (i % 3) * 0.04)} fill={i % 2 ? b : a} stroke={INK} strokeWidth={1.5} />
      ))}
      <Rect x={0} y={ground - bh * 0.3} width={w} height={bh * 0.3} fill={a} />
      {season === 'fall' || season === 'spring'
        ? blobs.map((x, i) => <Circle key={`b${i}`} cx={w * x + 12} cy={ground - bh * (0.42 + (i % 2) * 0.1)} r={4} fill={season === 'fall' ? '#E5484D' : '#FFB3CB'} />)
        : null}
    </G>
  );
}

/** A few big friendly flowers in front, for bees and butterflies to hover over. */
function Flowers({ w, ground, bh, period }: { w: number; ground: number; bh: number; period: Period }) {
  const petals = period === 'night' ? ['#B88AB8', '#C9B86A'] : ['#FF8FB0', '#FFD23F', '#B4A2F2'];
  return (
    <G>
      {[0.12, 0.3, 0.7, 0.88].map((x, i) => {
        const cx = w * x;
        const cy = ground - bh * (0.12 + (i % 2) * 0.12);
        const r = bh * 0.07;
        return (
          <G key={i}>
            <Path d={`M${cx} ${cy} V${ground + bh * 0.2}`} stroke="#3E8E4E" strokeWidth={4} />
            <Ellipse cx={cx + 12} cy={cy + bh * 0.12} rx={14} ry={6} transform={`rotate(-30 ${cx + 12} ${cy + bh * 0.12})`} fill="#5FC48E" stroke={INK} strokeWidth={1.2} />
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const a = (k / 6) * Math.PI * 2;
              return <Circle key={k} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={r * 0.7} fill={petals[i % petals.length]} stroke={INK} strokeWidth={1.2} />;
            })}
            <Circle cx={cx} cy={cy} r={r * 0.6} fill={colors.yellow} stroke={INK} strokeWidth={1.2} />
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

/** Far-off city rooftops and water towers along the bottom of an open sky. */
function Skyline({ w, h, base, period }: { w: number; h: number; base: number; period: Period }) {
  const fill = period === 'night' ? '#3B3A50' : period === 'dusk' ? '#4A62C8' : period === 'dawn' ? '#E8B4C4' : '#C9C3DE';
  const blocks = [[0, 0.16, 0.12], [0.14, 0.12, 0.2], [0.28, 0.18, 0.1], [0.48, 0.14, 0.16], [0.64, 0.2, 0.08], [0.86, 0.16, 0.14]];
  return (
    <G opacity={0.9}>
      {blocks.map(([x, bw, bh2], i) => (
        <Rect key={i} x={w * x} y={base - h * bh2} width={w * bw} height={h} fill={fill} />
      ))}
      <Rect x={w * 0.55} y={base - h * 0.22} width={16} height={14} rx={2} fill={fill} />
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

/** The near shore: sand and a few pebbles, from `top` down. */
function Shore({ w, h, top, period }: { w: number; h: number; top: number; period: Period }) {
  return (
    <G>
      <Path d={`M0 ${top + 10} Q${w * 0.5} ${top - 10} ${w} ${top + 6} V${h} H0 Z`} fill={SAND[period]} stroke={INK} strokeWidth={1.5} />
      {[0.15, 0.3, 0.72, 0.88].map((x, i) => (
        <Ellipse key={i} cx={w * x} cy={top + 40 + (i % 2) * 30} rx={9} ry={6} fill="#B8B2C2" stroke={INK} strokeWidth={1.2} />
      ))}
    </G>
  );
}

/** A wooden pier from `top` down: planks and two posts. */
function Pier({ w, h, top }: { w: number; h: number; top: number }) {
  return (
    <G>
      <Rect x={0} y={top} width={w} height={h - top} fill="#B9875E" stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: 8 }, (_, i) => (
        <Path key={i} d={`M0 ${top + 18 * (i + 1)} H${w}`} stroke="#8A6247" strokeWidth={2} />
      ))}
      {[0.1, 0.9].map((x, i) => (
        <Rect key={i} x={w * x - 9} y={top - 40} width={18} height={44} rx={4} fill="#8A6247" stroke={INK} strokeWidth={1.5} />
      ))}
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
function SkyWeather({ w, h, bt, bh, period, weather, behind = false }: { w: number; h: number; bt: number; bh: number; period: Period; weather?: Sky; behind?: boolean }) {
  const still = useReduceMotion();
  const fall = useLinear(weather === 'snow' ? 9000 : 900, still || behind || !(weather === 'snow' || (weather && RAINY.includes(weather))));
  if (behind) {
    const day = period === 'dawn' || period === 'midday';
    const cloudy = !!weather && CLOUDY.includes(weather);
    const cloud = period === 'night' ? '#4A4A66' : period === 'dusk' ? '#6E8CE8' : '#FFFFFF';
    const cx = w * 0.84;
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

/** A few far-off trees: round crowns on little trunks, softened by distance. */
function FarTrees({ w, base, period, season, small = false }: { w: number; base: number; period: Period; season: Season; small?: boolean }) {
  const crown = period === 'night' || period === 'dusk' ? FAR[period] : LEAVES[season][0] ?? FAR[period];
  const trunk = period === 'night' ? '#2E2E44' : '#8A6247';
  const r = small ? 26 : 40;
  return (
    <G opacity={0.75}>
      {[0.08, 0.27, 0.5, 0.71, 0.92].map((x, i) => {
        const cr = r + (i % 3) * (small ? 6 : 10);
        const h = cr * 1.5;
        return (
          <G key={i}>
            <Rect x={w * x - 3} y={base - h} width={6} height={h} fill={trunk} />
            <Circle cx={w * x} cy={base - h - cr * 0.4} r={cr} fill={crown} stroke={INK} strokeWidth={1} strokeOpacity={0.35} />
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

/** A pink brownstone front from `top` to `bottom`: big smooth stone blocks, a cute arched window on the left, and the front door up a stoop on the right. */
function Wall({ w, top, bottom, band, period }: { w: number; top: number; bottom: number; band: { top: number; height: number }; period: Period }) {
  const [stone, line] = BRICK[period];
  const trim = period === 'night' ? '#76586A' : period === 'dusk' ? '#D3AEB0' : '#EED3CC';
  const row = 34;
  const rows = Math.ceil((bottom - top) / row);
  const lit = period === 'dusk' || period === 'night';
  const H = bottom - top;
  // The ground floor: from just under the header down to the sidewalk.
  const floor = band.top;
  const FH = bottom - floor;
  // The window, on the left.
  // The window and the door are the same height, so the front feels balanced.
  const winW = w * 0.16;
  const winX = w * 0.17;
  const winTop = floor + FH * 0.06;
  const winH = FH * 0.52;
  // The front door and stoop, on the right.
  const dX = w * 0.66;
  const dW = w * 0.19;
  const dTop = floor + FH * 0.06;
  const landing = floor + FH * 0.58;
  const steps = 4;
  const stepH = (bottom - landing) / steps;
  return (
    <G>
      <Rect x={0} y={top} width={w} height={H} fill={stone} />
      {Array.from({ length: rows }, (_, r) => (
        <G key={r}>
          <Path d={`M0 ${top + row * (r + 1)} H${w}`} stroke={line} strokeWidth={1.5} />
          {Array.from({ length: 4 }, (_, c) => (
            <Path key={c} d={`M${(w / 3) * c + (r % 2 ? w / 6 : 0)} ${top + row * r} V${top + row * (r + 1)}`} stroke={line} strokeWidth={1.5} />
          ))}
        </G>
      ))}

      {/* The window: arched, with curtains and a flower box. */}
      <Path d={`M${winX} ${winTop + winH} V${winTop + winW / 2} A${winW / 2} ${winW / 2} 0 0 1 ${winX + winW} ${winTop + winW / 2} V${winTop + winH} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
      <Path d={`M${winX + 5} ${winTop + winH} V${winTop + winW / 2} A${winW / 2 - 5} ${winW / 2 - 5} 0 0 1 ${winX + winW - 5} ${winTop + winW / 2} V${winTop + winH} Z`} fill={lit ? '#FFD23F' : '#BFD0F5'} />
      <Path d={`M${winX + 5} ${winTop + winW / 2 - 4} Q${winX + winW * 0.28} ${winTop + winH * 0.5} ${winX + 5} ${winTop + winH - 6} Z`} fill={colors.pinkTint} stroke={INK} strokeWidth={1} />
      <Path d={`M${winX + winW - 5} ${winTop + winW / 2 - 4} Q${winX + winW * 0.72} ${winTop + winH * 0.5} ${winX + winW - 5} ${winTop + winH - 6} Z`} fill={colors.pinkTint} stroke={INK} strokeWidth={1} />
      <Path d={`M${winX + winW / 2} ${winTop + 5} V${winTop + winH}`} stroke={INK} strokeWidth={1.2} />
      {[0.15, 0.35, 0.55, 0.75, 0.92].map((f, i) => (
        <G key={i}>
          <Path d={`M${winX + winW * f} ${winTop + winH + 6} V${winTop + winH - 4}`} stroke="#3E8E4E" strokeWidth={2} />
          <Circle cx={winX + winW * f} cy={winTop + winH - 6} r={4.5} fill={i % 2 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />
        </G>
      ))}
      <Rect x={winX - 5} y={winTop + winH + 2} width={winW + 10} height={13} rx={3} fill="#9A6A44" stroke={INK} strokeWidth={1.2} />

      {/* The doorway: a little pediment, columns, an arched transom and a double door with a wreath. */}
      <Path d={`M${dX - 10} ${dTop - 6} L${dX + dW / 2} ${dTop - 22} L${dX + dW + 10} ${dTop - 6} Z`} fill={trim} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={dX - 12} y={dTop - 6} width={dW + 24} height={7} fill={trim} stroke={INK} strokeWidth={1.5} />
      <Rect x={dX - 10} y={dTop + 1} width={8} height={landing - dTop - 1} fill={trim} stroke={INK} strokeWidth={1.2} />
      <Rect x={dX + dW + 2} y={dTop + 1} width={8} height={landing - dTop - 1} fill={trim} stroke={INK} strokeWidth={1.2} />
      <Path d={`M${dX} ${landing} V${dTop + dW / 2} A${dW / 2} ${dW / 2} 0 0 1 ${dX + dW} ${dTop + dW / 2} V${landing} Z`} fill="#2F5A52" stroke={INK} strokeWidth={1.5} />
      <Path d={`M${dX + 3} ${dTop + dW / 2} A${dW / 2 - 3} ${dW / 2 - 3} 0 0 1 ${dX + dW - 3} ${dTop + dW / 2} Z`} fill={lit ? '#FFD23F' : '#BFD0F5'} stroke={INK} strokeWidth={1} />
      <Path d={`M${dX + dW / 2} ${dTop + dW / 2} V${landing}`} stroke={INK} strokeWidth={1.2} />
      <Circle cx={dX + dW / 2} cy={dTop + dW / 2 + (landing - dTop - dW / 2) * 0.32} r={dW * 0.17} fill="none" stroke="#5E8A3A" strokeWidth={5} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const cy = dTop + dW / 2 + (landing - dTop - dW / 2) * 0.32;
        return <Circle key={i} cx={dX + dW / 2 + Math.cos(a) * dW * 0.17} cy={cy + Math.sin(a) * dW * 0.17} r={2.2} fill={i % 2 ? colors.pink : '#E5484D'} />;
      })}
      {/* Pots of flowers on the landing. */}
      {[dX - 4, dX + dW + 4].map((px, i) => (
        <G key={i}>
          <Path d={`M${px - 7} ${landing - 12} L${px + 7} ${landing - 12} L${px + 5} ${landing} L${px - 5} ${landing} Z`} fill="#E07A4A" stroke={INK} strokeWidth={1.2} />
          {[-5, 0, 5].map((dx, j) => <Circle key={j} cx={px + dx} cy={landing - 16 - (j === 1 ? 3 : 0)} r={4} fill={j === 1 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />)}
        </G>
      ))}

      {/* The stoop: steps fanning out down to the sidewalk, a railing and a round newel post. */}
      {Array.from({ length: steps }, (_, i) => {
        const y = landing + stepH * i;
        const spread = 8 + i * 5;
        return <Rect key={i} x={dX - spread} y={y} width={dW + spread * 2} height={stepH} fill={trim} stroke={INK} strokeWidth={1.2} />;
      })}
      <Path d={`M${dX - 14} ${landing - 18} L${dX - 34} ${bottom - 22}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <Path d={`M${dX - 14} ${landing - 18} L${dX - 34} ${bottom - 22}`} stroke={trim} strokeWidth={5} strokeLinecap="round" />
      <Rect x={dX - 44} y={bottom - 30} width={18} height={30} rx={3} fill={trim} stroke={INK} strokeWidth={1.2} />
      <Circle cx={dX - 35} cy={bottom - 34} r={8} fill={trim} stroke={INK} strokeWidth={1.2} />
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
