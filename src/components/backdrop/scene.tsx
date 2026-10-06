// PLACEHOLDER ART. The illustrated neighborhood behind a story: one layered, flat scene
// per kind of place, in the style of a simple vector park illustration.
//
//   park        skyline far back, soft hills, a pond, rounded bushes, trees framing the
//               photo, a lamp post, a lawn with a path
//   block       skyline, a row of brownstones with stoops, street trees, a sidewalk
//   waterfront  the skyline across the river, the water, a railing promenade, lamp posts
//
// The interesting part sits in the band behind the photo (about 25–55% down); the
// header owns the top and the story's text card covers most of the ground. Trees
// follow the season, colors follow the time of day (mixed toward ink as it gets dark),
// windows and lamps light up at dusk. Everything is flat: no gradients.

import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import type { Period, PlaceKind, Season, Setting } from '@/content/types';
import { seededRandom } from '@/lib/random';
import type { Layer } from './motion';

export type SceneInput = { w: number; h: number; u: number; period: Period; season: Season; placeKind: PlaceKind; variant: number; setting?: Setting };

const INK = inks.ink;
const DARKEN: Record<Period, number> = { dawn: 0.04, midday: 0, dusk: 0.18, night: 0.55 };

/** Mix a color toward ink: the same flat colors, in lower light. */
export function shade(hex: string, t: number): string {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const mix = (i: number) => Math.round(n(hex, i) + (n(INK, i) - n(hex, i)) * t).toString(16).padStart(2, '0');
  return `#${mix(0)}${mix(1)}${mix(2)}`;
}

const SKYLINE: Record<Period, string> = { dawn: '#E3BFD3', midday: '#BCCDF0', dusk: '#2346C0', night: '#2E2E4D' };

const PALETTE: Record<Season, { hills: string; lawn: string; bush: string; canopy: string[]; dots?: string }> = {
  spring: { hills: '#A9DBA0', lawn: '#C6E8B5', bush: '#5FB872', canopy: ['#F7B8CF', '#8ED08A'], dots: '#FFFFFF' },
  summer: { hills: '#8FCC92', lawn: '#B5DDA4', bush: '#3FA66B', canopy: ['#4FB06E', '#69C281'] },
  fall: { hills: '#E7B77A', lawn: '#DCD9A2', bush: '#C9783A', canopy: ['#F28C28', '#E5484D', '#FFD23F'] },
  winter: { hills: '#DEDCE6', lawn: '#F1F0F5', bush: '#8E9C86', canopy: [] },
};

const WATER = '#9DB9F2';
const PATH = '#EAD7B7';
const SIDEWALK = '#DAD7E0';
const STREET = '#A9A7BA';
const TRUNK = '#8A6247';
const FACADES = ['#E8B9A2', '#F3D9B8', '#D9C3E6', '#F2C4C4'];

export function sceneLayers(c: SceneInput): Layer[] {
  const t = DARKEN[c.period];
  const s = (hex: string) => shade(hex, t);
  const lit = c.period === 'dusk' || c.period === 'night';
  const layers: Layer[] = [skyline(c, lit)];
  if (c.placeKind === 'park') layers.push(...park(c, s, lit));
  else if (c.placeKind === 'block') layers.push(...block(c, s, lit));
  else layers.push(...waterfront(c, s, lit));
  layers.push(...accent(c, s, lit));
  return layers;
}

// ---------------------------------------------------------------- far back

