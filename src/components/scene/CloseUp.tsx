// A close-up scene for a story slide: the animal standing in their setting, drawn wide
// in a riso frame, instead of a round sticker. Pilot: a branch, a sidewalk and water.
// The sky follows the time of day and the leaves follow the season. Things move
// gently (the branch sways, the water ripples) unless the person has asked their phone
// to reduce motion.

import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Mood, Period, Season, Setting } from '@/content/types';
import { border, colors, offsetShadow } from '@/theme/tokens';
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
const SKY: Record<Period, string> = { dawn: '#FFE3EC', midday: '#DDE6FF', dusk: '#FFD3A8', night: '#2E2E44' };
const FAR: Record<Period, string> = { dawn: '#F2C4D4', midday: '#BFD0F5', dusk: '#E8AE86', night: '#3B3A50' };
const LEAVES: Record<Season, string[]> = {
  spring: ['#9BD27A', '#FFB3CB'],
  summer: ['#3FA66B', '#5FC48E'],
  fall: ['#F28C28', '#E5484D', '#FFD23F'],
  winter: [],
};
const WATER = '#8FB3E8';
const BARK = '#8A6247';

type Props = {
  setting: CloseUpSetting;
  speciesId: string;
  mood?: Mood | number;
  width: number;
  height: number;
  period: Period;
  season: Season;
  shadow: string;
};

export function CloseUp({ setting, speciesId, mood, width: w, height: h, period, season, shadow }: Props) {
  const still = useReduceMotion();
  const sway = useLoop(still, 4200);
  const drift = useLoop(still, 6000);

  // Where the animal's feet go, and how big they are.
  const ground = setting === 'branch' ? h * 0.7 : setting === 'water' ? h * 0.72 : h * 0.84;
  const size = setting === 'water' ? h * 0.78 : setting === 'branch' ? h * 0.72 : h * 0.86;
  const top = ground - size * cutoutFeet(speciesId);
  // At a puddle they stand at its edge, beak over the water (everyone faces left).
  const left = setting === 'puddle' ? w * 0.42 - size * 0.12 : w * 0.5 - size * 0.45;
  const animal = (
    <View style={{ position: 'absolute', left, top }}>
      <Character speciesId={speciesId} size={size} mood={mood} cutout />
    </View>
  );

  return (
    <View style={{ width: w, height: h, borderRadius: 24, borderWidth: border.width, borderColor: INK, overflow: 'hidden', backgroundColor: SKY[period], boxShadow: offsetShadow(shadow, 5) }}>
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {period === 'night' && [0.12, 0.3, 0.55, 0.78, 0.9].map((x, i) => <Circle key={i} cx={w * x} cy={h * (0.1 + (i % 3) * 0.08)} r={1.6} fill={colors.paper} />)}
        {setting === 'sidewalk' || setting === 'puddle' ? <Wall w={w} h={h} period={period} /> : <Distance w={w} h={h} period={period} season={season} water={setting === 'water'} />}
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
            transformOrigin: 'left center',
            transform: [{ rotate: sway.interpolate({ inputRange: [0, 1], outputRange: ['-0.8deg', '0.8deg'] }) }],
          }}
        >
          <Svg width={w} height={h} style={{ position: 'absolute' }}>
            <Branch w={w} h={h} y={ground} season={season} />
          </Svg>
          {animal}
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <FrontLeaves w={w} h={h} y={ground} season={season} />
          </Svg>
        </Animated.View>
      ) : setting === 'water' ? (
        <>
          {/* Ripples drift across the whole pond, behind and in front of the swimmer. */}
          <Ripples w={w} h={h} from={h * 0.5} to={ground} drift={drift} />
          {animal}
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <Rect x={0} y={ground} width={w} height={h - ground} fill={WATER} />
          </Svg>
          <Ripples w={w} h={h} from={ground} to={h} drift={drift} />
        </>
      ) : setting === 'puddle' ? (
        <>
          <Svg width={w} height={h} style={{ position: 'absolute' }}>
            <Sidewalk w={w} h={h} y={ground} />
            <Ellipse cx={w * 0.3} cy={ground + h * 0.03} rx={w * 0.2} ry={h * 0.055} fill={WATER} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${w * 0.2} ${ground + h * 0.02} q${w * 0.04} -4 ${w * 0.08} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </Svg>
          {animal}
        </>
      ) : (
        <>
          <Svg width={w} height={h} style={{ position: 'absolute' }}>
            <Sidewalk w={w} h={h} y={ground} />
          </Svg>
          {animal}
        </>
      )}
    </View>
  );
}

/** Ripple marks drifting sideways across a band of water. */
function Ripples({ w, h, from, to, drift }: { w: number; h: number; from: number; to: number; drift: Animated.Value }) {
  const band = to - from;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -w * 0.2, top: from, transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, w * 0.2] }) }] }}
    >
      <Svg width={w * 1.4} height={band}>
        {[0.06, 0.28, 0.5, 0.72, 0.94, 1.16].map((x, i) => (
          <Path key={i} d={`M${w * x + (i % 2) * w * 0.08} ${band * (i % 2 ? 0.62 : 0.32)} q${w * 0.03} -5 ${w * 0.06} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ))}
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

/** Far-off trees (and a far shore, by the water). */
function Distance({ w, h, period, season, water }: { w: number; h: number; period: Period; season: Season; water: boolean }) {
  const base = water ? h * 0.5 : h * 0.86;
  const leaves = LEAVES[season];
  const blob = leaves[0] ?? FAR[period];
  return (
    <G>
      {[0.08, 0.26, 0.47, 0.7, 0.9].map((x, i) => (
        <Circle key={i} cx={w * x} cy={base - h * (0.08 + (i % 2) * 0.05)} r={h * (0.12 + (i % 3) * 0.03)} fill={period === 'night' ? FAR.night : blob} opacity={0.45} />
      ))}
      {water && (
        <>
          <Rect x={0} y={base} width={w} height={h - base} fill={WATER} />
          <Path d={`M0 ${base} H${w}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
          {[0.06, 0.12, 0.85, 0.92].map((x, i) => (
            <Path key={i} d={`M${w * x} ${base + 2} q${-3} ${-h * 0.12} ${2} ${-h * 0.18}`} stroke="#5E7A5A" strokeWidth={3} fill="none" strokeLinecap="round" />
          ))}
        </>
      )}
    </G>
  );
}

