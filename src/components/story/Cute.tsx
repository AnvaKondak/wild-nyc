// Little bits of joy for the favorites story: each favorite pops in with a springy
// wiggle, and a few hearts float up around them. Both hold still when the person has
// asked their phone to reduce motion.

import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useReduceMotion } from '../backdrop/motion';
import { HeartIcon } from '../Icons';
import { colors } from '@/theme/tokens';

/** Springs in from a little smaller, with a happy wiggle. Remount (new `key`) to replay. */
export function PopIn({ children }: { children: ReactNode }) {
  const still = useReduceMotion();
  const t = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    Animated.spring(t, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  }, [still, t]);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const rotate = t.interpolate({ inputRange: [0, 0.5, 0.8, 1], outputRange: ['-8deg', '6deg', '-2deg', '0deg'] });
  return <Animated.View style={{ opacity: t.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale }, { rotate }] }}>{children}</Animated.View>;
}

const HEARTS = [
  { x: -0.08, delay: 0, size: 18, drift: -10 },
  { x: 0.92, delay: 900, size: 14, drift: 12 },
  { x: 0.2, delay: 1700, size: 12, drift: -6 },
  { x: 0.75, delay: 2500, size: 16, drift: 8 },
];

/** A few small hearts drifting up around a sticker of `size`, slowly, on a loop. */
export function RisingHearts({ size }: { size: number }) {
  const still = useReduceMotion();
  if (still) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
      {HEARTS.map((h, i) => (
        <FloatingHeart key={i} {...h} box={size} />
      ))}
    </View>
  );
}

function FloatingHeart({ x, delay, size, drift, box }: { x: number; delay: number; size: number; drift: number; box: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, t]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: box * x,
        top: box * 0.55,
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -box * 0.6] }) },
          { translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, drift, 0] }) },
          { scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1, 0.8] }) },
        ],
      }}
    >
      <HeartIcon size={size} color={colors.ink} fill={colors.pink} strokeWidth={2} />
    </Animated.View>
  );
}
