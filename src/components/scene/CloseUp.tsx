// A close-up scene for a story slide, drawn to fill the whole screen: the animal standing
// in their setting, instead of a round sticker over the wide neighborhood scene.
// Pilot: a branch, a sidewalk (with a puddle, for walkers at the water) and a pond.
//
// The screen is built around the `band` where the sticker would sit: sky above it (in the
// time of day's color, so the pills and time stay readable), the animal in it, and the
// ground carrying on below, under the story card. Leaves follow the season. Things move
// gently (the branch sways, the water ripples) unless the person has asked their phone
// to reduce motion.

import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Mood, Period, Season, Setting } from '@/content/types';
import { colors } from '@/theme/tokens';
import { useReduceMotion } from '../backdrop/motion';
import { Character, cutoutFeet, hasCutout } from '../characters/Character';

export type CloseUpSetting = 'branch' | 'sidewalk' | 'water' | 'puddle';
const SETTINGS: Setting[] = ['branch', 'sidewalk', 'water'];
/** Who swims. Everyone else "at the water" is at a puddle on the sidewalk, drinking or bathing. */
const SWIMMERS = ['mallard'];

/** The close-up for this slide, if the pilot covers both the animal and the setting. */
export function closeUpFor(speciesId: string | undefined, setting: Setting | undefined): CloseUpSetting | undefined {
  if (!hasCutout(speciesId) || !setting || !SETTINGS.includes(setting)) return undefined;
  if (setting === 'water') return SWIMMERS.includes(speciesId) ? 'water' : 'puddle';
  return setting as CloseUpSetting;
}

const INK = colors.ink;
const LEAVES: Record<Season, string[]> = {
  spring: ['#9BD27A', '#FFB3CB'],
  summer: ['#3FA66B', '#5FC48E'],
  fall: ['#F28C28', '#E5484D', '#FFD23F'],
  winter: [],
};
const WATER: Record<Period, string> = { dawn: '#9DB9F2', midday: '#8FB3E8', dusk: '#6F8FE0', night: '#3E4A78' };
const BARK = '#8A6247';
const BRICK: Record<Period, [string, string]> = { dawn: ['#F0C2AE', '#DCA48C'], midday: ['#E8B9A2', '#D49A80'], dusk: ['#C98E86', '#B07870'], night: ['#6E4A4A', '#5A3C3C'] };
const PAVEMENT: Record<Period, string> = { dawn: '#E6E1EA', midday: '#DAD7E0', dusk: '#B9B6C8', night: '#55546A' };
const FAR: Record<Period, string> = { dawn: '#F2C4D4', midday: '#F2DFA0', dusk: '#4A6FE0', night: '#3B3A50' };

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
};

export function CloseUp({ setting, speciesId, mood, width: w, height: h, band, period, season, sky }: Props) {
  const still = useReduceMotion();
  const sway = useLoop(still, 4200);
  const drift = useLoop(still, 6000);
  const bt = band.top;
  const bh = band.height;

  // Where the animal's feet go, and how big they are.
  const ground = setting === 'branch' ? bt + bh * 0.8 : setting === 'water' ? bt + bh * 0.82 : bt + bh * 0.94;
  const size = setting === 'water' ? bh * 0.9 : setting === 'branch' ? bh * 0.86 : bh * 1.0;
  const top = ground - size * cutoutFeet(speciesId);
  // At a puddle they stand at its edge, beak over the water (everyone faces left).
  const left = setting === 'puddle' ? w * 0.4 - size * 0.12 : w * 0.5 - size * 0.45;
  const animal = (
    <View style={{ position: 'absolute', left, top }}>
      <Character speciesId={speciesId} size={size} mood={mood} cutout />
    </View>
  );
  const horizon = bt + bh * 0.5; // the far shore, by the pond
  const pavement = ground - bh * 0.08; // where the sidewalk starts

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: sky }}>
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {period === 'night' && [0.1, 0.27, 0.5, 0.68, 0.86, 0.94].map((x, i) => <Circle key={i} cx={w * x} cy={bt * (0.25 + (i % 3) * 0.25)} r={1.8} fill={colors.paper} />)}
        {setting === 'sidewalk' || setting === 'puddle' ? (
          <>
            {/* The wall starts just below the header, so the time and weather stay on sky. */}
            <Wall w={w} top={bt} bottom={pavement} band={band} period={period} />
            <Sidewalk w={w} h={h} top={pavement} period={period} />
          </>
        ) : setting === 'water' ? (
          <Pond w={w} h={h} horizon={horizon} period={period} season={season} />
        ) : (
          <Treeline w={w} h={h} base={ground + bh * 0.9} period={period} season={season} />
        )}
        {setting === 'puddle' && (
          <>
            <Ellipse cx={w * 0.28} cy={ground + bh * 0.03} rx={w * 0.22} ry={bh * 0.06} fill={WATER[period]} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${w * 0.17} ${ground + bh * 0.02} q${w * 0.04} -4 ${w * 0.08} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
        )}
      </Svg>

      {setting === 'branch' ? (
        // The branch and whoever's on it sway together, pivoting near the trunk.
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: w,
            height: h,
            transformOrigin: `0px ${ground}px`,
            transform: [{ rotate: sway.interpolate({ inputRange: [0, 1], outputRange: ['-0.7deg', '0.7deg'] }) }],
          }}
        >
          <Svg width={w} height={h} style={{ position: 'absolute' }}>
            <Branch w={w} y={ground} bh={bh} season={season} />
          </Svg>
          {animal}
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <FrontLeaves w={w} y={ground} bh={bh} season={season} />
          </Svg>
        </Animated.View>
      ) : setting === 'water' ? (
        <>
          {/* Ripples drift across the whole pond, behind and in front of the swimmer. */}
          <Ripples w={w} from={horizon} to={ground} drift={drift} />
          {animal}
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <Rect x={0} y={ground} width={w} height={h - ground} fill={WATER[period]} />
          </Svg>
          <Ripples w={w} from={ground} to={h} drift={drift} />
        </>
      ) : (
        animal
      )}
    </View>
  );
}

