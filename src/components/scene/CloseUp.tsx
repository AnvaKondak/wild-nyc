// A close-up scene for a story slide, drawn to fill the whole screen: the animal standing
// in their setting, instead of a round sticker over the wide neighborhood scene.
// Pilot: a branch, a sidewalk (with a puddle, for walkers at the water) and a pond.
//
// The screen is built around the `band` where the sticker would sit: sky above it (in the
// time of day's color, so the pills and time stay readable, with the sun, moon, clouds,
// rain or snow the weather calls for), the animal in it, and the ground carrying on below,
// under the story card. Leaves follow the season.
//
// Motion is gentle and never visibly restarts: leaves flutter on smooth back-and-forth
// cycles, and ripples, rain and snow move one way on loops that line up seamlessly. The
// branch and the animal on it hold still. Reduce Motion stops it all.

import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Mood, Period, Season, Setting } from '@/content/types';
import type { Sky } from '@/lib/weather';
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
  spring: ['#9BD27A', '#7FBF5A', '#FFB3CB'],
  summer: ['#3FA66B', '#5FC48E', '#2F8F5A'],
  fall: ['#F28C28', '#E5484D', '#FFD23F', '#E8A23C'],
  winter: [],
};
const WATER: Record<Period, string> = { dawn: '#9DB9F2', midday: '#8FB3E8', dusk: '#6F8FE0', night: '#3E4A78' };
const BARK = '#8A6247';
// Brownstone: warm chocolate-brown sandstone, in big smooth blocks.
const BRICK: Record<Period, [string, string]> = { dawn: ['#A8705A', '#93604C'], midday: ['#9C664F', '#875744'], dusk: ['#7E5248', '#6C463E'], night: ['#4E3634', '#402C2A'] };
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
  /** What the sky is doing, for the sun, moon, clouds, rain or snow. */
  weather?: Sky;
};

