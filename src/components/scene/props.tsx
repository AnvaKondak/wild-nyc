// Little things that make each close-up a different view of the same kind of place: a
// café awning or a street tree on the block, a birdhouse or a nest in the branches, a
// bench or a fence in the park, a traffic light on the wire, a ferry on the river. Each
// scene has a few versions; the story picks one per slide and day (see CloseUp's
// `variant`), so the same neighbor doesn't always get the same view.
//
// Same riso look as the scenes: flat fills, ink outlines, no gradients.

import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Period, Season } from '@/content/types';
import { colors } from '@/theme/tokens';

const INK = colors.ink;
const dim = (period: Period, day: string, dusk: string, night: string) => (period === 'night' ? night : period === 'dusk' ? dusk : day);
const WOOD = (period: Period) => dim(period, '#C9955E', '#A9785A', '#5A4A44');
const IRON = '#1F1F2E';

// ---------------------------------------------------------------- the block

/** A striped awning over the ground-floor window, and a little café table with two chairs on the sidewalk. */
export function Cafe({ w, winX, winW, winTop, pavement, period }: { w: number; winX: number; winW: number; winTop: number; pavement: number; period: Period }) {
  const x = winX - 14;
  const aw = winW + 28;
  const y = winTop - 30;
  const stripes = 6;
  const sw = aw / stripes;
  const tx = w * 0.27;
  const top = pavement + 16;
  const cloth = dim(period, '#FF6B9A', '#D9577F', '#7A3A50');
  const white = dim(period, '#FFFFFF', '#E3DCE6', '#7A7A8A');
  return (
    <G>
      {/* Awning: stripes, then a scalloped edge. */}
      {Array.from({ length: stripes }, (_, i) => (
        <Path key={i} d={`M${x + sw * i} ${y} L${x + sw * (i + 1)} ${y} L${x + sw * (i + 1) + 4} ${y + 26} L${x + sw * i + 4} ${y + 26} Z`} fill={i % 2 ? white : cloth} />
      ))}
      <Path d={`M${x} ${y} H${x + aw} L${x + aw + 4} ${y + 26} H${x + 4} Z`} fill="none" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={Array.from({ length: stripes }, (_, i) => `${i ? '' : `M${x + 4} ${y + 26}`} q${sw / 2} 12 ${sw} 0`).join(' ')} fill={cloth} stroke={INK} strokeWidth={1.5} />
      {/* The table and chairs, just in front of the wall. */}
      <G transform={`translate(${tx} ${top}) scale(1.4) translate(${-tx} ${-top})`}>
      {[-1, 1].map((s) => (
        <G key={s}>
          <Path d={`M${tx + s * 30} ${top} V${top - 30} M${tx + s * 30} ${top - 14} H${tx + s * 18} V${top}`} stroke={IRON} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Rect x={tx + s * 30 - (s > 0 ? 0 : 3)} y={top - 32} width={3} height={18} fill={IRON} />
        </G>
      ))}
      <Path d={`M${tx} ${top - 22} V${top} M${tx - 10} ${top} H${tx + 10}`} stroke={IRON} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={tx} cy={top - 24} rx={20} ry={5} fill={white} stroke={INK} strokeWidth={1.5} />
      {/* A little cup with steam. */}
      <Rect x={tx - 4} y={top - 34} width={9} height={9} rx={2} fill={colors.yellow} stroke={INK} strokeWidth={1} />
      <Path d={`M${tx} ${top - 38} q-3 -5 0 -10`} stroke={INK} strokeWidth={1} fill="none" opacity={0.5} />
      </G>
    </G>
  );
}

