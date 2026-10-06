// PLACEHOLDER ART. Builds the layers of a story backdrop, back to front:
//   time-of-day sky → clouds (far, near) → life in the sky → the neighborhood on the
//   horizon → the moment's setting → seasonal particles → the weather.
// Positions are fractions of the screen and sizes scale with its shorter side, so it
// fits a phone and a wide browser. `variant` (0–2, seeded per slide) picks different
// details, so two slides with the same setting don't look identical.

import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import { Landmark } from '@/components/scenes/Landmark';
import type { Period, PlaceKind, Season, Setting } from '@/content/types';
import { seededRandom } from '@/lib/random';
import type { Sky, WeatherTag } from '@/lib/weather';
import type { Layer } from './motion';
import { HIDDEN_WHEN_GRAY, isGray, replacesSeasonParticles, weatherLayers } from './weather';

const INK = inks.ink;

export type BackdropInput = {
  w: number;
  h: number;
  setting: Setting;
  period: Period;
  season: Season;
  placeKind: PlaceKind;
  placeId?: string;
  variant: number;
  /** 0 = new moon … 1 = full. */
  moonLit: number;
  /** Where the story's text ends (pt from the top). The horizon stays below it. */
  textBottom?: number;
  /** The weather right now. Unknown: the season's usual look (snow in winter, and so on). */
  sky?: Sky;
  weather?: WeatherTag[];
};

type Ctx = BackdropInput & { u: number; rnd: () => number; horizon: number; landmarkRoom: number };

/**
 * The horizon (landmark, harbor, city lights) sits just above the story's button, below
 * the text. Sky things stay below the time header: SKY_TOP is the highest they go.
 */
const BUTTON_ZONE = 96; // pt from the bottom: the "Meet the…" button and its padding
const LANDMARK_MAX = 50; // pt: keeps the landmark in the gap under the text
const SKY_TOP = 0.28;

export function buildLayers(input: BackdropInput): Layer[] {
  const u = Math.min(input.w, input.h) / 100;
  // The horizon sits just above the button, but never above the end of the text; the
  // landmark only gets the room between the two (and is left out if there isn't any).
  const textBottom = input.textBottom ?? input.h * 0.7;
  const horizonY = Math.max(input.h - BUTTON_ZONE, textBottom + 14);
  const c: Ctx = {
    ...input,
    u,
    rnd: seededRandom(`${input.setting}:${input.variant}:${input.season}`),
    horizon: horizonY,
    landmarkRoom: Math.min(LANDMARK_MAX, horizonY - textBottom - 6),
  };
  const isDay = c.period !== 'night';
  const { sky, weather = [] } = input;
  // Known weather decides the particles: no winter snow on a clear day, rain instead of petals.
  const particles = sky === undefined ? seasonParticles(c) : replacesSeasonParticles(sky) ? [] : seasonParticles(c).filter((l) => !l.id.startsWith('snow'));
  return [
    ...timeOfDay(c).filter((l) => !(isGray(sky) && HIDDEN_WHEN_GRAY.test(l.id))),
    ...(isDay ? clouds(c) : []),
    ...(isDay ? flock(c) : []),
    ...horizon(c),
    ...settingLayers(c),
    ...particles,
    ...weatherLayers(c, sky, weather),
  ];
}

// ---------------------------------------------------------------- time of day

