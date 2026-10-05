// PLACEHOLDER ART. The whole-screen background behind a story: the moment's setting
// (a branch, a streetlight, the water...) drawn to fill any screen shape, gently
// animated. Positions are fractions of the width/height and sizes scale with the
// shorter side, so it fits a phone and a wide browser without cropping or squashing.
//
// Each backdrop is split into layers. The base stays still; the others each get one
// slow looping animation on the native thread: clouds drift, plants sway, waves roll,
// the lamp glows, stars twinkle. With iOS "Reduce Motion" on, nothing moves.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Period, Setting } from '@/content/types';
import { inks } from './inks';

const INK = inks.ink;

type Box = { w: number; h: number; u: number };

/** What a setting draws, by how it moves. */
type Layers = {
  base?: ReactNode;
  /** Travels all the way across and wraps around (clouds). Drawn for one screen width. */
  drift?: ReactNode;
  /** Sways from the bottom, like plants in a breeze. */
  sway?: ReactNode;
  /** Rolls steadily in one direction and wraps around (water). */
  waves?: ReactNode;
  /** Bobs side to side (a wire in the wind). */
  bob?: ReactNode;
  /** Pulses softly (lamp light). */
  glow?: ReactNode;
  /** Twinkles (stars). */
  twinkle?: ReactNode;
};

export function StoryBackdrop({ setting, period, width, height }: { setting: Setting; period: Period; width: number; height: number }) {
  const b: Box = { w: width, h: height, u: Math.min(width, height) / 100 };
  const dark = period === 'dusk' || period === 'night';
  const sky = skyLayers(b, period, setting);
  const scene = draw(setting, b);
  const layers: Layers = {
    base: <>{sky.base}{scene.base}</>,
    drift: sky.drift,
    sway: scene.sway,
    waves: scene.waves,
    bob: scene.bob,
    glow: scene.glow,
    twinkle: sky.twinkle,
  };

  const still = useReduceMotion();
  const drift = useCycle(70000, still);
  const waves = useCycle(9000, still);
  const sway = useLoop(3200, still);
  const bob = useLoop(2600, still);
  const glow = useLoop(2400, still);
  const twinkle = useLoop(1800, still);

  const layer = (node: ReactNode, style: object) =>
    node ? (
      <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
        <Svg width={width} height={height}>{node}</Svg>
      </Animated.View>
    ) : null;

  // A layer that travels a full screen width and wraps: two copies side by side, the
  // second a screen to the left, both sliding right by one screen, then repeating.
  // When the loop restarts, the copies have swapped places, so there's no jump.
  const travelling = (node: ReactNode, value: Animated.Value) =>
    node ? (
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) }] }]}
        pointerEvents="none"
      >
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{node}</Svg>
        <Svg width={width} height={height} style={[StyleSheet.absoluteFill, { left: -width }]}>{node}</Svg>
      </Animated.View>
    ) : null;

  return (
    <View style={[StyleSheet.absoluteFill, { opacity: dark ? 0.5 : 0.75 }]} pointerEvents="none">
      {layer(layers.base, {})}
      {travelling(layers.drift, drift)}
      {layer(layers.glow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) })}
      {layer(layers.twinkle, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) })}
      {travelling(layers.waves, waves)}
      {layer(layers.bob, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-1.2 * b.u, 1.2 * b.u] }) }] })}
      {layer(layers.sway, {
        transformOrigin: 'bottom',
        transform: [{ skewX: sway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) }],
      })}
    </View>
  );
}

/** A value that eases 0 → 1 → 0 forever. Holds still at 0.5 when motion is reduced. */
function useLoop(duration: number, still: boolean): Animated.Value {
  const value = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (still) {
      value.setValue(0.5);
      return;
    }
    const half = { duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(value, { ...half, toValue: 1 }), Animated.timing(value, { ...half, toValue: 0 })]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, still, value]);
  return value;
}

/** A value that runs 0 → 1 at a steady pace, then starts over, forever. Still when
 * motion is reduced. */
function useCycle(duration: number, still: boolean): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    if (still) return;
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [duration, still, value]);
  return value;
}