/** A street tree in its little fenced pit at the left, with a bike leaning on the stoop railing. */
export function StreetTree({ w, pavement, bh, period, season }: { w: number; pavement: number; bh: number; period: Period; season: Season }) {
  const tx = w * 0.07;
  const trunkTop = pavement - bh * 1.05;
  const leaves = season === 'winter' ? undefined : dim(period, season === 'fall' ? '#E8A23C' : season === 'spring' ? '#9BD27A' : '#5FC48E', '#4C7A5A', '#2F4A3A');
  const bx = w * 0.42;
  const by = pavement + 8;
  const r = 15;
  return (
    <G>
      <Path d={`M${tx - 8} ${pavement + 10} L${tx - 5} ${trunkTop} H${tx + 5} L${tx + 8} ${pavement + 10} Z`} fill="#8A6247" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${tx} ${trunkTop + 40} q20 -20 34 -30 M${tx} ${trunkTop + 70} q-14 -10 -22 -24`} stroke="#8A6247" strokeWidth={5} strokeLinecap="round" fill="none" />
      {leaves && [[0, 0, 34], [24, 14, 26], [-18, 22, 24], [10, 36, 22]].map(([dx, dy, cr], i) => <Circle key={i} cx={tx + dx} cy={trunkTop + dy} r={cr} fill={leaves} stroke={INK} strokeWidth={1.5} />)}
      {/* The tree pit's little iron fence. */}
      <Rect x={tx - 26} y={pavement + 2} width={52} height={10} fill="#8A6A4E" stroke={INK} strokeWidth={1} />
      {Array.from({ length: 6 }, (_, i) => <Path key={i} d={`M${tx - 24 + i * 9.6} ${pavement + 12} V${pavement - 6}`} stroke={IRON} strokeWidth={2} />)}
      <Path d={`M${tx - 26} ${pavement - 6} H${tx + 26}`} stroke={IRON} strokeWidth={2.5} />
      {/* A bike: two wheels, a frame, a basket. */}
      <G>
        {[bx - 26, bx + 26].map((cx, i) => (
          <G key={i}>
            <Circle cx={cx} cy={by - r} r={r} fill="none" stroke={IRON} strokeWidth={3} />
            <Circle cx={cx} cy={by - r} r={2} fill={IRON} />
          </G>
        ))}
        <Path d={`M${bx - 26} ${by - r} L${bx - 4} ${by - r - 20} L${bx + 18} ${by - r - 20} L${bx + 26} ${by - r} M${bx - 4} ${by - r - 20} L${bx} ${by - r} L${bx + 18} ${by - r - 20} M${bx - 6} ${by - r - 26} H${bx + 4} M${bx + 18} ${by - r - 20} L${bx + 20} ${by - r - 28}`} stroke={colors.blue} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Rect x={bx + 12} y={by - r - 40} width={20} height={12} rx={2} fill={WOOD(period)} stroke={INK} strokeWidth={1.2} />
        {[0, 1, 2].map((k) => <Circle key={k} cx={bx + 16 + k * 6} cy={by - r - 41} r={3.5} fill={k === 1 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={0.8} />)}
      </G>
    </G>
  );
}

// ---------------------------------------------------------------- in the branches

/** A little wooden birdhouse hanging from the twig on the right. */
export function Birdhouse({ x, y, bh, period }: { x: number; y: number; bh: number; period: Period }) {
  const s = bh * 0.22;
  const top = y + bh * 0.06;
  return (
    <G>
      <Path d={`M${x} ${y} V${top}`} stroke={INK} strokeWidth={1.5} />
      <Rect x={x - s / 2} y={top + s * 0.35} width={s} height={s * 0.85} fill={dim(period, '#7FA8E8', '#5E7FD6', '#34405E')} stroke={INK} strokeWidth={1.5} />
      <Path d={`M${x - s * 0.66} ${top + s * 0.4} L${x} ${top} L${x + s * 0.66} ${top + s * 0.4} Z`} fill={dim(period, '#E5484D', '#B83A40', '#5A2A30')} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx={x} cy={top + s * 0.72} r={s * 0.16} fill={INK} />
      <Path d={`M${x} ${top + s * 0.98} h${s * 0.18}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
}

/** An empty woven nest sitting in a fork of the branch. */
export function Nest({ x, y, bh }: { x: number; y: number; bh: number }) {
  const rx = bh * 0.16;
  const ry = bh * 0.07;
  return (
    <G>
      <Path d={`M${x - rx} ${y - ry} Q${x} ${y + ry * 2.6} ${x + rx} ${y - ry} Z`} fill="#A9784E" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Ellipse cx={x} cy={y - ry} rx={rx} ry={ry * 0.6} fill="#6E4E38" stroke={INK} strokeWidth={1.5} />
      {[-0.7, -0.3, 0.1, 0.5].map((f, i) => <Path key={i} d={`M${x + rx * f} ${y - ry * 0.4} q${rx * 0.25} ${ry * 0.9} ${rx * 0.5} ${ry * 0.2}`} stroke="#E8C27A" strokeWidth={1.5} fill="none" />)}
    </G>
  );
}

// ---------------------------------------------------------------- the park

/** A park path curving away, with a green bench and an old-fashioned lamp post behind it. */
export function ParkPath({ w, h, top, bh, period }: { w: number; h: number; top: number; bh: number; period: Period }) {
  const path = dim(period, '#E8DCC4', '#B9A88E', '#4E4A50');
  const lit = period === 'dusk' || period === 'night';
  // The bench and lamp sit at the edges, clear of whoever's in the middle.
  const bx = w * 0.86;
  const by = top + bh * 0.06;
  const lx = w * 0.1;
  const green = dim(period, '#3E8E4E', '#2F6E48', '#24402E');
  return (
    <G>
      <Path d={`M${w * 0.55} ${top} C${w * 0.5} ${top + bh * 0.3} ${w * 0.2} ${top + bh * 0.5} ${w * 0.1} ${h} L${w * 0.62} ${h} C${w * 0.6} ${top + bh * 0.5} ${w * 0.66} ${top + bh * 0.3} ${w * 0.62} ${top} Z`} fill={path} stroke={INK} strokeWidth={1.2} />
      {/* The lamp. */}
      <Path d={`M${lx} ${top + bh * 0.12} V${top - bh * 0.62}`} stroke={IRON} strokeWidth={5} />
      <Path d={`M${lx - 12} ${top - bh * 0.62} H${lx + 12} L${lx + 8} ${top - bh * 0.74} H${lx - 8} Z`} fill={lit ? colors.yellow : '#F7F3EC'} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${lx - 10} ${top - bh * 0.74} L${lx} ${top - bh * 0.8} L${lx + 10} ${top - bh * 0.74} Z`} fill={IRON} />
      {/* The bench: slatted back and seat on iron legs. */}
      <Path d={`M${bx - 30} ${by} V${by - 16} M${bx + 30} ${by} V${by - 16}`} stroke={IRON} strokeWidth={3} />
      {[0, 1].map((k) => <Rect key={k} x={bx - 36} y={by - 40 + k * 9} width={72} height={6} rx={2} fill={green} stroke={INK} strokeWidth={1} />)}
      <Rect x={bx - 38} y={by - 20} width={76} height={6} rx={2} fill={green} stroke={INK} strokeWidth={1} />
    </G>
  );
}

/** A split-rail wooden fence along the back of the lawn, and a big old tree at the left edge. */
export function ParkFence({ w, h, top, bh, period, season }: { w: number; h: number; top: number; bh: number; period: Period; season: Season }) {
  const wood = WOOD(period);
  const leaves = season === 'winter' ? undefined : dim(period, season === 'fall' ? '#F28C28' : season === 'spring' ? '#9BD27A' : '#3FA66B', '#4C7A5A', '#2F4A3A');
  return (
    <G>
      {[0.12, 0.38, 0.62, 0.86].map((f, i) => <Rect key={i} x={w * f - 4} y={top - bh * 0.16} width={8} height={bh * 0.2} fill={wood} stroke={INK} strokeWidth={1.2} />)}
      {[0.06, 0.13].map((d, i) => <Path key={i} d={`M0 ${top - bh * d} H${w}`} stroke={INK} strokeWidth={6} />)}
      {[0.06, 0.13].map((d, i) => <Path key={`f${i}`} d={`M0 ${top - bh * d} H${w}`} stroke={wood} strokeWidth={3.5} />)}
      <Rect x={-10} y={top - bh * 1.5} width={w * 0.1} height={h} fill="#8A6247" stroke={INK} strokeWidth={1.5} />
      <Path d={`M${w * 0.03} ${top - bh * 1.2} C${w * 0.02} ${top - bh * 0.6} ${w * 0.05} ${top} ${w * 0.03} ${top + bh * 0.4}`} stroke="#6E4E38" strokeWidth={3} fill="none" />
      {leaves && [[0.04, -1.5, 0.3], [0.14, -1.35, 0.22], [0.0, -1.2, 0.22]].map(([x, dy, r], i) => <Circle key={i} cx={w * x} cy={top + bh * dy} r={bh * r} fill={leaves} stroke={INK} strokeWidth={1.5} />)}
    </G>
  );
}

// ---------------------------------------------------------------- the wire and the sky

/** A yellow traffic light hanging from the wire, on the right. */
export function TrafficLight({ x, y, bh, period }: { x: number; y: number; bh: number; period: Period }) {
  const lw = bh * 0.13;
  const lh = lw * 2.6;
  const on = period === 'night' || period === 'dusk' ? 1 : 0.85;
  return (
    <G>
      <Path d={`M${x} ${y} V${y + 10}`} stroke={INK} strokeWidth={2} />
      <Rect x={x - lw / 2} y={y + 10} width={lw} height={lh} rx={5} fill={colors.yellow} stroke={INK} strokeWidth={1.5} />
      {['#E5484D', '#F2B53A', '#3FA66B'].map((c, i) => (
        <Circle key={i} cx={x} cy={y + 10 + lh * (0.19 + i * 0.31)} r={lw * 0.3} fill={i === 2 ? c : '#55546A'} stroke={INK} strokeWidth={1} opacity={i === 2 ? on : 1} />
      ))}
    </G>
  );
}

/** A pair of sneakers tied together and tossed over the wire: a very New York thing. */
export function Sneakers({ x, y }: { x: number; y: number }) {
  const shoe = (sx: number, sy: number, k: number) => (
    <G key={k}>
      <Path d={`M${sx} ${sy} C${sx - 2} ${sy + 12} ${sx - 6} ${sy + 18} ${sx - 14} ${sy + 22} H${sx + 10} C${sx + 12} ${sy + 14} ${sx + 10} ${sy + 6} ${sx + 8} ${sy} Z`} fill="#F7F3EC" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${sx - 14} ${sy + 22} H${sx + 10}`} stroke={colors.pink} strokeWidth={4} strokeLinecap="round" />
      <Path d={`M${sx} ${sy + 8} l6 -2 M${sx - 1} ${sy + 12} l6 -2`} stroke={colors.blue} strokeWidth={1.5} />
    </G>
  );
  return (
    <G>
      <Path d={`M${x - 10} ${y + 18} Q${x} ${y - 6} ${x + 12} ${y + 22}`} stroke={INK} strokeWidth={1.5} fill="none" />
      {shoe(x - 10, y + 18, 0)}
      {shoe(x + 16, y + 26, 1)}
    </G>
  );
}