/** Ripple marks drifting sideways across a band of water. */
function Ripples({ w, from, to, drift }: { w: number; from: number; to: number; drift: Animated.Value }) {
  const band = to - from;
  const rows = Math.max(1, Math.round(band / 70));
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -w * 0.2, top: from, transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, w * 0.2] }) }] }}
    >
      <Svg width={w * 1.4} height={band}>
        {Array.from({ length: rows }, (_, r) =>
          [0.06, 0.32, 0.58, 0.84, 1.1].map((x, i) => (
            <Path
              key={`${r}:${i}`}
              d={`M${w * x + ((r + i) % 2) * w * 0.1} ${band * ((r + 0.4 + (i % 2) * 0.3) / rows)} q${w * 0.03} -5 ${w * 0.06} 0`}
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

/** A value that eases 0 → 1 → 0 forever (or sits at 0.5, holding still). */
function useLoop(still: boolean, duration: number) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (still) return;
    const half = { duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(Animated.sequence([Animated.timing(v, { ...half, toValue: 1 }), Animated.timing(v, { ...half, toValue: 0 })]));
    loop.start();
    return () => loop.stop();
  }, [still, duration, v]);
  return v;
}

/** Soft far-off trees along the bottom, below the branch. */
function Treeline({ w, h, base, period, season }: { w: number; h: number; base: number; period: Period; season: Season }) {
  const fill = period === 'night' || period === 'dusk' ? FAR[period] : LEAVES[season][0] ?? FAR[period];
  return (
    <G opacity={0.5}>
      {[0.05, 0.22, 0.4, 0.6, 0.78, 0.95].map((x, i) => (
        <Circle key={i} cx={w * x} cy={base - (i % 2) * 30} r={70 + (i % 3) * 22} fill={fill} />
      ))}
      <Rect x={0} y={base} width={w} height={Math.max(0, h - base)} fill={fill} />
    </G>
  );
}

/** A pond: far trees and reeds on the far shore, water to the bottom of the screen. */
function Pond({ w, h, horizon, period, season }: { w: number; h: number; horizon: number; period: Period; season: Season }) {
  const tree = period === 'night' || period === 'dusk' ? FAR[period] : LEAVES[season][0] ?? FAR[period];
  return (
    <G>
      {[0.06, 0.24, 0.44, 0.66, 0.86].map((x, i) => (
        <Circle key={i} cx={w * x} cy={horizon - 18 - (i % 2) * 14} r={44 + (i % 3) * 14} fill={tree} opacity={0.5} />
      ))}
      <Rect x={0} y={horizon} width={w} height={h - horizon} fill={WATER[period]} />
      <Path d={`M0 ${horizon} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
      {[0.05, 0.1, 0.88, 0.94].map((x, i) => (
        <Path key={i} d={`M${w * x} ${horizon + 2} q-3 -38 3 -60`} stroke="#5E7A5A" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
    </G>
  );
}

/** A big branch across the screen from the left, with leaves for the season. */
function Branch({ w, y, bh, season }: { w: number; y: number; bh: number; season: Season }) {
  const t = bh * 0.07;
  const d = `M${-w * 0.05} ${y + t * 0.9} C${w * 0.3} ${y + t * 0.5} ${w * 0.65} ${y + t * 0.6} ${w * 1.05} ${y - t * 0.3}`;
  const twig = `M${w * 0.66} ${y + t * 0.2} C${w * 0.74} ${y - bh * 0.12} ${w * 0.82} ${y - bh * 0.22} ${w * 0.9} ${y - bh * 0.28}`;
  const leaves = LEAVES[season];
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={t * 2 + 3} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={BARK} strokeWidth={t * 2} strokeLinecap="round" fill="none" />
      <Path d={twig} stroke={INK} strokeWidth={t * 0.8 + 3} strokeLinecap="round" fill="none" />
      <Path d={twig} stroke={BARK} strokeWidth={t * 0.8} strokeLinecap="round" fill="none" />
      <Path d={`M${w * 0.05} ${y + t * 0.6} C${w * 0.25} ${y + t * 0.35} ${w * 0.4} ${y + t * 0.4} ${w * 0.5} ${y + t * 0.45}`} stroke="#6E4E38" strokeWidth={2} fill="none" />
      {leaves.length > 0 &&
        [[0.08, -0.1], [0.2, -0.06], [0.84, -0.33], [0.92, -0.25], [0.74, -0.2], [0.97, -0.06]].map(([x, dy], i) => (
          <Ellipse key={i} cx={w * x} cy={y + bh * dy} rx={bh * 0.075} ry={bh * 0.042} transform={`rotate(${i % 2 ? 30 : -25} ${w * x} ${y + bh * dy})`} fill={leaves[i % leaves.length]} stroke={INK} strokeWidth={1.5} />
        ))}
    </G>
  );
}

/** A few leaves in front of the branch, so the animal sits in the tree, not on top of it. */
function FrontLeaves({ w, y, bh, season }: { w: number; y: number; bh: number; season: Season }) {
  const leaves = LEAVES[season];
  if (leaves.length === 0) return null;
  return (
    <G>
      {[[0.28, 0.06], [0.34, 0.1]].map(([x, dy], i) => (
        <Ellipse key={i} cx={w * x} cy={y + bh * dy} rx={bh * 0.065} ry={bh * 0.037} transform={`rotate(${i ? 25 : -20} ${w * x} ${y + bh * dy})`} fill={leaves[(i + 1) % leaves.length]} stroke={INK} strokeWidth={1.5} />
      ))}
    </G>
  );
}

/** A brick wall from `top` to `bottom`, with a window beside the animal. */
function Wall({ w, top, bottom, band, period }: { w: number; top: number; bottom: number; band: { top: number; height: number }; period: Period }) {
  const [brick, line] = BRICK[period];
  const row = 26;
  const rows = Math.ceil((bottom - top) / row);
  const lit = period === 'dusk' || period === 'night';
  const winTop = band.top + band.height * 0.08;
  const winH = band.height * 0.42;
  return (
    <G>
      <Rect x={0} y={top} width={w} height={bottom - top} fill={brick} />
      <Path d={`M0 ${top} H${w}`} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: rows }, (_, r) => (
        <G key={r}>
          <Path d={`M0 ${top + row * (r + 1)} H${w}`} stroke={line} strokeWidth={1.5} />
          {Array.from({ length: 9 }, (_, c) => (
            <Path key={c} d={`M${(w / 8) * c + (r % 2 ? w / 16 : 0)} ${top + row * r} V${top + row * (r + 1)}`} stroke={line} strokeWidth={1.5} />
          ))}
        </G>
      ))}
      <Rect x={w * 0.68} y={winTop} width={w * 0.24} height={winH} rx={4} fill={lit ? '#FFD23F' : '#BFD0F5'} stroke={INK} strokeWidth={1.5} />
      <Path d={`M${w * 0.8} ${winTop} V${winTop + winH} M${w * 0.68} ${winTop + winH / 2} H${w * 0.92}`} stroke={INK} strokeWidth={1.5} />
      <Rect x={w * 0.66} y={winTop + winH} width={w * 0.28} height={10} fill="#C9C1B4" stroke={INK} strokeWidth={1.5} />
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