function skyline(c: SceneInput, lit: boolean): Layer {
  const { w, h, u, period, variant } = c;
  const base = h * 0.47;
  const rnd = seededRandom(`skyline${variant}`);
  const color = SKYLINE[period];
  const shapes: ReactNode[] = [];
  const windows: ReactNode[] = [];
  for (let x = -2 * u, i = 0; x < w; i++) {
    const bw = (6 + rnd() * 7) * u;
    const bh = (7 + rnd() * 20) * u;
    const top = base - bh;
    shapes.push(<Rect key={`b${i}`} x={x} y={top} width={bw} height={bh + 1} fill={color} />);
    if (bh > 20 * u && rnd() < 0.5) {
      // A stepped tower with a spire, like the ones that make the skyline.
      shapes.push(<Rect key={`s${i}`} x={x + bw * 0.25} y={top - 4 * u} width={bw * 0.5} height={4 * u} fill={color} />);
      shapes.push(<Path key={`p${i}`} d={`M${x + bw * 0.5 - 0.5 * u} ${top - 4 * u} L${x + bw * 0.5} ${top - 9 * u} L${x + bw * 0.5 + 0.5 * u} ${top - 4 * u} Z`} fill={color} />);
    } else if (bh < 13 * u && rnd() < 0.6) {
      // A water tower on a low roof.
      const tx = x + bw * 0.5;
      shapes.push(
        <G key={`w${i}`}>
          <Path d={`M${tx - 1.6 * u} ${top} l0 ${-1.6 * u} M${tx + 1.6 * u} ${top} l0 ${-1.6 * u}`} stroke={color} strokeWidth={0.5 * u} />
          <Rect x={tx - 2 * u} y={top - 4.6 * u} width={4 * u} height={3 * u} fill={color} />
          <Path d={`M${tx - 2.2 * u} ${top - 4.6 * u} L${tx} ${top - 6.4 * u} L${tx + 2.2 * u} ${top - 4.6 * u} Z`} fill={color} />
        </G>,
      );
    }
    if (lit) {
      for (let k = 0; k < (bw * bh) / (14 * u * u); k++) {
        if (rnd() < 0.55) continue;
        windows.push(<Rect key={`l${i}-${k}`} x={x + u + rnd() * (bw - 2.5 * u)} y={top + u + rnd() * (bh - 3 * u)} width={0.9 * u} height={1.2 * u} fill={inks.yellow} />);
      }
    }
    x += bw + rnd() * 1.5 * u;
  }
  return {
    id: 'skyline',
    depth: 0.1,
    opacity: period === 'midday' ? 0.85 : 1,
    motion: lit ? { kind: 'pulse', duration: 7000, min: 0.75 } : { kind: 'still' },
    node: (
      <G>
        {shapes}
        {windows}
      </G>
    ),
  };
}

function hills(c: SceneInput, s: (hex: string) => string, top: number): ReactNode {
  const { w, h } = c;
  const y = h * top;
  return <Path d={`M0 ${y + h * 0.03} Q${w * 0.2} ${y - h * 0.02} ${w * 0.45} ${y + h * 0.01} T${w} ${y - h * 0.01} L${w} ${h} L0 ${h} Z`} fill={s(PALETTE[c.season].hills)} />;
}

// ---------------------------------------------------------------- trees and props

/**
 * A tree for the season: blossoms, full green, orange and red, or bare with snow.
 * Tall trunk, big rounded canopy at the top (`size` is about the canopy's radius).
 */
