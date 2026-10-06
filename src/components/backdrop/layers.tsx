// PLACEHOLDER ART. Builds the layers of a story backdrop, back to front:
//   time-of-day sky → clouds (far, near) → life in the sky → the illustrated
//   neighborhood (scene.tsx) → seasonal particles → the weather.
// Positions are fractions of the screen and sizes scale with its shorter side, so it
// fits a phone and a wide browser. `variant` (0–2, seeded per slide) picks different
// details, so two slides with the same setting don't look identical.

import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import type { Period, PlaceKind, Season, Setting } from '@/content/types';
import { seededRandom } from '@/lib/random';
import type { Sky, WeatherTag } from '@/lib/weather';
import type { Layer } from './motion';
import { sceneLayers } from './scene';
import { CritterArt, type ArtSpec } from '@/components/art/CritterArt';
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
  /** The weather right now. Unknown: the season's usual look (snow in winter, and so on). */
  sky?: Sky;
  weather?: WeatherTag[];
  /** A neighbor who shows up in the scene for this slide: flying past, or watching from the edge. */
  cameo?: { art: ArtSpec; flies: boolean };
};

type Ctx = BackdropInput & { u: number; rnd: () => number; horizon: number };

/**
 * Sky things stay below the time header: SKY_TOP is the highest they go. The ground
 * line (`horizon`) sits just above the story's button.
 */
const BUTTON_ZONE = 96; // pt from the bottom: the "Meet the…" button and its padding
const SKY_TOP = 0.28;

export function buildLayers(input: BackdropInput): Layer[] {
  const u = Math.min(input.w, input.h) / 100;
  const c: Ctx = {
    ...input,
    u,
    rnd: seededRandom(`${input.setting}:${input.variant}:${input.season}`),
    horizon: input.h - BUTTON_ZONE,
  };
  const isDay = c.period !== 'night';
  const { sky, weather = [] } = input;
  // Known weather decides the particles: no winter snow on a clear day, rain instead of petals.
  const particles = sky === undefined ? seasonParticles(c) : replacesSeasonParticles(sky) ? [] : seasonParticles(c).filter((l) => !l.id.startsWith('snow'));
  return [
    ...timeOfDay(c).filter((l) => !(isGray(sky) && HIDDEN_WHEN_GRAY.test(l.id))),
    ...(isDay ? clouds(c) : []),
    ...(isDay ? flock(c) : []),
    ...sceneLayers(c),
    ...cameoLayers(c),
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
      { id: 'moon-glow', depth: 0.05, motion: { kind: 'pulse', duration: 5000, min: 0.4 }, node: <Circle cx={mx} cy={my} r={r * 1.8} fill={inks.yellow} opacity={0.08} /> },
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
        motion: { kind: 'still' }, // fixed to the sun, so they never drift off on their own
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

  // Dawn and dusk: a sun low in the sky beside the photo, with a soft halo that breathes.
  const warm = period === 'dusk';
  const sx = w * [0.86, 0.14, 0.88][variant];
  const sy = h * (SKY_TOP + 0.07);
  const r = 7 * u;
  return [
    {
      id: 'sun-glow',
      depth: 0.03,
      motion: { kind: 'pulse', duration: 6000, min: 0.6 },
      node: (
        <G>
          <Circle cx={sx} cy={sy} r={r * 2.4} fill={warm ? inks.pink : inks.pinkTint} opacity={0.45} />
          <Circle cx={sx} cy={sy} r={r * 1.6} fill={warm ? inks.orange : inks.yellowTint} opacity={0.5} />
        </G>
      ),
    },
    { id: 'low-sun', depth: 0.05, motion: { kind: 'still' }, node: <Circle cx={sx} cy={sy} r={r} fill={warm ? inks.orange : inks.yellow} /> },
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

// ---------------------------------------------------------------- the co-star

/**
 * The scene reacts to the story: when a slide is about two neighbors meeting (or a big
 * moment), the other one appears. Flyers cross the sky band behind the photo; the rest
 * watch from the edge of the ground, just above the story card.
 */
function cameoLayers(c: Ctx): Layer[] {
  if (!c.cameo) return [];
  const { w, h, u } = c;
  const size = (c.cameo.flies ? 11 : 14) * u;
  const k = size / 100; // CritterArt draws on a 100×100 grid
  if (c.cameo.flies) {
    return [
      {
        id: 'cameo',
        depth: 0.45,
        motion: { kind: 'travelX', duration: 16000 },
        node: (
          <G transform={`translate(${w * 0.08} ${h * 0.3}) scale(${k})`}>
            <CritterArt art={c.cameo.art} />
          </G>
        ),
      },
    ];
  }
  return [
    {
      id: 'cameo',
      depth: 0.55,
      motion: { kind: 'bob', duration: 3000, dx: 0, dy: 0.8 * u },
      node: (
        <G transform={`translate(${w * 0.8} ${h * 0.585 - size * 0.85}) scale(${k})`}>
          <CritterArt art={c.cameo.art} />
        </G>
      ),
    },
  ];
}