function timeOfDay(c: Ctx): Layer[] {
  const { w, h, u, period, variant } = c;
  if (period === 'night') {
    const mx = w * [0.86, 0.14, 0.8][variant];
    const my = h * 0.3;
    const r = 7 * u;
    const stars = (n: number, seed: string) => {
      const rnd = seededRandom(seed);
      return (
        <G>
          {Array.from({ length: n }, (_, i) => {
            const x = rnd() < 0.5 ? rnd() * 0.25 : 0.75 + rnd() * 0.25; // keep to the sides of the photo
            return <Circle key={i} cx={w * x} cy={h * (SKY_TOP + rnd() * 0.36)} r={(0.7 + rnd() * 0.8) * u} fill={inks.yellow} />;
          })}
        </G>
      );
    };
    return [
      { id: 'moon-glow', depth: 0.05, motion: { kind: 'pulse', duration: 5000, min: 0.4 }, node: <Circle cx={mx} cy={my} r={r * 2.2} fill={inks.yellow} opacity={0.18} /> },
      {
        id: 'moon',
        depth: 0.05,
        motion: { kind: 'still' },
        node: <Path d={moonPath(mx, my, r, c.moonLit)} fill={inks.yellow} />,
      },
      { id: 'stars-a', depth: 0.05, motion: { kind: 'pulse', duration: 1900, min: 0.3 }, node: stars(8, 'a' + variant) },
      { id: 'stars-b', depth: 0.05, motion: { kind: 'pulse', duration: 2700, min: 0.2 }, node: stars(7, 'b' + variant) },
      {
        id: 'shooting-star',
        depth: 0.1,
        motion: { kind: 'flash', every: [7000, 11000, 9000][variant], duration: 900, dx: w * 0.35, dy: h * 0.12 },
        node: <Path d={`M${w * 0.06} ${h * SKY_TOP} l${10 * u} ${3.5 * u}`} stroke={inks.yellow} strokeWidth={0.9 * u} strokeLinecap="round" />,
      },
    ];
  }

  if (period === 'midday') {
    const sx = w * [0.86, 0.14, 0.88][variant];
    const sy = h * (SKY_TOP + 0.04);
    const r = 6 * u;
    return [
      {
        id: 'sun-rays',
        depth: 0.05,
        motion: { kind: 'spin', duration: 50000, cx: sx, cy: sy },
        node: (
          <G>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <Path key={i} d={`M${sx + Math.cos(a) * r * 1.4} ${sy + Math.sin(a) * r * 1.4} L${sx + Math.cos(a) * r * 2} ${sy + Math.sin(a) * r * 2}`} stroke={inks.yellow} strokeWidth={0.9 * u} strokeLinecap="round" />;
            })}
          </G>
        ),
      },
      { id: 'sun', depth: 0.05, motion: { kind: 'still' }, node: <Circle cx={sx} cy={sy} r={r} fill={inks.yellow} /> },
    ];
  }

  // Dawn and dusk: flat stripes of colored light on the horizon and a big low sun.
  const warm = period === 'dusk';
  const bands = warm ? [inks.yellow, inks.orange, inks.pink] : [inks.yellowTint, inks.pinkTint, inks.pink];
  const sx = w * [0.25, 0.72, 0.5][variant];
  return [
    {
      id: 'light-bands',
      depth: 0.02,
      motion: { kind: 'still' },
      opacity: warm ? 0.45 : 0.7,
      node: (
        <G>
          {bands.map((color, i) => (
            <Rect key={color} x={0} y={c.horizon - (3 - i) * h * 0.05} width={w} height={h * 0.05} fill={color} />
          ))}
        </G>
      ),
    },
    {
      id: 'low-sun',
      depth: 0.04,
      // Dawn sun creeps up, dusk sun sinks: a very slow bob reads as rising or setting.
      motion: { kind: 'bob', duration: 40000, dx: 0, dy: 2 * u },
      node: <Circle cx={sx} cy={c.horizon - 2 * u} r={11 * u} fill={warm ? inks.orange : inks.yellow} />,
    },
  ];
}

/**
 * The lit part of the moon as one shape: the outer edge is a half circle, the inner
 * edge (the line between day and night on the moon) is a half ellipse whose width
 * depends on how much is lit. Drawn lit on the right.
 */
function moonPath(cx: number, cy: number, r: number, lit: number): string {
  const f = Math.max(0.04, Math.min(1, lit));
  const rx = r * Math.abs(1 - 2 * f);
  const bulge = f > 0.5 ? 0 : 1; // past half, the inner edge bows out the other way
  return `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx} ${r} 0 0 ${bulge} ${cx} ${cy - r} Z`;
}

// ---------------------------------------------------------------- clouds

function cloud(x: number, y: number, r: number, color: string = inks.white) {
  return (
    <G key={`${x}-${y}`}>
      <Circle cx={x} cy={y} r={r} fill={color} />
      <Circle cx={x + r * 1.1} cy={y + r * 0.2} r={r * 0.8} fill={color} />
      <Circle cx={x - r * 1.1} cy={y + r * 0.3} r={r * 0.7} fill={color} />
      <Rect x={x - r * 1.8} y={y + r * 0.3} width={r * 3.6} height={r * 0.7} rx={r * 0.35} fill={color} />
    </G>
  );
}

function streak(x: number, y: number, len: number, u: number) {
  return <Rect key={`s${x}${y}`} x={x} y={y} width={len} height={2.2 * u} rx={1.1 * u} fill={inks.white} />;
}

function clouds(c: Ctx): Layer[] {
  const { w, h, u, variant, period } = c;
  const tint = period === 'dusk' ? inks.pinkTint : inks.white;
  // Three looks: puffy trio, two big billows, long thin streaks.
  const far =
    variant === 2 ? (
      <G>{streak(w * 0.05, h * 0.3, w * 0.3, u)}{streak(w * 0.55, h * 0.36, w * 0.35, u)}{streak(w * 0.25, h * 0.5, w * 0.25, u)}</G>
    ) : (
      <G>{cloud(w * 0.2, h * 0.31, 3.5 * u, tint)}{cloud(w * 0.7, h * 0.37, 3 * u, tint)}</G>
    );
  const near =
    variant === 1 ? (
      <G>{cloud(w * 0.12, h * 0.38, 9 * u, tint)}{cloud(w * 0.78, h * 0.5, 7.5 * u, tint)}</G>
    ) : variant === 2 ? (
      <G>{cloud(w * 0.6, h * 0.42, 5 * u, tint)}</G>
    ) : (
      <G>{cloud(w * 0.1, h * 0.33, 6.5 * u, tint)}{cloud(w * 0.5, h * 0.3, 4.2 * u, tint)}{cloud(w * 0.82, h * 0.46, 5.5 * u, tint)}</G>
    );
  return [
    { id: 'clouds-far', depth: 0.15, opacity: 0.7, motion: { kind: 'travelX', duration: [120000, 140000, 100000][variant] }, node: far },
    { id: 'clouds-near', depth: 0.4, motion: { kind: 'travelX', duration: [70000, 80000, 60000][variant] }, node: near },
  ];
}