/** True when the person has asked their phone to reduce motion. */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setReduce(on)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** Clouds by day, a moon and stars at night, kept to the sides of the photo. */
function skyLayers({ w, h, u }: Box, period: Period, setting: Setting): Pick<Layers, 'base' | 'drift' | 'twinkle'> {
  if (period === 'night' || setting === 'night-sky') {
    return {
      base: <Path d={`M${w * 0.9} ${h * 0.3} a${8 * u} ${8 * u} 0 1 1 ${-7 * u} ${11 * u} a${6 * u} ${6 * u} 0 0 0 ${7 * u} ${-11 * u} Z`} fill={inks.yellow} />,
      twinkle: (
        <G>
          {[[0.08, 0.3], [0.14, 0.42], [0.05, 0.52], [0.94, 0.48], [0.88, 0.56], [0.96, 0.24]].map(([x, y]) => (
            <Circle key={`${x}${y}`} cx={w * x} cy={h * y} r={1.2 * u} fill={inks.yellow} />
          ))}
        </G>
      ),
    };
  }
  return {
    drift: (
      <G>
        {cloud(w * 0.1, h * 0.3, u, 0.9)}
        {cloud(w * 0.5, h * 0.24, u, 0.6)}
        {cloud(w * 0.82, h * 0.44, u, 0.75)}
      </G>
    ),
  };
}

function cloud(x: number, y: number, u: number, s: number) {
  const r = 7 * u * s;
  return (
    <G key={`${x}${y}`}>
      <Circle cx={x} cy={y} r={r} fill={inks.white} />
      <Circle cx={x + r * 1.1} cy={y + r * 0.2} r={r * 0.8} fill={inks.white} />
      <Circle cx={x - r * 1.1} cy={y + r * 0.3} r={r * 0.7} fill={inks.white} />
      <Rect x={x - r * 1.8} y={y + r * 0.3} width={r * 3.6} height={r * 0.7} rx={r * 0.35} fill={inks.white} />
    </G>
  );
}

function ground({ w, h }: Box, color: string, top = 0.86) {
  return <Rect x={0} y={h * top} width={w} height={h * (1 - top)} fill={color} />;
}

function tufts({ w, h, u }: Box, top: number, xs: number[]) {
  return (
    <G>
      {xs.map((x) => (
        <Path key={x} d={`M${w * x} ${h * top} l${-u} ${-3 * u} M${w * x + 2 * u} ${h * top} l${u} ${-3.5 * u}`} stroke={inks.green} strokeWidth={0.8 * u} strokeLinecap="round" />
      ))}
    </G>
  );
}

function wavelets({ w, h, u }: Box, rows: number[]) {
  return (
    <G>
      {rows.map((y, i) => (
        <G key={y}>
          {[0.08, 0.38, 0.68].map((x) => (
            <Path key={x} d={`M${w * (x + i * 0.1)} ${h * y} q${4 * u} ${-2 * u} ${8 * u} 0 t${8 * u} 0`} stroke={inks.white} strokeWidth={0.8 * u} fill="none" strokeLinecap="round" />
          ))}
        </G>
      ))}
    </G>
  );
}

