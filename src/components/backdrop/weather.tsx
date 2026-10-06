// PLACEHOLDER ART. Weather on a story backdrop: rain streaking down, heavy snow,
// fog drifting across, wind streaks, heat haze over the horizon, frost glints.
// Gray skies hide the sun, moon and stars and pull a bank of clouds across the top.

import type { ReactNode } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import type { Period } from '@/content/types';
import { seededRandom } from '@/lib/random';
import type { Sky, WeatherTag } from '@/lib/weather';
import type { Layer } from './motion';

type Ctx = { w: number; h: number; u: number; period: Period; variant: number; horizon: number };

/** Sky layers a gray sky covers up. */
export const HIDDEN_WHEN_GRAY = /^(sun|sun-rays|low-sun|light-bands|moon|moon-glow|stars-a|stars-b|shooting-star)$/;

export function isGray(sky: Sky | undefined): boolean {
  return sky !== undefined && sky !== 'clear';
}

/** True when the weather brings its own particles (so the season's step aside). */
export function replacesSeasonParticles(sky: Sky | undefined): boolean {
  return sky === 'rain' || sky === 'drizzle' || sky === 'storm' || sky === 'snow';
}

export function weatherLayers(c: Ctx, sky: Sky | undefined, tags: WeatherTag[]): Layer[] {
  const { w, h, u, period, variant } = c;
  const dark = period === 'dusk' || period === 'night';
  const scatter = (seed: string, n: number, draw: (x: number, y: number, i: number, rnd: () => number) => ReactNode) => {
    const rnd = seededRandom(seed);
    return <G>{Array.from({ length: n }, (_, i) => draw(w * rnd(), h * rnd(), i, rnd))}</G>;
  };
  const area = Math.min(1.6, Math.max(0.8, (w * h) / 300000));
  const out: Layer[] = [];

  if (isGray(sky)) {
    const gray = dark ? inks.gray : inks.lightGray;
    // A few heavy gray clouds just under the header, around the photo.
    const bank = (
      <G>
        {[
          [0.08, 0.3, 6],
          [0.9, 0.33, 7],
          [0.5, 0.29, 4.5],
        ].map(([x, y, r], i) => (
          <G key={i}>
            <Circle cx={w * x - r * 0.9 * u} cy={h * y + r * 0.3 * u} r={r * 0.7 * u} fill={gray} />
            <Circle cx={w * x} cy={h * y} r={r * u} fill={gray} />
            <Circle cx={w * x + r * 0.9 * u} cy={h * y + r * 0.3 * u} r={r * 0.65 * u} fill={gray} />
          </G>
        ))}
      </G>
    );
    out.push({ id: 'overcast', depth: 0.15, opacity: dark ? 0.5 : 0.75, motion: { kind: 'bob', duration: 30000, dx: 3 * u, dy: 0 }, node: bank });
  }

  if (sky === 'rain' || sky === 'drizzle' || sky === 'storm') {
    const color = dark ? inks.white : inks.blue;
    const n = Math.round((sky === 'drizzle' ? 26 : sky === 'storm' ? 60 : 44) * area);
    const len = (sky === 'drizzle' ? 2.2 : 4) * u;
    const slant = (tags.includes('wind') ? 1.6 : 0.6) * u;
    const drop = (x: number, y: number, i: number) => (
      <Path key={i} d={`M${x} ${y} l${-slant} ${len}`} stroke={color} strokeWidth={0.45 * u} strokeLinecap="round" />
    );
    out.push(
      { id: 'rain-far', depth: 0.4, opacity: 0.45, motion: { kind: 'fall', duration: 2600, sway: 0 }, node: scatter(`rf${variant}`, Math.round(n * 0.6), drop) },
      { id: 'rain-near', depth: 0.9, opacity: 0.8, motion: { kind: 'fall', duration: 1500, sway: 0 }, node: scatter(`rn${variant}`, Math.round(n * 0.4), drop) },
    );
    if (sky === 'storm') {
      out.push({ id: 'lightning', depth: 0.05, motion: { kind: 'flash', every: 9000, duration: 260, dx: 0, dy: 0 }, node: <Rect x={0} y={0} width={w} height={h} fill={inks.white} opacity={0.5} /> });
    }
  }

  if (sky === 'snow') {
    const flake = (x: number, y: number, i: number, rnd: () => number) => (
      <Circle key={i} cx={x} cy={y} r={(0.6 + rnd() * 1.1) * u} fill={inks.white} stroke={dark ? undefined : inks.blue} strokeWidth={0.2 * u} />
    );
    const n = Math.round(30 * area);
    const sway = (tags.includes('wind') ? 9 : 3) * u;
    out.push(
      { id: 'snowfall-far', depth: 0.3, opacity: 0.6, motion: { kind: 'fall', duration: 26000, sway }, node: scatter(`wf${variant}`, n, flake) },
      { id: 'snowfall-mid', depth: 0.6, opacity: 0.85, motion: { kind: 'fall', duration: 17000, sway: sway * 1.4 }, node: scatter(`wm${variant}`, Math.round(n * 0.7), flake) },
      { id: 'snowfall-near', depth: 0.95, motion: { kind: 'fall', duration: 11000, sway: sway * 1.8 }, node: scatter(`wn${variant}`, Math.round(n * 0.5), flake) },
    );
  }

  if (sky === 'fog' || tags.includes('fog')) {
    const veil = dark ? inks.gray : inks.white;
    const band = (y: number, height: number) => <Rect x={-w * 0.1} y={h * y} width={w * 0.7} height={height * u} rx={(height / 2) * u} fill={veil} />;
    out.push(
      { id: 'fog-veil', depth: 0, opacity: dark ? 0.25 : 0.35, motion: { kind: 'still' }, node: <Rect x={0} y={0} width={w} height={h} fill={veil} /> },
      { id: 'fog-far', depth: 0.3, opacity: 0.5, motion: { kind: 'travelX', duration: 70000 }, node: <G>{band(0.45, 9)}{band(0.7, 7)}</G> },
      { id: 'fog-near', depth: 0.8, opacity: 0.55, motion: { kind: 'travelX', duration: 45000 }, node: <G>{band(0.6, 11)}{band(0.85, 8)}</G> },
    );
  }

  if (tags.includes('wind')) {
    const color = dark ? inks.white : inks.ink;
    const gust = (x: number, y: number, i: number, rnd: () => number) => {
      const len = (10 + rnd() * 12) * u;
      return <Path key={i} d={`M${x} ${y} q${len * 0.5} ${-1.5 * u} ${len} 0 q${2 * u} ${0.8 * u} ${1 * u} ${2.4 * u}`} stroke={color} strokeWidth={0.4 * u} strokeLinecap="round" fill="none" />;
    };
    out.push(
      { id: 'gusts-far', depth: 0.3, opacity: 0.25, motion: { kind: 'travelX', duration: 7000 }, node: scatter(`gf${variant}`, 5, gust) },
      { id: 'gusts-near', depth: 0.8, opacity: 0.35, motion: { kind: 'travelX', duration: 3800 }, node: scatter(`gn${variant}`, 4, gust) },
    );
  }

  if (tags.includes('heat')) {
    const y0 = c.horizon - 10 * u;
    const haze = (
      <G>
        {[0, 3, 6].map((dy, i) => (
          <Path key={i} d={`M0 ${y0 + dy * u} q${w / 8} ${-1.2 * u} ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0`} stroke={inks.orange} strokeWidth={0.5 * u} fill="none" />
        ))}
      </G>
    );
    out.push(
      { id: 'heat-haze', depth: 0.2, opacity: 0.5, motion: { kind: 'bob', duration: 2200, dx: 2 * u, dy: 0.6 * u }, node: haze },
      { id: 'heat-glow', depth: 0, opacity: 0.18, motion: { kind: 'pulse', duration: 4000, min: 0.5 }, node: <Rect x={0} y={0} width={w} height={h} fill={inks.yellow} /> },
    );
  }

  if (tags.includes('cold') && !isGray(sky)) {
    const glint = (x: number, y: number, i: number) => {
      const s = 1.4 * u;
      return <Path key={i} d={`M${x - s} ${y} L${x + s} ${y} M${x} ${y - s} L${x} ${y + s}`} stroke={dark ? inks.white : inks.blue} strokeWidth={0.35 * u} strokeLinecap="round" />;
    };
    out.push(
      { id: 'frost-a', depth: 0.7, motion: { kind: 'pulse', duration: 2100, min: 0 }, node: scatter(`fa${variant}`, 6, glint) },
      { id: 'frost-b', depth: 0.7, motion: { kind: 'pulse', duration: 3300, min: 0 }, node: scatter(`fb${variant}`, 5, glint) },
    );
  }

  return out;
}