/** A diamond kite high in the sky, its string trailing down out of the picture. */
export function Kite({ x, y, s, h }: { x: number; y: number; s: number; h: number }) {
  return (
    <G>
      <Path d={`M${x} ${y + s * 0.9} C${x + 20} ${y + s * 3} ${x - 30} ${y + s * 5} ${x + 10} ${h}`} stroke={INK} strokeWidth={1} fill="none" opacity={0.6} />
      <Path d={`M${x} ${y} L${x + s * 0.55} ${y + s * 0.4} L${x} ${y + s * 0.9} L${x - s * 0.55} ${y + s * 0.4} Z`} fill={colors.pink} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${x} ${y} V${y + s * 0.9} M${x - s * 0.55} ${y + s * 0.4} H${x + s * 0.55}`} stroke={INK} strokeWidth={1} />
      <Path d={`M${x} ${y} L${x + s * 0.55} ${y + s * 0.4} L${x} ${y + s * 0.4} Z`} fill={colors.yellow} />
      {[0, 1, 2].map((k) => <Path key={k} d={`M${x - 4 + (k % 2) * 8} ${y + s * (1.1 + k * 0.28)} l-5 4 l5 4 l5 -4 Z`} fill={k % 2 ? colors.blue : colors.yellow} stroke={INK} strokeWidth={0.8} />)}
    </G>
  );
}

/** A far-off flock: little "v" birds across the sky. */
export function FarFlock({ w, y, color }: { w: number; y: number; color: string }) {
  const birds: [number, number, number][] = [[0.18, 0, 9], [0.26, 10, 7], [0.33, 4, 8], [0.4, 16, 6], [0.62, -8, 7], [0.7, 4, 6]];
  return (
    <G>
      {birds.map(([x, dy, s], i) => <Path key={i} d={`M${w * x - s} ${y + dy} q${s / 2} ${-s / 2} ${s} 0 q${s / 2} ${-s / 2} ${s} 0`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />)}
    </G>
  );
}

// ---------------------------------------------------------------- the water

/** Lily pads with a couple of pink flowers, floating near the bank. */
export function LilyPads({ w, y }: { w: number; y: number }) {
  const pads: [number, number, number][] = [[0.12, 18, 18], [0.22, 34, 14], [0.84, 22, 16], [0.92, 44, 12], [0.7, 50, 12]];
  return (
    <G>
      {pads.map(([x, dy, r], i) => (
        <G key={i}>
          <Path d={`M${w * x} ${y + dy} L${w * x + r} ${y + dy - r * 0.18} A${r} ${r * 0.45} 0 1 1 ${w * x + r * 0.8} ${y + dy + r * 0.3} Z`} fill="#5FAE5E" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          {i % 2 === 0 && <Circle cx={w * x - r * 0.2} cy={y + dy - r * 0.2} r={r * 0.32} fill="#FFB3CB" stroke={INK} strokeWidth={1} />}
        </G>
      ))}
    </G>
  );
}

/** A little arched wooden footbridge across the far side of the pond. */
export function FootBridge({ w, y, period }: { w: number; y: number; period: Period }) {
  const wood = WOOD(period);
  const x1 = w * 0.18;
  const x2 = w * 0.58;
  const rise = 26;
  const deck = `M${x1} ${y} Q${(x1 + x2) / 2} ${y - rise * 2} ${x2} ${y}`;
  return (
    <G>
      <Path d={`${deck} L${x2} ${y + 7} Q${(x1 + x2) / 2} ${y - rise * 2 + 7} ${x1} ${y + 7} Z`} fill={wood} stroke={INK} strokeWidth={1.5} />
      <Path d={`M${x1} ${y - 14} Q${(x1 + x2) / 2} ${y - rise * 2 - 14} ${x2} ${y - 14}`} stroke={INK} strokeWidth={4} fill="none" />
      <Path d={`M${x1} ${y - 14} Q${(x1 + x2) / 2} ${y - rise * 2 - 14} ${x2} ${y - 14}`} stroke={wood} strokeWidth={2} fill="none" />
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 0.5) / 7;
        const px = x1 + (x2 - x1) * t;
        const py = y - rise * 2 * 2 * t * (1 - t);
        return <Path key={i} d={`M${px} ${py} V${py - 14}`} stroke={INK} strokeWidth={1.5} />;
      })}
    </G>
  );
}

/** An orange ferry crossing the river, far off. */
export function Ferry({ x, y, period }: { x: number; y: number; period: Period }) {
  const hull = dim(period, '#F28C28', '#C9702A', '#6A4030');
  const glass = period === 'dusk' || period === 'night' ? colors.yellow : '#BFD0F5';
  return (
    <G>
      <Path d={`M${x - 46} ${y - 12} H${x + 46} L${x + 38} ${y} H${x - 38} Z`} fill={hull} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={x - 32} y={y - 24} width={64} height={12} fill="#F7F3EC" stroke={INK} strokeWidth={1.2} />
      {Array.from({ length: 6 }, (_, i) => <Rect key={i} x={x - 28 + i * 10} y={y - 21} width={6} height={6} fill={glass} stroke={INK} strokeWidth={0.6} />)}
      <Rect x={x - 12} y={y - 32} width={24} height={8} fill="#F7F3EC" stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

/** A little red lighthouse on the far shore. */
export function Lighthouse({ x, base, period }: { x: number; base: number; period: Period }) {
  const red = dim(period, '#E5484D', '#B83A40', '#5A2A30');
  const lit = period === 'dusk' || period === 'night';
  return (
    <G>
      <Path d={`M${x - 10} ${base} L${x - 7} ${base - 46} H${x + 7} L${x + 10} ${base} Z`} fill={red} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={x - 8} y={base - 56} width={16} height={10} fill={lit ? colors.yellow : '#F7F3EC'} stroke={INK} strokeWidth={1.2} />
      <Path d={`M${x - 10} ${base - 56} L${x} ${base - 66} L${x + 10} ${base - 56} Z`} fill={red} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      {lit && <Path d={`M${x + 10} ${base - 51} L${x + 40} ${base - 58} V${base - 44} Z`} fill={colors.yellow} opacity={0.5} />}
    </G>
  );
}

/** A tall white lifeguard chair on the sand, at the right. */
export function LifeguardChair({ x, base, bh, period }: { x: number; base: number; bh: number; period: Period }) {
  const white = dim(period, '#F7F3EC', '#D9D0C8', '#7A7A8A');
  const top = base - bh * 0.7;
  return (
    <G>
      <Path d={`M${x - 18} ${base} L${x - 10} ${top} M${x + 18} ${base} L${x + 10} ${top} M${x - 15} ${base - bh * 0.25} H${x + 15} M${x - 13} ${base - bh * 0.45} H${x + 13}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <Path d={`M${x - 18} ${base} L${x - 10} ${top} M${x + 18} ${base} L${x + 10} ${top} M${x - 15} ${base - bh * 0.25} H${x + 15} M${x - 13} ${base - bh * 0.45} H${x + 13}`} stroke={white} strokeWidth={3.5} strokeLinecap="round" />
      <Rect x={x - 16} y={top - 6} width={32} height={8} fill={white} stroke={INK} strokeWidth={1.2} />
      <Rect x={x - 12} y={top - 24} width={24} height={18} fill={colors.pink} stroke={INK} strokeWidth={1.2} />
      <Path d={`M${x - 4} ${top - 20} h8 M${x} ${top - 24} v8`} stroke="#FFFFFF" strokeWidth={2.5} />
    </G>
  );
}