function draw(setting: Setting, b: Box): Layers {
  const { w, h, u } = b;
  switch (setting) {
    case 'branch':
      return {
        base: (
          <G>
            <Path d={`M${-w * 0.05} ${h * 0.5} Q${w * 0.35} ${h * 0.42} ${w * 0.7} ${h * 0.47}`} stroke={inks.brown} strokeWidth={5 * u} strokeLinecap="round" fill="none" />
            <Path d={`M${w * 0.45} ${h * 0.45} Q${w * 0.55} ${h * 0.36} ${w * 0.64} ${h * 0.35}`} stroke={inks.brown} strokeWidth={2.5 * u} strokeLinecap="round" fill="none" />
          </G>
        ),
        sway: (
          <G>
            {[[0.66, 0.34, 7], [0.72, 0.44, 6], [0.08, 0.47, 5], [0.28, 0.42, 4]].map(([x, y, r]) => (
              <Circle key={`${x}${y}`} cx={w * x} cy={h * y} r={r * u} fill={inks.green} />
            ))}
          </G>
        ),
      };
    case 'trunk':
      return {
        base: (
          <G>
            <Rect x={w * 0.84} y={0} width={w * 0.16} height={h} fill={inks.brown} />
            {[0.1, 0.32, 0.55, 0.78].map((y) => (
              <Path key={y} d={`M${w * 0.9} ${h * y} l0 ${h * 0.08}`} stroke={INK} strokeWidth={0.8 * u} opacity={0.4} strokeLinecap="round" />
            ))}
            {ground(b, inks.green)}
          </G>
        ),
        sway: tufts(b, 0.86, [0.08, 0.3, 0.55]),
      };
    case 'den':
      return {
        base: (
          <G>
            <Rect x={0} y={0} width={w * 0.12} height={h} fill={inks.brown} />
            <Rect x={w * 0.88} y={0} width={w * 0.12} height={h} fill={inks.brown} />
            <Ellipse cx={w / 2} cy={h * 0.36} rx={30 * u} ry={26 * u} fill={inks.brown} />
            <Ellipse cx={w / 2} cy={h * 0.37} rx={24 * u} ry={20 * u} fill={INK} opacity={0.6} />
          </G>
        ),
      };
    case 'wire':
      return {
        base: (
          <G>
            <Rect x={w * 0.92} y={h * 0.3} width={3 * u} height={h * 0.7} fill={inks.brown} />
            <Rect x={w * 0.88} y={h * 0.34} width={10 * u} height={1.6 * u} fill={inks.brown} />
          </G>
        ),
        // The wire bobs a little in the wind.
        bob: <Path d={`M0 ${h * 0.46} Q${w / 2} ${h * 0.52} ${w} ${h * 0.44}`} stroke={INK} strokeWidth={1.2 * u} fill="none" />,
      };
    case 'ledge':
    case 'rooftop':
      return {
        base: (
          <G>
            <Rect x={0} y={h * 0.5} width={w} height={h * 0.5} fill={inks.pinkTint} />
            <Rect x={0} y={h * 0.49} width={w} height={2.4 * u} fill={setting === 'ledge' ? inks.lightGray : inks.gray} stroke={INK} strokeWidth={0.4 * u} />
            {[0.1, 0.3, 0.62, 0.82].map((x) => (
              <Rect key={x} x={w * x} y={h * 0.58} width={9 * u} height={13 * u} fill={inks.blue} opacity={0.4} />
            ))}
            {setting === 'rooftop' && <Rect x={w * 0.78} y={h * 0.4} width={8 * u} height={h * 0.09} fill={inks.red} opacity={0.8} />}
          </G>
        ),
      };
    case 'streetlight':
      return {
        glow: <Circle cx={w * 0.22} cy={h * 0.2} r={18 * u} fill={inks.yellow} opacity={0.45} />,
        base: (
          <G>
            <Path d={`M${w * 0.06} ${h} L${w * 0.06} ${h * 0.18} Q${w * 0.06} ${h * 0.14} ${w * 0.2} ${h * 0.14}`} stroke={INK} strokeWidth={2 * u} fill="none" />
            <Circle cx={w * 0.21} cy={h * 0.17} r={3.2 * u} fill={inks.yellow} stroke={INK} strokeWidth={0.6 * u} />
            {ground(b, inks.lightGray, 0.9)}
          </G>
        ),
      };
    case 'lawn':
      return { base: ground(b, inks.green, 0.84), sway: tufts(b, 0.84, [0.08, 0.2, 0.42, 0.66, 0.9]) };
    case 'sidewalk':
      return {
        base: (
          <G>
            {ground(b, inks.lightGray, 0.86)}
            {[0.25, 0.6, 0.9].map((x) => <Path key={x} d={`M${w * x} ${h * 0.86} L${w * x} ${h}`} stroke={INK} strokeWidth={0.4 * u} opacity={0.4} />)}
          </G>
        ),
      };
    case 'hedge': {
      const n = Math.max(4, Math.round(w / (14 * u)));
      const bumps = Array.from({ length: n + 1 }, (_, i) => `Q${(i - 0.5) * (w / n)} ${h * 0.78} ${i * (w / n)} ${h * 0.84}`).join(' ');
      return {
        base: <Rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill={inks.green} />,
        sway: <Path d={`M0 ${h} L0 ${h * 0.84} ${bumps} L${w} ${h} Z`} fill={inks.green} />,
      };
    }
    case 'flowers':
      return {
        base: ground(b, inks.green, 0.92),
        sway: (
          <G>
            {[0.06, 0.16, 0.3, 0.7, 0.84, 0.95].map((x, i) => {
              const top = h * (0.82 - (i % 2) * 0.04);
              return (
                <G key={x}>
                  <Path d={`M${w * x} ${h} L${w * x} ${top}`} stroke={inks.green} strokeWidth={0.8 * u} />
                  <Circle cx={w * x} cy={top} r={3 * u} fill={i % 2 ? inks.yellow : inks.pink} />
                  <Circle cx={w * x} cy={top} r={1.1 * u} fill={i % 2 ? inks.pink : inks.yellow} />
                </G>
              );
            })}
          </G>
        ),
      };
    case 'water':
      return { base: ground(b, inks.blue, 0.8), waves: wavelets(b, [0.86, 0.9, 0.95]) };
    case 'shore':
      return {
        base: (
          <G>
            {ground(b, inks.blue, 0.78)}
            <Path d={`M0 ${h * 0.88} Q${w * 0.3} ${h * 0.85} ${w * 0.6} ${h * 0.89} T${w} ${h * 0.87} L${w} ${h} L0 ${h} Z`} fill={inks.tan} />
          </G>
        ),
        waves: wavelets(b, [0.82]),
      };
    case 'pier':
      return {
        base: (
          <G>
            {ground(b, inks.blue, 0.84)}
            <Rect x={0} y={h * 0.8} width={w} height={2.4 * u} fill={inks.brown} stroke={INK} strokeWidth={0.4 * u} />
            {[0.1, 0.35, 0.6, 0.85].map((x) => <Rect key={x} x={w * x} y={h * 0.8} width={2.4 * u} height={h * 0.2} fill={inks.brown} />)}
            <Path d={`M0 ${h * 0.74} L${w} ${h * 0.74}`} stroke={INK} strokeWidth={0.8 * u} />
            {[0.05, 0.3, 0.55, 0.8].map((x) => <Path key={x} d={`M${w * x} ${h * 0.74} L${w * x} ${h * 0.8}`} stroke={INK} strokeWidth={0.6 * u} />)}
          </G>
        ),
        waves: wavelets(b, [0.9, 0.96]),
      };
    case 'reeds':
      return {
        base: ground(b, inks.blue, 0.9),
        waves: wavelets(b, [0.95]),
        sway: (
          <G>
            {[0.03, 0.08, 0.13, 0.86, 0.91, 0.96].map((x, i) => (
              <G key={x}>
                <Path d={`M${w * x} ${h} L${w * x + u} ${h * (0.7 - (i % 3) * 0.03)}`} stroke={inks.green} strokeWidth={0.8 * u} />
                <Rect x={w * x - 0.4 * u} y={h * (0.7 - (i % 3) * 0.03)} width={2.4 * u} height={6 * u} rx={1.2 * u} fill={inks.brown} />
              </G>
            ))}
          </G>
        ),
      };
    case 'fence':
      return {
        base: (
          <G>
            {ground(b, inks.green, 0.92)}
            <Rect x={0} y={h * 0.84} width={w} height={1.4 * u} fill={inks.white} stroke={INK} strokeWidth={0.3 * u} />
            {Array.from({ length: Math.ceil(w / (8 * u)) }, (_, i) => (
              <Rect key={i} x={i * 8 * u} y={h * 0.78} width={4 * u} height={h * 0.16} fill={inks.white} stroke={INK} strokeWidth={0.3 * u} />
            ))}
          </G>
        ),
        sway: tufts(b, 0.92, [0.04, 0.27, 0.52, 0.77]),
      };
    case 'trashcan':
      return {
        base: (
          <G>
            {ground(b, inks.lightGray, 0.88)}
            <Rect x={w * 0.86} y={h * 0.74} width={11 * u} height={h * 0.15} rx={u} fill={inks.gray} stroke={INK} strokeWidth={0.5 * u} />
            <Rect x={w * 0.86 - u} y={h * 0.72} width={13 * u} height={2.2 * u} rx={u} fill={INK} />
          </G>
        ),
      };
    case 'web': {
      const cx = w / 2;
      const cy = h * 0.36;
      // The web shivers gently, like there's a breeze.
      return {
        sway: (
          <G opacity={0.6}>
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <Path key={a} d={`M${cx} ${cy - 45 * u} L${cx} ${cy + 45 * u}`} stroke={INK} strokeWidth={0.3 * u} transform={`rotate(${a} ${cx} ${cy})`} />
            ))}
            {[14, 24, 34, 44].map((r) => <Circle key={r} cx={cx} cy={cy} r={r * u} stroke={INK} strokeWidth={0.3 * u} fill="none" />)}
          </G>
        ),
      };
    }
    case 'sky':
    case 'night-sky':
    default:
      return {};
  }
}