// ---------------------------------------------------------------- life in the sky

function bird(x: number, y: number, s: number, u: number) {
  return <Path key={`b${x}${y}`} d={`M${x - 2 * s * u} ${y} q${s * u} ${-1.2 * s * u} ${2 * s * u} 0 q${s * u} ${-1.2 * s * u} ${2 * s * u} 0`} stroke={INK} strokeWidth={0.5 * u} fill="none" strokeLinecap="round" />;
}

function flock(c: Ctx): Layer[] {
  const { w, h, u, variant, placeKind } = c;
  const y = h * [0.33, 0.3, 0.36][variant]; // below the header; passes behind the photo
  if (placeKind === 'waterfront' && variant !== 1) {
    // A V of geese.
    const birds = Array.from({ length: 7 }, (_, i) => {
      const k = i - 3;
      return bird(w * 0.3 - Math.abs(k) * 4 * u, y + Math.abs(k) * 2.2 * u + (k < 0 ? 0 : 0.5 * u), 1.4, u);
    });
    return [{ id: 'geese', depth: 0.3, opacity: 0.8, motion: { kind: 'travelX', duration: 45000 }, node: <G>{birds}</G> }];
  }
  const count = [5, 3, 8][variant];
  const size = [0.9, 1.6, 0.7][variant];
  const rnd = seededRandom(`flock${variant}`);
  const birds = Array.from({ length: count }, () => bird(w * (0.2 + rnd() * 0.15), y + rnd() * 5 * u, size, u));
  return [{ id: 'flock', depth: 0.3, opacity: 0.75, motion: { kind: 'travelX', duration: [30000, 42000, 26000][variant] }, node: <G>{birds}</G> }];
}

// ---------------------------------------------------------------- the neighborhood

function horizon(c: Ctx): Layer[] {
  const { w, h, u, placeId, placeKind, period } = c;
  const out: Layer[] = [];
  const dark = period === 'dusk' || period === 'night';

  // The neighborhood's landmark, faint, standing on the horizon.
  const s = Math.min(w / 358, c.landmarkRoom / 100);
  const x0 = (w - 358 * s) / 2;
  if (c.landmarkRoom >= 18) out.push({
    id: 'landmark',
    depth: 0.1,
    opacity: dark ? 0.5 : 0.4,
    motion: { kind: 'still' },
    node: (
      <G transform={`translate(${x0} ${c.horizon - 100 * s}) scale(${s})`}>
        <Landmark placeId={placeId} horizon={100} />
      </G>
    ),
  });

  if (placeKind === 'waterfront') {
    const top = c.horizon - 4 * u;
    out.push({ id: 'harbor', depth: 0.15, motion: { kind: 'still' }, opacity: 0.8, node: <Rect x={0} y={top} width={w} height={c.horizon - top + 1} fill={inks.blue} opacity={0.5} /> });
    const rnd = seededRandom('sparkle');
    out.push({
      id: 'sparkles',
      depth: 0.15,
      motion: { kind: 'pulse', duration: 1600, min: 0 },
      node: <G>{Array.from({ length: 9 }, (_, i) => <Rect key={i} x={w * rnd()} y={top + rnd() * 3 * u} width={2.2 * u} height={0.5 * u} fill={inks.white} />)}</G>,
    });
    out.push({ id: 'boat', depth: 0.2, motion: { kind: 'travelX', duration: 90000 }, node: boat(c, top) });
  } else if (dark) {
    // A low row of buildings whose windows light up one by one.
    const rnd = seededRandom(`city${c.variant}`);
    const buildings: { x: number; bw: number; bh: number }[] = [];
    for (let x = 0; x < w; ) {
      const bw = (8 + rnd() * 10) * u;
      buildings.push({ x, bw, bh: (5 + rnd() * 9) * u });
      x += bw + rnd() * 3 * u;
    }
    out.push({
      id: 'buildings',
      depth: 0.15,
      opacity: 0.55,
      motion: { kind: 'still' },
      node: <G>{buildings.map((b) => <Rect key={b.x} x={b.x} y={c.horizon - b.bh} width={b.bw} height={b.bh} fill={INK} />)}</G>,
    });
    const windows = (seed: string) => {
      const r = seededRandom(seed);
      return (
        <G>
          {buildings.flatMap((b) =>
            Array.from({ length: Math.floor(b.bw / (3 * u)) * Math.floor(b.bh / (3.5 * u)) }, (_, i) => {
              if (r() < 0.6) return null;
              const cols = Math.floor(b.bw / (3 * u));
              return <Rect key={`${b.x}-${i}`} x={b.x + u + (i % cols) * 3 * u} y={c.horizon - b.bh + u + Math.floor(i / cols) * 3.5 * u} width={1.4 * u} height={1.8 * u} fill={inks.yellow} />;
            }),
          )}
        </G>
      );
    };
    out.push({ id: 'windows-a', depth: 0.15, motion: { kind: 'pulse', duration: 6000, min: 0.25 }, node: windows('wa') });
    out.push({ id: 'windows-b', depth: 0.15, motion: { kind: 'pulse', duration: 8500, min: 0.1 }, node: windows('wb') });
  }
  return out;
}