/** A silvery driftwood log lying on the sand. */
export function Driftwood({ x, y, bh }: { x: number; y: number; bh: number }) {
  const len = bh * 0.6;
  return (
    <G>
      <Path d={`M${x} ${y} C${x + len * 0.3} ${y - 8} ${x + len * 0.7} ${y - 4} ${x + len} ${y - 10} L${x + len + 4} ${y + 4} C${x + len * 0.7} ${y + 10} ${x + len * 0.3} ${y + 12} ${x} ${y + 12} Z`} fill="#D9CBB8" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${x + len * 0.15} ${y + 4} q${len * 0.2} -4 ${len * 0.4} 0 M${x + len * 0.55} ${y + 2} q${len * 0.15} -3 ${len * 0.3} 0`} stroke="#A39478" strokeWidth={1.5} fill="none" />
      <Path d={`M${x + len * 0.7} ${y - 4} l10 -16`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Path d={`M${x + len * 0.7} ${y - 4} l10 -16`} stroke="#D9CBB8" strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

/** A little blue rowboat tied up beside the pier. */
export function Rowboat({ x, y, period }: { x: number; y: number; period: Period }) {
  const hull = dim(period, '#2F5BEA', '#2448B8', '#1A2A60');
  return (
    <G>
      <Path d={`M${x - 44} ${y - 14} H${x + 44} C${x + 38} ${y} ${x + 24} ${y + 6} ${x} ${y + 6} C${x - 24} ${y + 6} ${x - 38} ${y} ${x - 44} ${y - 14} Z`} fill={hull} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${x - 44} ${y - 14} H${x + 44}`} stroke="#F7F3EC" strokeWidth={4} />
      <Path d={`M${x - 10} ${y - 14} L${x + 26} ${y - 30}`} stroke={WOOD(period)} strokeWidth={4} strokeLinecap="round" />
      <Path d={`M${x + 44} ${y - 14} q16 -10 26 -26`} stroke="#E8D7B4" strokeWidth={2} fill="none" />
    </G>
  );
}