function tree(c: SceneInput, s: (hex: string) => string, x: number, baseY: number, size: number, key: string): ReactNode {
  const { u, season } = c;
  const top = baseY - size * 4.2;
  const cy = top + size * 0.7; // canopy center
  const trunk = (
    <G>
      <Path d={`M${x - size * 0.2} ${baseY} Q${x - size * 0.08} ${(baseY + cy) / 2} ${x - size * 0.1} ${cy} L${x + size * 0.1} ${cy} Q${x + size * 0.08} ${(baseY + cy) / 2} ${x + size * 0.2} ${baseY} Z`} fill={s(TRUNK)} />
      <Path d={`M${x} ${cy + size * 0.5} L${x - size * 0.55} ${cy - size * 0.1} M${x} ${cy + size * 0.7} L${x + size * 0.6} ${cy}`} stroke={s(TRUNK)} strokeWidth={size * 0.09} strokeLinecap="round" />
    </G>
  );
  if (season === 'winter') {
    return (
      <G key={key}>
        {trunk}
        <Path d={`M${x - size * 0.55} ${cy - size * 0.1} l${-size * 0.25} ${-size * 0.4} M${x + size * 0.6} ${cy} l${size * 0.2} ${-size * 0.45} M${x} ${cy} l0 ${-size * 0.7} M${x} ${cy - size * 0.3} l${-size * 0.3} ${-size * 0.35}`} stroke={s(TRUNK)} strokeWidth={size * 0.06} strokeLinecap="round" />
        <Path d={`M${x - size * 0.9} ${cy - size * 0.5} q${size * 0.15} ${-0.8 * u} ${size * 0.3} 0 M${x + size * 0.65} ${cy - size * 0.45} q${size * 0.15} ${-0.8 * u} ${size * 0.3} 0 M${x - size * 0.15} ${cy - size * 0.72} q${size * 0.15} ${-0.8 * u} ${size * 0.3} 0`} stroke={inks.white} strokeWidth={size * 0.08} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  const colors = PALETTE[season].canopy;
  const rnd = seededRandom(`tree${key}`);
  const blobs: [number, number, number][] = [
    [-0.55, 0.1, 0.62],
    [0.55, 0.15, 0.6],
    [0, -0.35, 0.72],
    [-0.25, 0.35, 0.6],
    [0.3, 0.4, 0.55],
  ];
  return (
    <G key={key}>
      {trunk}
      {blobs.map(([dx, dy, r], i) => (
        <Circle key={i} cx={x + dx * size} cy={cy + dy * size} r={r * size} fill={s(colors[(i + (key.length % 2)) % colors.length])} />
      ))}
      {PALETTE[season].dots &&
        Array.from({ length: 10 }, (_, i) => (
          <Circle key={`d${i}`} cx={x + (rnd() - 0.5) * size * 1.8} cy={cy + (rnd() - 0.6) * size * 1.2} r={size * 0.06} fill={s(PALETTE[season].dots!)} />
        ))}
    </G>
  );
}

/** Little round trees along the hills, far away. */
function farTrees(c: SceneInput, s: (hex: string) => string, y: number): ReactNode {
  const { w, u, season } = c;
  const rnd = seededRandom(`far${c.variant}`);
  const color = season === 'winter' ? '#B9B2A8' : PALETTE[season].canopy[(c.variant + 1) % PALETTE[season].canopy.length];
  return (
    <G>
      {[0.03, 0.15, 0.24, 0.76, 0.86, 0.97].map((x) => {
        const r = (2.2 + rnd() * 1.6) * u;
        const tx = w * x;
        return (
          <G key={x}>
            <Rect x={tx - 0.3 * u} y={y - r} width={0.6 * u} height={r * 1.4} fill={s(TRUNK)} />
            <Circle cx={tx} cy={y - r * 1.4} r={r} fill={s(color)} />
          </G>
        );
      })}
    </G>
  );
}

/** Two trees framing the photo, swaying a touch. */
function framingTrees(c: SceneInput, s: (hex: string) => string, baseY: number): Layer {
  const { w, u, variant } = c;
  const size = 12 * u;
  return {
    id: 'trees',
    depth: 0.5,
    motion: { kind: 'bob', duration: [5200, 6400, 4600][variant], dx: 0.8 * u, dy: 0 },
    node: (
      <G>
        {tree(c, s, w * 0.07, baseY, size, 'left')}
        {tree(c, s, w * 0.94, baseY + 2 * u, size * 0.9, 'right!')}
      </G>
    ),
  };
}

function lampPost(c: SceneInput, s: (hex: string) => string, x: number, baseY: number, lit: boolean, key: string): ReactNode {
  const { u } = c;
  const top = baseY - 22 * u;
  return (
    <G key={key}>
      {lit && <Circle cx={x} cy={top} r={6 * u} fill={inks.yellow} opacity={0.35} />}
      <Rect x={x - 0.5 * u} y={top} width={u} height={baseY - top} fill={s('#3B3A50')} />
      <Rect x={x - 1.4 * u} y={baseY - 1.2 * u} width={2.8 * u} height={1.2 * u} fill={s('#3B3A50')} />
      <Path d={`M${x - 1.8 * u} ${top + 0.4 * u} L${x - 1.2 * u} ${top - 2.6 * u} L${x + 1.2 * u} ${top - 2.6 * u} L${x + 1.8 * u} ${top + 0.4 * u} Z`} fill={lit ? inks.yellow : s('#F4E9C8')} stroke={s('#3B3A50')} strokeWidth={0.4 * u} />
      <Path d={`M${x - 1.6 * u} ${top - 2.6 * u} L${x} ${top - 4 * u} L${x + 1.6 * u} ${top - 2.6 * u} Z`} fill={s('#3B3A50')} />
    </G>
  );
}

function bushes(c: SceneInput, s: (hex: string) => string, y: number): ReactNode {
  const { w, u } = c;
  const color = s(PALETTE[c.season].bush);
  const rnd = seededRandom(`bush${c.variant}`);
  return (
    <G>
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i / 8) * w + (rnd() - 0.5) * 6 * u;
        const r = (4 + rnd() * 3) * u;
        return <Ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r} fill={color} />;
      })}
      {c.season === 'winter' && <Rect x={0} y={y - 0.5 * u} width={w} height={0.8 * u} fill={inks.white} opacity={0.7} />}
    </G>
  );
}