function boat(c: Ctx, waterTop: number): ReactNode {
  const { w, u, variant } = c;
  const x = w * 0.2;
  const y = waterTop + u;
  if (variant === 1) {
    // A little sailboat.
    return (
      <G>
        <Path d={`M${x - 5 * u} ${y} L${x + 5 * u} ${y} L${x + 3.5 * u} ${y + 2 * u} L${x - 3.5 * u} ${y + 2 * u} Z`} fill={inks.white} stroke={INK} strokeWidth={0.4 * u} />
        <Path d={`M${x} ${y} L${x} ${y - 9 * u} L${x + 5 * u} ${y - u} Z`} fill={inks.white} stroke={INK} strokeWidth={0.4 * u} />
      </G>
    );
  }
  // The orange ferry, or a tugboat.
  const color = variant === 0 ? inks.orange : inks.red;
  return (
    <G>
      <Path d={`M${x - 9 * u} ${y} L${x + 9 * u} ${y} L${x + 7 * u} ${y + 2.4 * u} L${x - 7 * u} ${y + 2.4 * u} Z`} fill={color} stroke={INK} strokeWidth={0.4 * u} />
      <Rect x={x - 5 * u} y={y - 2.6 * u} width={10 * u} height={2.6 * u} fill={color} stroke={INK} strokeWidth={0.4 * u} />
      <Rect x={x - 2 * u} y={y - 4.4 * u} width={4 * u} height={1.8 * u} fill={inks.white} stroke={INK} strokeWidth={0.4 * u} />
    </G>
  );
}

// ---------------------------------------------------------------- the setting

function ground(c: Ctx, color: string, top = 0.86) {
  const snowy = c.season === 'winter' && (color === inks.green || color === inks.lightGray);
  return (
    <G>
      <Rect x={0} y={c.h * top} width={c.w} height={c.h * (1 - top)} fill={color} />
      {snowy && <Rect x={0} y={c.h * top} width={c.w} height={2 * c.u} fill={inks.white} />}
    </G>
  );
}

function tufts(c: Ctx, top: number) {
  const { w, h, u, variant, season } = c;
  const xs = [0.06, 0.2, 0.36, 0.52, 0.68, 0.84, 0.95];
  return (
    <G>
      {xs.map((x, i) => {
        const bx = w * x;
        const by = h * top;
        if (variant === 1 && i % 2 === 0 && season !== 'winter') {
          // Dandelions (puffs in summer and fall, yellow in spring).
          const puff = season === 'spring' ? inks.yellow : inks.white;
          return (
            <G key={x}>
              <Path d={`M${bx} ${by} L${bx} ${by - 6 * u}`} stroke={inks.green} strokeWidth={0.6 * u} />
              <Circle cx={bx} cy={by - 6.5 * u} r={1.8 * u} fill={puff} stroke={INK} strokeWidth={0.2 * u} />
            </G>
          );
        }
        if (variant === 2 && i % 3 === 1 && season === 'fall') {
          // A little mushroom.
          return (
            <G key={x}>
              <Rect x={bx - 0.6 * u} y={by - 2.6 * u} width={1.2 * u} height={2.6 * u} fill={inks.white} />
              <Path d={`M${bx - 2.4 * u} ${by - 2.4 * u} Q${bx} ${by - 5.5 * u} ${bx + 2.4 * u} ${by - 2.4 * u} Z`} fill={inks.red} />
            </G>
          );
        }
        return <Path key={x} d={`M${bx} ${by} l${-u} ${-3 * u} M${bx + 2 * u} ${by} l${u} ${-3.5 * u}`} stroke={inks.green} strokeWidth={0.8 * u} strokeLinecap="round" />;
      })}
    </G>
  );
}

function wavelets(c: Ctx, rows: number[]) {
  const { w, h, u } = c;
  return (
    <G>
      {rows.map((y, i) => (
        <G key={y}>
          {[0.06, 0.32, 0.58, 0.84].map((x) => (
            <Path key={x} d={`M${w * ((x + i * 0.12) % 1)} ${h * y} q${4 * u} ${-2 * u} ${8 * u} 0 t${8 * u} 0`} stroke={inks.white} strokeWidth={0.8 * u} fill="none" strokeLinecap="round" />
          ))}
        </G>
      ))}
    </G>
  );
}