/** A plank boardwalk running through the marsh. */
export function Boardwalk({ w, y, period }: { w: number; y: number; period: Period }) {
  const wood = WOOD(period);
  return (
    <G>
      <Path d={`M0 ${y} L${w} ${y - 20} L${w} ${y - 4} L0 ${y + 16} Z`} fill={wood} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: 14 }, (_, i) => <Path key={i} d={`M${(w / 14) * i} ${y + 16 - (20 * i) / 14} l0 -16`} stroke={INK} strokeWidth={1} opacity={0.6} />)}
      {[0.1, 0.4, 0.7, 0.95].map((f, i) => <Path key={`p${i}`} d={`M${w * f} ${y + 16 - 20 * f} V${y + 34 - 20 * f}`} stroke={INK} strokeWidth={4} />)}
    </G>
  );
}

// ---------------------------------------------------------------- upstairs and in the trees

/** A laundry line strung across the fire escape: a few little things drying in the breeze. */
export function LaundryLine({ w, y }: { w: number; y: number }) {
  const pieces: [number, string, 'shirt' | 'sock'][] = [[0.22, colors.pink, 'shirt'], [0.38, colors.yellow, 'sock'], [0.5, colors.blue, 'shirt'], [0.66, '#FFFFFF', 'sock'], [0.78, colors.pink, 'sock']];
  return (
    <G>
      <Path d={`M${w * 0.1} ${y} Q${w * 0.5} ${y + 16} ${w * 0.9} ${y}`} stroke={INK} strokeWidth={1.2} fill="none" />
      {pieces.map(([f, c, kind], i) => {
        const x = w * f;
        const top = y + 16 * 4 * f * (1 - f) * 0.9;
        return kind === 'shirt' ? (
          <Path key={i} d={`M${x - 12} ${top} H${x + 12} L${x + 18} ${top + 8} L${x + 12} ${top + 11} V${top + 26} H${x - 12} V${top + 11} L${x - 18} ${top + 8} Z`} fill={c} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        ) : (
          <Path key={i} d={`M${x - 4} ${top} H${x + 4} V${top + 14} L${x + 10} ${top + 18} L${x + 6} ${top + 24} L${x - 4} ${top + 18} Z`} fill={c} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        );
      })}
    </G>
  );
}