function ripples(c: SceneInput, ys: number[]): ReactNode {
  const { w, h, u } = c;
  return (
    <G>
      {ys.map((y, i) => (
        <G key={y}>
          {[0.05, 0.3, 0.55, 0.8].map((x) => (
            <Path key={x} d={`M${w * ((x + i * 0.13) % 1)} ${h * y} q${2.5 * u} ${-1.2 * u} ${5 * u} 0`} stroke={inks.white} strokeWidth={0.6 * u} fill="none" strokeLinecap="round" opacity={0.8} />
          ))}
        </G>
      ))}
    </G>
  );
}

// ---------------------------------------------------------------- the three places

function park(c: SceneInput, s: (hex: string) => string, lit: boolean): Layer[] {
  const { w, h, u } = c;
  const lawnTop = h * 0.54;
  return [
    {
      id: 'hills',
      depth: 0.15,
      motion: { kind: 'still' },
      node: (
        <G>
          {hills(c, s, 0.47)}
          {farTrees(c, s, h * 0.475)}
        </G>
      ),
    },
    {
      id: 'pond',
      depth: 0.2,
      motion: { kind: 'still' },
      node: <Ellipse cx={w * 0.5} cy={h * 0.515} rx={w * 0.42} ry={h * 0.03} fill={s(WATER)} />,
    },
    { id: 'pond-ripples', depth: 0.2, motion: { kind: 'travelX', duration: 16000 }, node: ripples(c, [0.51, 0.522]) },
    { id: 'bushes', depth: 0.3, motion: { kind: 'still' }, node: bushes(c, s, h * 0.545) },
    {
      id: 'lawn',
      depth: 0.35,
      motion: { kind: 'still' },
      node: (
        <G>
          <Rect x={0} y={lawnTop} width={w} height={h - lawnTop} fill={s(PALETTE[c.season].lawn)} />
          <Path d={`M${w * 0.62} ${lawnTop} Q${w * 0.48} ${h * 0.7} ${w * 0.66} ${h * 0.84} T${w * 0.5} ${h}`} stroke={s(PATH)} strokeWidth={9 * u} fill="none" strokeLinecap="round" />
        </G>
      ),
    },
    { id: 'lamp', depth: 0.45, motion: lit ? { kind: 'pulse', duration: 2600, min: 0.8 } : { kind: 'still' }, node: lampPost(c, s, w * 0.8, h * 0.6, lit, 'lamp') },
    framingTrees(c, s, h * 0.64),
  ];
}