/** Foliage for the season: blossoms in spring, green in summer, orange in fall, bare + snow in winter. */
function foliageColor(season: Season, variant: number): string {
  if (season === 'spring') return variant === 1 ? inks.pink : inks.green;
  if (season === 'fall') return [inks.orange, inks.red, inks.yellow][variant];
  if (season === 'winter') return inks.white;
  return inks.green;
}

function settingLayers(c: Ctx): Layer[] {
  const { w, h, u, setting, variant, season, period } = c;
  const L = (id: string, node: ReactNode, motion: Layer['motion'] = { kind: 'still' }, depth = 0.6): Layer => ({ id, node, motion, depth });
  const breeze = { kind: 'sway', duration: [3200, 4200, 2600][variant], deg: 3 } as const;
  const bob = (dx: number, dy: number) => ({ kind: 'bob', duration: 2600, dx: dx * u, dy: dy * u }) as const;

  switch (setting) {
    case 'branch': {
      const leaf = foliageColor(season, variant);
      return [
        L('branch', (
          <G>
            <Path d={`M${-w * 0.05} ${h * 0.5} Q${w * 0.35} ${h * 0.42} ${w * 0.7} ${h * 0.47}`} stroke={inks.brown} strokeWidth={5 * u} strokeLinecap="round" fill="none" />
            <Path d={`M${w * 0.45} ${h * 0.45} Q${w * 0.55} ${h * 0.36} ${w * 0.64} ${h * 0.35}`} stroke={inks.brown} strokeWidth={2.5 * u} strokeLinecap="round" fill="none" />
          </G>
        )),
        L('leaves', (
          <G>
            {[[0.66, 0.34, 7], [0.72, 0.44, 6], [0.08, 0.47, 5], [0.28, 0.42, 4], [0.5, 0.4, 3]].map(([x, y, r]) => (
              <Circle key={`${x}${y}`} cx={w * x} cy={h * y} r={r * u} fill={leaf} />
            ))}
            {variant === 2 && season === 'fall' && [[0.3, 0.46], [0.6, 0.47]].map(([x, y]) => <Ellipse key={x} cx={w * x} cy={h * y + 2 * u} rx={1.2 * u} ry={1.6 * u} fill={inks.brown} />)}
          </G>
        ), breeze, 0.7),
      ];
    }
    case 'trunk':
      return [
        L('trunk', (
          <G>
            <Rect x={w * (variant === 1 ? 0 : 0.84)} y={0} width={w * 0.16} height={h} fill={inks.brown} />
            {[0.1, 0.32, 0.55, 0.78].map((y) => (
              <Path key={y} d={`M${w * (variant === 1 ? 0.06 : 0.9)} ${h * y} l0 ${h * 0.08}`} stroke={INK} strokeWidth={0.8 * u} opacity={0.4} strokeLinecap="round" />
            ))}
            {ground(c, inks.green)}
          </G>
        )),
        L('trunk-grass', tufts(c, 0.86), breeze, 0.75),
      ];
    case 'den':
      return [
        L('den', (
          <G>
            <Rect x={0} y={0} width={w * 0.12} height={h} fill={inks.brown} />
            <Rect x={w * 0.88} y={0} width={w * 0.12} height={h} fill={inks.brown} />
            <Ellipse cx={w / 2} cy={h * 0.36} rx={30 * u} ry={26 * u} fill={inks.brown} />
            <Ellipse cx={w / 2} cy={h * 0.37} rx={24 * u} ry={20 * u} fill={INK} opacity={0.6} />
            {season === 'winter' && <Rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill={inks.white} />}
          </G>
        )),
      ];
    case 'wire':
      return [
        L('pole', (
          <G>
            <Rect x={w * 0.92} y={h * 0.3} width={3 * u} height={h * 0.7} fill={inks.brown} />
            <Rect x={w * 0.88} y={h * 0.34} width={10 * u} height={1.6 * u} fill={inks.brown} />
          </G>
        )),
        L('wire', (
          <G>
            <Path d={`M0 ${h * 0.46} Q${w / 2} ${h * 0.52} ${w} ${h * 0.44}`} stroke={INK} strokeWidth={1.2 * u} fill="none" />
            {variant === 1 && <Path d={`M0 ${h * 0.5} Q${w / 2} ${h * 0.56} ${w} ${h * 0.48}`} stroke={INK} strokeWidth={0.8 * u} fill="none" />}
          </G>
        ), bob(0, 1.2), 0.65),
      ];
    case 'ledge':
    case 'rooftop': {
      const facade = [inks.pinkTint, inks.yellowTint, inks.blueTint][variant];
      return [
        L('building', (
          <G>
            <Rect x={0} y={h * 0.5} width={w} height={h * 0.5} fill={facade} />
            <Rect x={0} y={h * 0.49} width={w} height={2.4 * u} fill={setting === 'ledge' ? inks.lightGray : inks.gray} stroke={INK} strokeWidth={0.4 * u} />
            {setting === 'rooftop' && <Rect x={w * 0.78} y={h * 0.4} width={8 * u} height={h * 0.09} fill={inks.red} opacity={0.8} />}
            {setting === 'rooftop' && variant !== 2 && (
              <G>
                <Rect x={w * 0.1} y={h * 0.43} width={10 * u} height={h * 0.06} rx={2 * u} fill={inks.yellowTint} stroke={INK} strokeWidth={0.4 * u} />
                <Path d={`M${w * 0.1 - u} ${h * 0.43} L${w * 0.1 + 5 * u} ${h * 0.4} L${w * 0.1 + 11 * u} ${h * 0.43} Z`} fill={inks.blueTint} stroke={INK} strokeWidth={0.4 * u} />
              </G>
            )}
          </G>
        )),
        // Windows glow at dusk and night; by day they just sit there.
        L('windows', (
          <G>
            {[0.1, 0.3, 0.62, 0.82].map((x) => (
              <Rect key={x} x={w * x} y={h * 0.58} width={9 * u} height={13 * u} fill={period === 'night' || period === 'dusk' ? inks.yellow : inks.blue} opacity={0.5} />
            ))}
          </G>
        ), period === 'night' || period === 'dusk' ? { kind: 'pulse', duration: 7000, min: 0.5 } : { kind: 'still' }),
      ];
    }
    case 'streetlight': {
      const lx = w * 0.15;
      const ly = h * 0.3; // beside the photo, below the header
      const layers: Layer[] = [
        L('lamp-glow', <Circle cx={lx} cy={ly + 2 * u} r={11 * u} fill={inks.yellow} opacity={0.4} />, { kind: 'pulse', duration: 2400, min: 0.55 }, 0.55),
        L('lamp', (
          <G>
            <Path d={`M${w * 0.04} ${h} L${w * 0.04} ${ly - 2 * u} Q${w * 0.04} ${ly - 5 * u} ${lx} ${ly - 4 * u}`} stroke={INK} strokeWidth={1.6 * u} fill="none" />
            <Circle cx={lx} cy={ly} r={2.6 * u} fill={inks.yellow} stroke={INK} strokeWidth={0.6 * u} />
            {ground(c, inks.lightGray, 0.9)}
          </G>
        )),
      ];
      if (period === 'night' || period === 'dusk') {
        // Moths circling the light.
        const moth = (a: number, r: number) => (
          <G key={a}>
            <Ellipse cx={lx + Math.cos(a) * r} cy={ly + Math.sin(a) * r} rx={1.4 * u} ry={0.8 * u} fill={inks.tan} />
          </G>
        );
        layers.push(L('moths-a', <G>{[0, 2.1, 4.2].map((a) => moth(a, 9 * u))}</G>, { kind: 'spin', duration: 5000, cx: lx, cy: ly }, 0.7));
        layers.push(L('moths-b', <G>{[1, 3.6].map((a) => moth(a, 14 * u))}</G>, { kind: 'spin', duration: 8000, cx: lx, cy: ly }, 0.7));
      }
      return layers;
    }
    case 'lawn':
      return [L('lawn', ground(c, inks.green, 0.84)), L('lawn-grass', tufts(c, 0.84), breeze, 0.75)];
    case 'sidewalk':
      return [
        L('sidewalk', (
          <G>
            {ground(c, inks.lightGray, 0.86)}
            {[0.25, 0.6, 0.9].map((x) => <Path key={x} d={`M${w * x} ${h * 0.86} L${w * x} ${h}`} stroke={INK} strokeWidth={0.4 * u} opacity={0.4} />)}
            {variant === 1 && <Rect x={w * 0.7} y={h * 0.83} width={6 * u} height={3 * u} rx={u} fill={inks.red} />}
          </G>
        )),
      ];
    case 'hedge': {
      const n = Math.max(4, Math.round(w / (14 * u)));
      const bumps = Array.from({ length: n + 1 }, (_, i) => `Q${(i - 0.5) * (w / n)} ${h * 0.78} ${i * (w / n)} ${h * 0.84}`).join(' ');
      const rnd = seededRandom(`hedge${variant}`);
      const dots = variant === 0 ? null : (
        <G>
          {Array.from({ length: 10 }, (_, i) => (
            <Circle key={i} cx={w * rnd()} cy={h * (0.82 + rnd() * 0.08)} r={0.9 * u} fill={variant === 1 ? inks.red : inks.white} />
          ))}
        </G>
      );
      return [
        L('hedge-base', <Rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill={inks.green} />),
        L('hedge', (
          <G>
            <Path d={`M0 ${h} L0 ${h * 0.84} ${bumps} L${w} ${h} Z`} fill={inks.green} />
            {season === 'winter' ? <Path d={`M0 ${h * 0.84} ${bumps}`} stroke={inks.white} strokeWidth={1.6 * u} fill="none" /> : dots}
          </G>
        ), breeze, 0.75),
      ];
    }
    case 'flowers':
      return [
        L('flower-bed', ground(c, inks.green, 0.92)),
        L('flowers', (
          <G>
            {[0.06, 0.16, 0.3, 0.7, 0.84, 0.95].map((x, i) => {
              const top = h * (0.82 - (i % 2) * 0.04);
              const petal = [[inks.pink, inks.yellow], [inks.orange, inks.yellow], [inks.white, inks.yellow]][variant][i % 2];
              return (
                <G key={x}>
                  <Path d={`M${w * x} ${h} L${w * x} ${top}`} stroke={inks.green} strokeWidth={0.8 * u} />
                  <Circle cx={w * x} cy={top} r={3 * u} fill={petal} />
                  <Circle cx={w * x} cy={top} r={1.1 * u} fill={inks.yellow} />
                </G>
              );
            })}
          </G>
        ), breeze, 0.75),
      ];
    case 'water':
      return [
        L('water', (
          <G>
            {ground(c, inks.blue, 0.8)}
            {variant === 1 && [0.15, 0.8].map((x) => <Ellipse key={x} cx={w * x} cy={h * 0.88} rx={4 * u} ry={1.4 * u} fill={inks.green} />)}
          </G>
        )),
        L('water-waves', wavelets(c, [0.86, 0.9, 0.95]), { kind: 'travelX', duration: 9000 }, 0.7),
      ];
    case 'shore':
      return [
        L('shore', (
          <G>
            {ground(c, inks.blue, 0.78)}
            <Path d={`M0 ${h * 0.88} Q${w * 0.3} ${h * 0.85} ${w * 0.6} ${h * 0.89} T${w} ${h * 0.87} L${w} ${h} L0 ${h} Z`} fill={inks.tan} />
            {variant !== 0 && [0.2, 0.55, 0.8].map((x) => <Ellipse key={x} cx={w * x} cy={h * 0.93} rx={1.6 * u} ry={1 * u} fill={variant === 1 ? inks.white : inks.gray} />)}
          </G>
        )),
        L('shore-waves', wavelets(c, [0.82]), { kind: 'travelX', duration: 11000 }, 0.65),
      ];
    case 'pier':
      return [
        L('pier', (
          <G>
            {ground(c, inks.blue, 0.84)}
            <Rect x={0} y={h * 0.8} width={w} height={2.4 * u} fill={inks.brown} stroke={INK} strokeWidth={0.4 * u} />
            {[0.1, 0.35, 0.6, 0.85].map((x) => <Rect key={x} x={w * x} y={h * 0.8} width={2.4 * u} height={h * 0.2} fill={inks.brown} />)}
            <Path d={`M0 ${h * 0.74} L${w} ${h * 0.74}`} stroke={INK} strokeWidth={0.8 * u} />
            {[0.05, 0.3, 0.55, 0.8].map((x) => <Path key={x} d={`M${w * x} ${h * 0.74} L${w * x} ${h * 0.8}`} stroke={INK} strokeWidth={0.6 * u} />)}
            {variant === 2 && <Circle cx={w * 0.7} cy={h * 0.77} r={2 * u} fill={inks.red} stroke={INK} strokeWidth={0.4 * u} />}
          </G>
        )),
        L('pier-waves', wavelets(c, [0.9, 0.96]), { kind: 'travelX', duration: 10000 }, 0.7),
      ];
    case 'reeds':
      return [
        L('reed-water', ground(c, inks.blue, 0.9)),
        L('reed-waves', wavelets(c, [0.95]), { kind: 'travelX', duration: 12000 }, 0.65),
        L('reeds', (
          <G>
            {[0.03, 0.08, 0.13, 0.86, 0.91, 0.96].map((x, i) => (
              <G key={x}>
                <Path d={`M${w * x} ${h} L${w * x + u} ${h * (0.7 - (i % 3) * 0.03)}`} stroke={inks.green} strokeWidth={0.8 * u} />
                <Rect x={w * x - 0.4 * u} y={h * (0.7 - (i % 3) * 0.03)} width={2.4 * u} height={6 * u} rx={1.2 * u} fill={inks.brown} />
              </G>
            ))}
          </G>
        ), breeze, 0.75),
      ];
    case 'fence':
      return [
        L('fence', (
          <G>
            {ground(c, inks.green, 0.92)}
            <Rect x={0} y={h * 0.84} width={w} height={1.4 * u} fill={inks.white} stroke={INK} strokeWidth={0.3 * u} />
            {Array.from({ length: Math.ceil(w / (8 * u)) }, (_, i) => (
              <Rect key={i} x={i * 8 * u} y={h * 0.78} width={4 * u} height={h * 0.16} fill={[inks.white, inks.lightGray, inks.tan][variant]} stroke={INK} strokeWidth={0.3 * u} />
            ))}
          </G>
        )),
        L('fence-grass', tufts(c, 0.92), breeze, 0.75),
      ];
    case 'trashcan':
      return [
        L('trashcan', (
          <G>
            {ground(c, inks.lightGray, 0.88)}
            <Rect x={w * 0.86} y={h * 0.74} width={11 * u} height={h * 0.15} rx={u} fill={[inks.gray, inks.green, inks.blue][variant]} stroke={INK} strokeWidth={0.5 * u} />
            <Rect x={w * 0.86 - u} y={h * 0.72} width={13 * u} height={2.2 * u} rx={u} fill={INK} />
          </G>
        )),
      ];
    case 'web': {
      const cx = w / 2;
      const cy = h * 0.36;
      return [
        L('web', (
          <G opacity={0.6}>
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <Path key={a} d={`M${cx} ${cy - 45 * u} L${cx} ${cy + 45 * u}`} stroke={INK} strokeWidth={0.3 * u} transform={`rotate(${a} ${cx} ${cy})`} />
            ))}
            {[14, 24, 34, 44].map((r) => <Circle key={r} cx={cx} cy={cy} r={r * u} stroke={INK} strokeWidth={0.3 * u} fill="none" />)}
            {/* Dew drops catch the light. */}
            {[[-14, 0], [24, -10], [-30, 22]].map(([dx, dy]) => <Circle key={dx} cx={cx + dx * u} cy={cy + dy * u} r={0.9 * u} fill={inks.white} />)}
          </G>
        ), breeze, 0.6),
      ];
    }
    case 'sky':
    case 'night-sky':
    default:
      return [];
  }
}