/** A string of warm little lights looped along the fire escape railing. */
export function StringLights({ w, y, period }: { w: number; y: number; period: Period }) {
  const on = period === 'dusk' || period === 'night';
  const n = 11;
  return (
    <G>
      <Path d={Array.from({ length: 4 }, (_, i) => `${i ? '' : `M${w * 0.04} ${y}`} Q${w * (0.04 + 0.23 * (i + 0.5))} ${y + 14} ${w * (0.04 + 0.23 * (i + 1))} ${y}`).join(' ')} stroke={INK} strokeWidth={1} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const f = (i + 0.5) / n;
        const seg = (f * 4) % 1;
        const x = w * (0.04 + 0.92 * f);
        const ly = y + 14 * 4 * seg * (1 - seg) * 0.5 + 4;
        return <Circle key={i} cx={x} cy={ly} r={3.5} fill={on ? colors.yellow : '#F7F3EC'} stroke={INK} strokeWidth={0.8} />;
      })}
    </G>
  );
}

/** A little cluster of red-capped mushrooms at the foot of a tree. */
export function Mushrooms({ x, y }: { x: number; y: number }) {
  const caps: [number, number, number][] = [[0, 0, 12], [18, 4, 9], [-14, 6, 7]];
  return (
    <G>
      {caps.map(([dx, dy, r], i) => (
        <G key={i}>
          <Rect x={x + dx - r * 0.3} y={y + dy - r * 0.6} width={r * 0.6} height={r * 1.1} rx={2} fill="#F7F3EC" stroke={INK} strokeWidth={1} />
          <Path d={`M${x + dx - r} ${y + dy - r * 0.5} A${r} ${r * 0.8} 0 0 1 ${x + dx + r} ${y + dy - r * 0.5} Z`} fill="#E5484D" stroke={INK} strokeWidth={1.2} />
          <Circle cx={x + dx - r * 0.35} cy={y + dy - r * 0.85} r={r * 0.16} fill="#FFFFFF" />
          <Circle cx={x + dx + r * 0.3} cy={y + dy - r * 0.75} r={r * 0.12} fill="#FFFFFF" />
        </G>
      ))}
    </G>
  );
}

