// The motion engine for story backdrops. A backdrop is a list of layers; each layer
// is a drawing plus how it moves and how far away it is. MovingLayer runs one slow
// loop per layer on the native thread and shifts it a little with the phone's tilt
// (far layers less, near layers more), which gives the scene depth.
// With iOS "Reduce Motion" on, nothing moves and tilt is ignored.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import Svg from 'react-native-svg';

export type Motion =
  | { kind: 'still' }
  /** Travels a full screen width to the right and wraps around. */
  | { kind: 'travelX'; duration: number }
  /** Falls a full screen height and wraps around, swaying sideways as it goes. */
  | { kind: 'fall'; duration: number; sway: number }
  /** Sways from the bottom edge, like plants in a breeze. */
  | { kind: 'sway'; duration: number; deg: number }
  /** Drifts back and forth by (dx, dy). */
  | { kind: 'bob'; duration: number; dx: number; dy: number }
  /** Fades between `min` and full. */
  | { kind: 'pulse'; duration: number; min: number }
  /** Turns all the way round a point. */
  | { kind: 'spin'; duration: number; cx: number; cy: number }
  /** Every `every` ms, streaks by (dx, dy) and fades out (a shooting star). */
  | { kind: 'flash'; every: number; duration: number; dx: number; dy: number };

export type Layer = {
  id: string;
  node: ReactNode;
  motion: Motion;
  /** 0 = far (barely shifts with tilt) … 1 = near (shifts most). */
  depth: number;
  opacity?: number;
};

export type Tilt = { x: Animated.Value; y: Animated.Value };

const TILT_SHIFT = 16; // px at depth 1

export function MovingLayer({ layer, width, height, still, tilt }: { layer: Layer; width: number; height: number; still: boolean; tilt: Tilt }) {
  const t = useMotionValue(layer.motion, still);
  const { motion } = layer;

  const svg = (extra?: object) => (
    <Svg width={width} height={height} style={[StyleSheet.absoluteFill, extra]}>
      {layer.node}
    </Svg>
  );

  let motionStyle: object = {};
  let content: ReactNode = svg();
  switch (motion.kind) {
    case 'travelX':
      // Two copies side by side; sliding right by one width brings the left copy to
      // where the first started, so the loop restarts without a jump.
      motionStyle = { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) }] };
      content = <>{svg()}{svg({ left: -width })}</>;
      break;
    case 'fall':
      motionStyle = {
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) },
          { translateX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, motion.sway, 0, -motion.sway, 0] }) },
        ],
      };
      content = <>{svg()}{svg({ top: -height })}</>;
      break;
    case 'sway':
      motionStyle = { transformOrigin: 'bottom', transform: [{ skewX: t.interpolate({ inputRange: [0, 1], outputRange: [`${-motion.deg}deg`, `${motion.deg}deg`] }) }] };
      break;
    case 'bob':
      motionStyle = {
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-motion.dx, motion.dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-motion.dy, motion.dy] }) },
        ],
      };
      break;
    case 'pulse':
      motionStyle = { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [motion.min, 1] }) };
      break;
    case 'spin':
      motionStyle = {
        transformOrigin: `${motion.cx}px ${motion.cy}px`,
        transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      };
      break;
    case 'flash':
      motionStyle = {
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, motion.dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, motion.dy] }) },
        ],
      };
      break;
  }

  const shift = layer.depth * TILT_SHIFT;
  const tiltStyle = still
    ? {}
    : {
        transform: [
          { translateX: Animated.multiply(tilt.x, shift) },
          { translateY: Animated.multiply(tilt.y, shift * 0.6) },
        ],
      };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: layer.opacity ?? 1 }, tiltStyle]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, motionStyle]} pointerEvents="none">
        {content}
      </Animated.View>
    </Animated.View>
  );
}

function useMotionValue(motion: Motion, still: boolean): Animated.Value {
  const value = useRef(new Animated.Value(0.5)).current;
  const key = JSON.stringify(motion);
  useEffect(() => {
    if (motion.kind === 'still') return;
    const resting = motion.kind === 'travelX' || motion.kind === 'fall' || motion.kind === 'spin' ? 0 : motion.kind === 'flash' ? 0 : 0.5;
    value.setValue(resting);
    if (still) {
      // A shooting star just doesn't appear; everything else holds its place.
      return;
    }
    const native = { useNativeDriver: true };
    let anim: Animated.CompositeAnimation;
    if (motion.kind === 'travelX' || motion.kind === 'fall' || motion.kind === 'spin') {
      value.setValue(0);
      anim = Animated.loop(Animated.timing(value, { toValue: 1, duration: motion.duration, easing: Easing.linear, ...native }));
    } else if (motion.kind === 'flash') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.delay(motion.every),
          Animated.timing(value, { toValue: 1, duration: motion.duration, easing: Easing.out(Easing.quad), ...native }),
          Animated.timing(value, { toValue: 0, duration: 0, ...native }),
        ]),
      );
    } else {
      const half = { duration: motion.duration / 2, easing: Easing.inOut(Easing.sin), ...native };
      anim = Animated.loop(Animated.sequence([Animated.timing(value, { ...half, toValue: 1 }), Animated.timing(value, { ...half, toValue: 0 })]));
    }
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, still, value]);
  return value;
}

/** True when the person has asked their phone to reduce motion. */
export function useReduceMotion(): boolean {
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

/** How the phone is tilted, as -1…1 on each axis (0 when unknown or motion is reduced). */
export function useTilt(still: boolean): Tilt {
  const tilt = useRef<Tilt>({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
  useEffect(() => {
    if (still) return;
    let sub: { remove: () => void } | undefined;
    let cancelled = false;
    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        DeviceMotion.setUpdateInterval(60);
        sub = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const clamp = (v: number) => Math.max(-1, Math.min(1, v));
          // gamma: left/right tilt; beta: forward/back, ~0.8 rad when held to read.
          tilt.x.setValue(clamp(rotation.gamma / 0.5));
          tilt.y.setValue(clamp((rotation.beta - 0.8) / 0.5));
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
      tilt.x.setValue(0);
      tilt.y.setValue(0);
    };
  }, [still, tilt]);
  return tilt;
}