function block(c: SceneInput, s: (hex: string) => string, lit: boolean): Layer[] {
  const { w, h, u, variant } = c;
  const base = h * 0.56;
  const n = 5;
  const bw = w / n;
  const rows: ReactNode[] = [];
  const lights: ReactNode[] = [];
  const rnd = seededRandom(`row${variant}`);
  for (let i = 0; i < n; i++) {
    const x = i * bw;
    const top = base - h * (0.18 + (i % 2) * 0.025);
    const facade = s(FACADES[(i + variant) % FACADES.length]);
    rows.push(
      <G key={i}>
        <Rect x={x} y={top} width={bw + 0.5} height={base - top} fill={facade} />
        {/* Cornice */}
        <Rect x={x - 0.4 * u} y={top - 1.2 * u} width={bw + 0.8 * u} height={1.6 * u} fill={s('#B88D7A')} />
        {/* Stoop and door */}
        <Path d={`M${x + bw * 0.62} ${base} L${x + bw * 0.62} ${base - 3 * u} L${x + bw * 0.9} ${base - 3 * u} L${x + bw * 0.98} ${base} Z`} fill={s('#C9A890')} />
        <Rect x={x + bw * 0.66} y={base - 9 * u} width={bw * 0.2} height={6 * u} fill={s('#6B4A3A')} />
      </G>,
    );
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 2; col++) {
        const wx = x + bw * (0.14 + col * 0.26);
        const wy = top + 3 * u + r * 6.5 * u;
        if (wy > base - 8 * u) continue;
        const on = lit && rnd() < 0.55;
        (on ? lights : rows).push(<Rect key={`${i}-${r}-${col}`} x={wx} y={wy} width={bw * 0.16} height={4 * u} fill={on ? inks.yellow : s('#6F86C9')} />);
      }
    }
  }
  return [
    {
      id: 'brownstones',
      depth: 0.25,
      motion: { kind: 'still' },
      node: (
        <G>
          {rows}
          <Rect x={0} y={base} width={w} height={h * 0.06} fill={s(SIDEWALK)} />
          <Rect x={0} y={base + h * 0.06} width={w} height={h - base} fill={s(STREET)} />
          {[0.1, 0.35, 0.6, 0.85].map((x) => <Rect key={x} x={w * x} y={h * 0.75} width={8 * u} height={0.9 * u} fill={s('#F4F2F7')} opacity={0.8} />)}
        </G>
      ),
    },
    { id: 'windows', depth: 0.25, motion: { kind: 'pulse', duration: 5600, min: 0.55 }, node: <G>{lights}</G> },
    framingTrees(c, s, base + 2 * u),
  ];
}

function waterfront(c: SceneInput, s: (hex: string) => string, lit: boolean): Layer[] {
  const { w, h, u, variant } = c;
  const waterTop = h * 0.47;
  const rail = h * 0.6;
  const boatX = w * 0.3;
  const boatY = h * 0.5;
  return [
    {
      id: 'river',
      depth: 0.15,
      motion: { kind: 'still' },
      node: <Rect x={0} y={waterTop} width={w} height={rail - waterTop} fill={s(WATER)} />,
    },
    { id: 'river-ripples', depth: 0.2, motion: { kind: 'travelX', duration: 14000 }, node: ripples(c, [0.5, 0.54, 0.575]) },
    {
      id: 'boat',
      depth: 0.2,
      motion: { kind: 'travelX', duration: 90000 },
      node:
        variant === 1 ? (
          <G>
            <Path d={`M${boatX - 4 * u} ${boatY} L${boatX + 4 * u} ${boatY} L${boatX + 3 * u} ${boatY + 1.6 * u} L${boatX - 3 * u} ${boatY + 1.6 * u} Z`} fill={inks.white} />
            <Path d={`M${boatX} ${boatY} L${boatX} ${boatY - 7 * u} L${boatX + 4 * u} ${boatY - u} Z`} fill={inks.white} />
          </G>
        ) : (
          <G>
            <Path d={`M${boatX - 7 * u} ${boatY} L${boatX + 7 * u} ${boatY} L${boatX + 5.5 * u} ${boatY + 2 * u} L${boatX - 5.5 * u} ${boatY + 2 * u} Z`} fill={s(inks.orange)} />
            <Rect x={boatX - 4 * u} y={boatY - 2.2 * u} width={8 * u} height={2.2 * u} fill={s(inks.orange)} />
            <Rect x={boatX - 1.6 * u} y={boatY - 3.6 * u} width={3.2 * u} height={1.4 * u} fill={s(inks.white)} />
          </G>
        ),
    },
    {
      id: 'promenade',
      depth: 0.35,
      motion: { kind: 'still' },
      node: (
        <G>
          <Rect x={0} y={rail} width={w} height={h - rail} fill={s(PATH)} />
          {[0.68, 0.78, 0.9].map((y) => <Path key={y} d={`M0 ${h * y} L${w} ${h * y}`} stroke={s('#D4BF9C')} strokeWidth={0.5 * u} />)}
          {/* The railing along the water */}
          <Rect x={0} y={rail - 6 * u} width={w} height={0.9 * u} fill={s('#3B3A50')} />
          <Rect x={0} y={rail - 3 * u} width={w} height={0.5 * u} fill={s('#3B3A50')} />
          {Array.from({ length: 12 }, (_, i) => <Rect key={i} x={(i / 11) * w - 0.4 * u} y={rail - 6 * u} width={0.8 * u} height={6 * u} fill={s('#3B3A50')} />)}
        </G>
      ),
    },
    {
      id: 'lamps',
      depth: 0.45,
      motion: lit ? { kind: 'pulse', duration: 2600, min: 0.8 } : { kind: 'still' },
      node: (
        <G>
          {lampPost(c, s, w * 0.18, rail + 2 * u, lit, 'a')}
          {lampPost(c, s, w * 0.84, rail + 2 * u, lit, 'b')}
        </G>
      ),
    },
    framingTrees(c, s, rail + 6 * u),
  ];
}