export function CloseUp({ setting, speciesId, mood, width: w, height: h, band, period, season, sky, weather }: Props) {
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
  const leaves = LEAVES[season];

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: sky }}>
      {/* Up close to a brownstone there's no open sky: no sun, moon or clouds. Rain and snow still fall. */}
      {setting !== 'sidewalk' && setting !== 'puddle' && <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} behind />}
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        {setting === 'sidewalk' || setting === 'puddle' ? (
          <>
            {/* The wall starts just below the header, so the time and weather stay on sky. */}
            <Wall w={w} top={bt} bottom={pavement} band={band} period={period} />
            <Cornice w={w} y={bt} period={period} />
            <WallBranch y={bt} bh={bh} w={w} />
            <Sidewalk w={w} h={h} top={pavement} period={period} />
          </>
        ) : setting === 'water' ? (
          <Pond w={w} h={h} horizon={horizon} period={period} season={season} />
        ) : (
          <>
            <Treeline w={w} h={h} base={ground + bh * 0.9} period={period} season={season} />
            <Branch w={w} y={ground} bh={bh} />
          </>
        )}
        {setting === 'puddle' && (
          <>
            <Ellipse cx={w * 0.28} cy={ground + bh * 0.03} rx={w * 0.22} ry={bh * 0.06} fill={WATER[period]} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${w * 0.17} ${ground + bh * 0.02} q${w * 0.04} -4 ${w * 0.08} 0`} stroke={colors.paper} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
        )}
      </Svg>

      {(setting === 'sidewalk' || setting === 'puddle') && leaves.length > 0 && WALL_LEAVES.map((l, i) => <Leaf key={`w${i}`} {...l} w={w} y={bt} bh={bh} color={leaves[i % leaves.length]} />)}
      {setting === 'branch' && leaves.length > 0 && BACK_LEAVES.map((l, i) => <Leaf key={i} {...l} w={w} y={ground} bh={bh} color={leaves[i % leaves.length]} />)}
      {setting === 'water' && <Ripples w={w} from={horizon} to={ground} />}
      {animal}
      {setting === 'water' && (
        <>
          <Svg width={w} height={h} style={{ position: 'absolute' }} pointerEvents="none">
            <Rect x={0} y={ground} width={w} height={h - ground} fill={WATER[period]} />
          </Svg>
          <Ripples w={w} from={ground} to={h} />
        </>
      )}
      {setting === 'branch' && leaves.length > 0 && FRONT_LEAVES.map((l, i) => <Leaf key={i} {...l} w={w} y={ground} bh={bh} color={leaves[(i + 1) % leaves.length]} />)}
      <SkyWeather w={w} h={h} bt={bt} bh={bh} period={period} weather={weather} />
    </View>
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

/** A brownstone front from `top` to `bottom`: big smooth stone blocks, with a window beside the animal. */
function Wall({ w, top, bottom, band, period }: { w: number; top: number; bottom: number; band: { top: number; height: number }; period: Period }) {
  const [brick, line] = BRICK[period];
  const row = 34;
  const rows = Math.ceil((bottom - top) / row);
  const lit = period === 'dusk' || period === 'night';
  // A cute arched window, well below the cornice, with curtains and a flower box.
  const winW = w * 0.17;
  const winX = w * 0.63;
  const winTop = band.top + band.height * 0.14;
  const winH = band.height * 0.42;
  return (
    <G>
      <Rect x={0} y={top} width={w} height={bottom - top} fill={brick} />
      <Path d={`M0 ${top} H${w}`} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: rows }, (_, r) => (
        <G key={r}>
          <Path d={`M0 ${top + row * (r + 1)} H${w}`} stroke={line} strokeWidth={1.5} />
          {Array.from({ length: 4 }, (_, c) => (
            <Path key={c} d={`M${(w / 3) * c + (r % 2 ? w / 6 : 0)} ${top + row * r} V${top + row * (r + 1)}`} stroke={line} strokeWidth={1.5} />
          ))}
        </G>
      ))}
      <G>
        <Path d={`M${winX} ${winTop + winH} V${winTop + winW / 2} A${winW / 2} ${winW / 2} 0 0 1 ${winX + winW} ${winTop + winW / 2} V${winTop + winH} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
        <Path d={`M${winX + 5} ${winTop + winH} V${winTop + winW / 2} A${winW / 2 - 5} ${winW / 2 - 5} 0 0 1 ${winX + winW - 5} ${winTop + winW / 2} V${winTop + winH} Z`} fill={lit ? '#FFD23F' : '#BFD0F5'} />
        {/* Little curtains, tied back. */}
        <Path d={`M${winX + 5} ${winTop + winW / 2 - 4} Q${winX + winW * 0.28} ${winTop + winH * 0.5} ${winX + 5} ${winTop + winH - 6} Z`} fill={colors.pinkTint} stroke={INK} strokeWidth={1} />
        <Path d={`M${winX + winW - 5} ${winTop + winW / 2 - 4} Q${winX + winW * 0.72} ${winTop + winH * 0.5} ${winX + winW - 5} ${winTop + winH - 6} Z`} fill={colors.pinkTint} stroke={INK} strokeWidth={1} />
        <Path d={`M${winX + winW / 2} ${winTop + 5} V${winTop + winH}`} stroke={INK} strokeWidth={1.2} />
        {/* A flower box on the sill, flowers poking up out of it. */}
        {[0.15, 0.35, 0.55, 0.75, 0.92].map((f, i) => (
          <G key={i}>
            <Path d={`M${winX + winW * f} ${winTop + winH + 6} V${winTop + winH - 4}`} stroke="#3E8E4E" strokeWidth={2} />
            <Circle cx={winX + winW * f} cy={winTop + winH - 6} r={4.5} fill={i % 2 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />
          </G>
        ))}
        <Rect x={winX - 5} y={winTop + winH + 2} width={winW + 10} height={13} rx={3} fill="#9A6A44" stroke={INK} strokeWidth={1.2} />
      </G>
    </G>
  );
}

/** A stone cornice along the top of the wall: a cap, a band and a soft shadow under it, with a few chunky brackets. */
function Cornice({ w, y, period }: { w: number; y: number; period: Period }) {
  const stone = period === 'night' ? '#6E6A80' : period === 'dusk' ? '#B3ABA0' : '#E3DACB';
  const shade = period === 'night' ? '#55546A' : period === 'dusk' ? '#9A9086' : '#C2B6A3';
  const brackets = Math.max(4, Math.round(w / 70));
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