// ---------------------------------------------------------------- seasons

function seasonParticles(c: Ctx): Layer[] {
  const { w, h, u, season, period, variant } = c;
  const scatter = (seed: string, n: number, draw: (x: number, y: number, i: number, rnd: () => number) => ReactNode) => {
    const rnd = seededRandom(seed);
    return <G>{Array.from({ length: n }, (_, i) => draw(w * rnd(), h * rnd(), i, rnd))}</G>;
  };
  const count = Math.round(Math.min(18, Math.max(8, (c.w * c.h) / 30000)));

  // Fall has no falling particles: the season shows in the trees and the sky.
  if (season === 'fall') return [];
  if (season === 'winter') {
    const flake = (x: number, y: number, i: number, rnd: () => number) => <Circle key={i} cx={x} cy={y} r={(0.5 + rnd() * 0.9) * u} fill={inks.white} />;
    return [
      { id: 'snow-far', depth: 0.4, opacity: 0.7, motion: { kind: 'fall', duration: 30000, sway: 2 * u }, node: scatter(`sf${variant}`, count, flake) },
      { id: 'snow-near', depth: 0.9, motion: { kind: 'fall', duration: 16000, sway: 4 * u }, node: scatter(`sn${variant}`, Math.round(count * 0.6), flake) },
    ];
  }
  if (season === 'spring') {
    const petal = (x: number, y: number, i: number, rnd: () => number) => (
      <Ellipse key={i} cx={x} cy={y} rx={1.4 * u} ry={0.8 * u} fill={i % 3 ? inks.pink : inks.white} transform={`rotate(${rnd() * 180} ${x} ${y})`} />
    );
    return [
      { id: 'petals-far', depth: 0.4, opacity: 0.6, motion: { kind: 'fall', duration: 28000, sway: 5 * u }, node: scatter(`pf${variant}`, Math.round(count * 0.6), petal) },
      { id: 'petals-near', depth: 0.9, motion: { kind: 'fall', duration: 17000, sway: 8 * u }, node: scatter(`pn${variant}`, Math.round(count * 0.4), petal) },
    ];
  }
  // Summer: fireflies at dusk and night, drifting dandelion fluff by day.
  if (period === 'dusk' || period === 'night') {
    const fly = (seed: string) => {
      const rnd = seededRandom(seed);
      return (
        <G>
          {Array.from({ length: 7 }, (_, i) => {
            const x = w * rnd();
            const y = h * (0.62 + rnd() * 0.3);
            return (
              <G key={i}>
                <Circle cx={x} cy={y} r={2.4 * u} fill={inks.yellow} opacity={0.3} />
                <Circle cx={x} cy={y} r={0.8 * u} fill={inks.yellow} />
              </G>
            );
          })}
        </G>
      );
    };
    return [
      { id: 'fireflies-a', depth: 0.8, motion: { kind: 'pulse', duration: 1700, min: 0 }, node: fly(`fa${variant}`) },
      { id: 'fireflies-b', depth: 0.8, motion: { kind: 'pulse', duration: 2500, min: 0 }, node: fly(`fb${variant}`) },
    ];
  }
  const fluff = (x: number, y: number, i: number) => (
    <G key={i}>
      <Circle cx={x} cy={y} r={0.9 * u} fill={inks.white} />
      <Path d={`M${x} ${y} l${-1.6 * u} ${-1.6 * u} M${x} ${y} l${1.6 * u} ${-1.6 * u} M${x} ${y} l0 ${-2 * u}`} stroke={inks.white} strokeWidth={0.3 * u} />
    </G>
  );
  return [{ id: 'fluff', depth: 0.6, opacity: 0.8, motion: { kind: 'travelX', duration: 40000 }, node: scatter(`fl${variant}`, Math.round(count * 0.5), fluff) }];
}