/** Shelf mushrooms stepping up a trunk. */
export function ShelfFungus({ x, y }: { x: number; y: number }) {
  return (
    <G>
      {[0, 1, 2].map((k) => (
        <Path key={k} d={`M${x} ${y - k * 18} q${16 - k * 3} -2 ${24 - k * 4} 6 q-${12 - k * 2} 5 -${24 - k * 4} 1 Z`} fill={k % 2 ? '#E8C27A' : '#D9954F'} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      ))}
    </G>
  );
}

/** Birch markings over a trunk: pale bark with dark dashes. */
export function BirchBark({ x, w, h, seed = 0 }: { x: number; w: number; h: number; seed?: number }) {
  return (
    <G>
      <Rect x={x} y={0} width={w} height={h} fill="#EEE9E0" />
      <Path d={`M${x} 0 V${h} M${x + w} 0 V${h}`} stroke={INK} strokeWidth={2} />
      {Array.from({ length: Math.ceil(h / 34) }, (_, i) => {
        const y = i * 34 + ((i * 13 + seed) % 20);
        const from = x + (((i * 37 + seed) % 60) / 100) * w;
        return <Path key={i} d={`M${from} ${y} h${w * 0.25}`} stroke="#3B3A50" strokeWidth={4} strokeLinecap="round" />;
      })}
    </G>
  );
}