// ---------------------------------------------------------------- the moment's touch

/**
 * One small detail for where the moment happens (a wire for a dove on a wire, cattails
 * for a red-wing in the reeds), placed where it stays visible: in the sky band beside
 * the photo, or along the ground just above the story card.
 */
function accent(c: SceneInput, s: (hex: string) => string, lit: boolean): Layer[] {
  const { w, h, u, season, setting, variant } = c;
  const ground = h * 0.585; // just above the story card
  const one = (id: string, node: ReactNode, motion: Layer['motion'] = { kind: 'still' }): Layer[] => [{ id: `accent-${id}`, depth: 0.55, motion, node }];
  const leaf = PALETTE[season].canopy[variant % Math.max(1, PALETTE[season].canopy.length)] ?? '#B9B2A8';
  const sway = { kind: 'bob', duration: 4200, dx: 0.8 * u, dy: 0.4 * u } as const;
  switch (setting) {
    case 'wire': {
      const y = h * 0.34;
      return one('wire', (
        <G>
          <Rect x={w * 0.03} y={y - 4 * u} width={1.6 * u} height={h * 0.34} fill={s(TRUNK)} />
          <Rect x={w * 0.03 - 2 * u} y={y - 3.5 * u} width={5.6 * u} height={0.9 * u} fill={s(TRUNK)} />
          <Path d={`M${w * 0.04} ${y - 3 * u} Q${w * 0.5} ${y + 5 * u} ${w * 1.02} ${y - 4 * u}`} stroke={s('#3B3A50')} strokeWidth={0.6 * u} fill="none" />
          <Path d={`M${w * 0.04} ${y} Q${w * 0.5} ${y + 8 * u} ${w * 1.02} ${y - u}`} stroke={s('#3B3A50')} strokeWidth={0.5 * u} fill="none" />
        </G>
      ), { kind: 'bob', duration: 3600, dx: 0, dy: 0.6 * u });
    }
    case 'branch': {
      const y = h * 0.35;
      return one('branch', (
        <G>
          <Path d={`M${w * 1.02} ${y} Q${w * 0.86} ${y + 2 * u} ${w * 0.74} ${y - 3 * u}`} stroke={s(TRUNK)} strokeWidth={2.4 * u} strokeLinecap="round" fill="none" />
          <Path d={`M${w * 0.86} ${y + u} L${w * 0.82} ${y + 5 * u}`} stroke={s(TRUNK)} strokeWidth={1.2 * u} strokeLinecap="round" />
          {season !== 'winter' &&
            [[0.75, -4.5, 3.2], [0.8, -1.5, 2.6], [0.83, 5.5, 2.4], [0.92, -2.5, 3]].map(([x, dy, r]) => <Circle key={x} cx={w * x} cy={y + dy * u} r={r * u} fill={s(leaf)} />)}
          {season === 'winter' && <Path d={`M${w * 0.76} ${y - 3.6 * u} q${4 * u} ${-u} ${9 * u} ${1.2 * u}`} stroke={inks.white} strokeWidth={0.9 * u} strokeLinecap="round" fill="none" />}
        </G>
      ), sway);
    }
    case 'trunk':
      return one('trunk', (
        <G>
          <Rect x={w * 0.88} y={h * 0.3} width={w * 0.14} height={h * 0.35} fill={s(TRUNK)} />
          {[0.36, 0.45, 0.54].map((y) => <Path key={y} d={`M${w * 0.92} ${h * y} l${u} ${4 * u}`} stroke={s('#6B4A3A')} strokeWidth={0.6 * u} strokeLinecap="round" />)}
        </G>
      ));
    case 'den':
      return one('den', (
        <G>
          <Rect x={w * 0.86} y={h * 0.3} width={w * 0.16} height={h * 0.34} fill={s(TRUNK)} />
          <Ellipse cx={w * 0.92} cy={h * 0.42} rx={3.6 * u} ry={5 * u} fill={s('#3A2A20')} />
        </G>
      ));
    case 'ledge':
    case 'rooftop':
      return one(setting, setting === 'ledge' ? (
        <G>
          {/* A stone cornice with brackets under it: the pigeon's favorite seat. */}
          <Rect x={0} y={h * 0.34 - 1.2 * u} width={w} height={1.2 * u} fill={s('#B9B2C9')} />
          <Rect x={0} y={h * 0.34} width={w} height={3 * u} fill={s('#D9D3E3')} stroke={s('#9C9AB0')} strokeWidth={0.3 * u} />
          {Array.from({ length: 9 }, (_, i) => (
            <Path key={i} d={`M${(i / 8) * w - 1.5 * u} ${h * 0.34 + 3 * u} l${3 * u} 0 l${-0.8 * u} ${3 * u} l${-1.4 * u} 0 Z`} fill={s('#C9C2D6')} />
          ))}
        </G>
      ) : (
        <G>
          <Path d={`M${w * 0.86} ${h * 0.38} l0 ${-3 * u} M${w * 0.93} ${h * 0.38} l0 ${-3 * u}`} stroke={s('#6B4A3A')} strokeWidth={0.7 * u} />
          <Rect x={w * 0.845} y={h * 0.38 - 10 * u} width={w * 0.1} height={7 * u} fill={s('#B88D7A')} />
          <Path d={`M${w * 0.84} ${h * 0.38 - 10 * u} L${w * 0.895} ${h * 0.38 - 14 * u} L${w * 0.95} ${h * 0.38 - 10 * u} Z`} fill={s('#8A6247')} />
        </G>
      ));
    case 'streetlight':
      return c.placeKind === 'block' ? one('lamp', lampPost(c, s, w * 0.86, ground, lit, 'accent'), lit ? { kind: 'pulse', duration: 2600, min: 0.8 } : { kind: 'still' }) : [];
    case 'hedge': {
      const color = s(PALETTE[season].bush);
      return one('hedge', (
        <G>
          {Array.from({ length: 8 }, (_, i) => <Circle key={i} cx={(i / 7) * w} cy={ground} r={5.5 * u} fill={color} />)}
          <Rect x={0} y={ground} width={w} height={4 * u} fill={color} />
          {season === 'winter' && <Rect x={0} y={ground - 5.5 * u} width={w} height={u} fill={inks.white} opacity={0.8} />}
        </G>
      ));
    }
    case 'flowers': {
      const petals = { spring: ['#FF6B9A', '#FFD23F'], summer: ['#FFFFFF', '#FFD23F'], fall: ['#9B7BD8', '#F28C28'], winter: [] }[season];
      if (petals.length === 0) return [];
      const stems = [0.04, 0.09, 0.14, 0.86, 0.91, 0.96];
      return one('flowers', (
        <G>
          {stems.map((x, i) => (
            <G key={x}>
              <Path d={`M${w * x} ${ground + 4 * u} l0 ${-7 * u}`} stroke={s('#3FA66B')} strokeWidth={0.6 * u} />
              <Circle cx={w * x} cy={ground - 3.5 * u} r={1.8 * u} fill={s(petals[i % 2])} stroke={s(INK)} strokeWidth={0.2 * u} />
              <Circle cx={w * x} cy={ground - 3.5 * u} r={0.6 * u} fill={s('#8A6247')} />
            </G>
          ))}
        </G>
      ), sway);
    }
    case 'reeds':
      return one('reeds', (
        <G>
          {[0.03, 0.07, 0.11, 0.88, 0.92, 0.96].map((x, i) => (
            <G key={x}>
              <Path d={`M${w * x} ${ground + 4 * u} l${(i % 2 ? 1 : -1) * u} ${-13 * u}`} stroke={s(season === 'winter' ? '#B9A27A' : '#5FA05A')} strokeWidth={0.6 * u} />
              <Rect x={w * x + (i % 2 ? 0.4 : -1.4) * u} y={ground - 12 * u} width={1.2 * u} height={4 * u} rx={0.6 * u} fill={s('#7A5236')} />
            </G>
          ))}
        </G>
      ), sway);
    case 'fence':
      return one('fence', (
        <G>
          <Rect x={0} y={ground - 6 * u} width={w} height={0.7 * u} fill={s('#3B3A50')} />
          <Rect x={0} y={ground - 1.5 * u} width={w} height={0.7 * u} fill={s('#3B3A50')} />
          {Array.from({ length: 24 }, (_, i) => (
            <Path key={i} d={`M${(i / 23) * w} ${ground + 2 * u} L${(i / 23) * w} ${ground - 7 * u} l${-0.6 * u} ${0.9 * u} M${(i / 23) * w} ${ground - 7 * u} l${0.6 * u} ${0.9 * u}`} stroke={s('#3B3A50')} strokeWidth={0.5 * u} fill="none" />
          ))}
        </G>
      ));
    case 'trashcan':
      return one('trashcan', (
        <G>
          <Path d={`M${w * 0.84} ${ground - 8 * u} L${w * 0.93} ${ground - 8 * u} L${w * 0.92} ${ground + 2 * u} L${w * 0.85} ${ground + 2 * u} Z`} fill={s('#5E7C6A')} stroke={s(INK)} strokeWidth={0.3 * u} />
          <Rect x={w * 0.835} y={ground - 9 * u} width={w * 0.1} height={1.4 * u} rx={0.5 * u} fill={s('#4A6556')} />
          {[0.865, 0.885, 0.905].map((x) => <Path key={x} d={`M${w * x} ${ground - 6 * u} l0 ${6.5 * u}`} stroke={s('#4A6556')} strokeWidth={0.4 * u} />)}
        </G>
      ));
    case 'web': {
      const cx = w * 0.88;
      const cy = h * 0.36;
      const r = 9 * u;
      return one('web', (
        <G opacity={0.85}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <Path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`} stroke={inks.white} strokeWidth={0.25 * u} />;
          })}
          {[0.35, 0.6, 0.85].map((k) => <Circle key={k} cx={cx} cy={cy} r={r * k} stroke={inks.white} strokeWidth={0.25 * u} fill="none" />)}
          <Circle cx={cx} cy={cy} r={0.9 * u} fill={s(INK)} />
        </G>
      ), { kind: 'pulse', duration: 3000, min: 0.7 });
    }
    case 'water':
      return c.placeKind === 'block' ? one('puddle', <Ellipse cx={w * 0.82} cy={ground + u} rx={8 * u} ry={1.6 * u} fill={s(WATER)} />) : [];
    case 'shore':
      return one('rocks', (
        <G>
          {[[0.06, 4], [0.12, 3], [0.9, 3.6], [0.95, 2.6]].map(([x, r]) => <Ellipse key={x} cx={w * x} cy={ground + u} rx={r * u} ry={r * 0.7 * u} fill={s('#A8A3B4')} stroke={s(INK)} strokeWidth={0.2 * u} />)}
        </G>
      ));
    case 'pier':
      return one('pilings', (
        <G>
          {[0.05, 0.1, 0.9, 0.95].map((x) => <Rect key={x} x={w * x - u} y={ground - 9 * u} width={2 * u} height={11 * u} rx={0.6 * u} fill={s('#7A5A44')} />)}
        </G>
      ));
    default:
      return []; // lawn, sidewalk, sky, night-sky: the scene already says it
  }
}