/** A big branch across the frame, from the left, with leaves for the season. */
function Branch({ w, h, y, season }: { w: number; h: number; y: number; season: Season }) {
  const t = h * 0.075;
  const d = `M${-w * 0.05} ${y + t * 0.9} C${w * 0.3} ${y + t * 0.5} ${w * 0.65} ${y + t * 0.6} ${w * 0.92} ${y - t * 0.1}`;
  const twig = `M${w * 0.62} ${y + t * 0.2} C${w * 0.7} ${y - h * 0.1} ${w * 0.78} ${y - h * 0.18} ${w * 0.84} ${y - h * 0.22}`;
  const leaves = LEAVES[season];
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={t * 2 + 3} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={BARK} strokeWidth={t * 2} strokeLinecap="round" fill="none" />
      <Path d={twig} stroke={INK} strokeWidth={t * 0.8 + 3} strokeLinecap="round" fill="none" />
      <Path d={twig} stroke={BARK} strokeWidth={t * 0.8} strokeLinecap="round" fill="none" />
      <Path d={`M${w * 0.05} ${y + t * 0.6} C${w * 0.25} ${y + t * 0.35} ${w * 0.4} ${y + t * 0.4} ${w * 0.5} ${y + t * 0.45}`} stroke="#6E4E38" strokeWidth={2} fill="none" />
      {leaves.length > 0 &&
        [[0.1, -0.09], [0.22, -0.05], [0.8, -0.27], [0.88, -0.2], [0.7, -0.16], [0.94, -0.03]].map(([x, dy], i) => (
          <Ellipse key={i} cx={w * x} cy={y + h * dy} rx={h * 0.07} ry={h * 0.04} transform={`rotate(${i % 2 ? 30 : -25} ${w * x} ${y + h * dy})`} fill={leaves[i % leaves.length]} stroke={INK} strokeWidth={1.5} />
        ))}
    </G>
  );
}

/** A few leaves in front of the branch, so the animal sits in the tree, not on top of it. */
function FrontLeaves({ w, h, y, season }: { w: number; h: number; y: number; season: Season }) {
  const leaves = LEAVES[season];
  if (leaves.length === 0) return null;
  return (
    <G>
      {[[0.3, 0.06], [0.36, 0.1]].map(([x, dy], i) => (
        <Ellipse key={i} cx={w * x} cy={y + h * dy} rx={h * 0.06} ry={h * 0.035} transform={`rotate(${i ? 25 : -20} ${w * x} ${y + h * dy})`} fill={leaves[(i + 1) % leaves.length]} stroke={INK} strokeWidth={1.5} />
      ))}
    </G>
  );
}

/** A brick wall behind the sidewalk, with a window. */
function Wall({ w, h, period }: { w: number; h: number; period: Period }) {
  const brick = period === 'night' ? '#6E4A4A' : '#E8B9A2';
  const line = period === 'night' ? '#5A3C3C' : '#D49A80';
  const rows = Array.from({ length: 9 }, (_, i) => i);
  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill={brick} />
      {rows.map((r) => (
        <G key={r}>
          <Path d={`M0 ${h * 0.09 * (r + 1)} H${w}`} stroke={line} strokeWidth={1.5} />
          {Array.from({ length: 8 }, (_, c) => (
            <Path key={c} d={`M${w * (c / 7) + (r % 2 ? w / 14 : 0)} ${h * 0.09 * r} V${h * 0.09 * (r + 1)}`} stroke={line} strokeWidth={1.5} />
          ))}
        </G>
      ))}
      <Rect x={w * 0.66} y={h * 0.12} width={w * 0.22} height={h * 0.34} rx={4} fill={period === 'night' ? '#FFD23F' : '#BFD0F5'} stroke={INK} strokeWidth={1.5} />
      <Path d={`M${w * 0.77} ${h * 0.12} V${h * 0.46} M${w * 0.66} ${h * 0.29} H${w * 0.88}`} stroke={INK} strokeWidth={1.5} />
      <Rect x={w * 0.64} y={h * 0.46} width={w * 0.26} height={h * 0.05} fill="#C9C1B4" stroke={INK} strokeWidth={1.5} />
    </G>
  );
}

/** The sidewalk: pavement slabs and a curb. */
function Sidewalk({ w, h, y }: { w: number; h: number; y: number }) {
  const top = y - h * 0.1;
  return (
    <G>
      <Rect x={0} y={top} width={w} height={h - top} fill="#DAD7E0" />
      <Path d={`M0 ${top} H${w}`} stroke={INK} strokeWidth={1.5} />
      {[0.18, 0.44, 0.7, 0.96].map((x, i) => (
        <Path key={i} d={`M${w * x} ${top} L${w * (x - 0.06)} ${h}`} stroke="#B9B6C4" strokeWidth={2} />
      ))}
      <Rect x={0} y={h * 0.95} width={w} height={h * 0.05} fill="#A9A7BA" />
      <Path d={`M0 ${h * 0.95} H${w}`} stroke={INK} strokeWidth={1.5} />
    </G>
  );
}