/**
 * A rooftop beehive: a stack of white wooden boxes on a stand, a little roof, and the
 * landing board at the entrance (where the bees stand), the city's rooftops behind.
 */
export function Beehive({ w, h, y, bh, period }: { w: number; h: number; y: number; bh: number; period: Period }) {
  const white = dim(period, '#F7F3EC', '#D9D0C8', '#6E6A7A');
  const shade = dim(period, '#E3DACB', '#B3ABA0', '#55546A');
  const roof = dim(period, '#E5484D', '#B83A40', '#5A2A30');
  const roofTop = dim(period, '#B8B2C2', '#8E88A0', '#3E3A50');
  const glow = period === 'night' || period === 'dusk';
  const hw = w * 0.56;
  const hx = w * 0.5 - hw / 2;
  const box = bh * 0.3;
  const bottom = y - 4;
  return (
    <G>
      {/* The roof the hive sits on, and its parapet. */}
      <Rect x={0} y={y + bh * 0.12} width={w} height={h} fill={roofTop} />
      <Rect x={-4} y={y + bh * 0.1} width={w + 8} height={10} fill={shade} stroke={INK} strokeWidth={1.2} />
      {/* The stand. */}
      <Path d={`M${hx + 10} ${bottom + 10} V${y + bh * 0.12} M${hx + hw - 10} ${bottom + 10} V${y + bh * 0.12}`} stroke={INK} strokeWidth={5} />
      {/* Two boxes, each with a handhold, then the roof. */}
      {[0, 1].map((k) => {
        const top = bottom - box * (k + 1);
        return (
          <G key={k}>
            <Rect x={hx} y={top} width={hw} height={box} fill={white} stroke={INK} strokeWidth={1.5} />
            <Path d={`M${hx + hw * 0.4} ${top + box * 0.35} h${hw * 0.2}`} stroke={shade} strokeWidth={5} strokeLinecap="round" />
          </G>
        );
      })}
      <Rect x={hx - 8} y={bottom - box * 2 - 14} width={hw + 16} height={14} fill={roof} stroke={INK} strokeWidth={1.5} />
      {/* The entrance slot, warm inside, and the landing board. */}
      <Rect x={hx + hw * 0.25} y={bottom - 12} width={hw * 0.5} height={8} rx={2} fill={glow ? '#FFD23F' : INK} stroke={INK} strokeWidth={1} />
      <Path d={`M${hx + hw * 0.18} ${bottom} H${hx + hw * 0.82} L${hx + hw * 0.88} ${bottom + 10} H${hx + hw * 0.12} Z`} fill={shade} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      {/* A pot of flowers on the roof beside the hive. */}
      <Path d={`M${w * 0.06} ${y + bh * 0.1} h26 l-4 -22 h-18 Z`} fill="#E07A4A" stroke={INK} strokeWidth={1.2} />
      {[-7, 0, 7].map((dx, k) => <Circle key={k} cx={w * 0.06 + 13 + dx} cy={y + bh * 0.1 - 28 - (k === 1 ? 5 : 0)} r={5.5} fill={k === 1 ? colors.yellow : colors.pink} stroke={INK} strokeWidth={1} />)}
    </G>
  );
}
