// Neighbors' stickers floating gently over a scene: the welcome's first page and the
// home screen.

import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { getSpecies, speciesPhoto } from '@/content';
import { colors } from '@/theme/tokens';
import { useReduceMotion } from './backdrop/motion';
import { Sticker } from './Sticker';

const SPOTS = [
  { left: '6%', top: 40, size: 112, rotate: -8 },
  { left: '36%', top: 0, size: 104, rotate: 6 },
  { left: '64%', top: 46, size: 108, rotate: -4 },
  { left: '16%', top: 140, size: 96, rotate: 9 },
  { left: '52%', top: 146, size: 92, rotate: -6 },
] as const;

/** Up to five neighbors' stickers bobbing gently, each at their own pace. `scale` shrinks the whole group. */
export function FloatingCast({ ids, scale = 1 }: { ids: string[]; scale?: number }) {
  const still = useReduceMotion();
  return (
    <>
      {ids.slice(0, SPOTS.length).map((id, i) => {
        const s = getSpecies(id)!;
        return (
          <Bob key={id} still={still} delay={i * 300} style={{ position: 'absolute', left: SPOTS[i].left, top: Math.round(SPOTS[i].top * scale) }}>
            <Sticker art={s.art} photo={speciesPhoto(id)} speciesId={id} size={Math.round(SPOTS[i].size * scale)} tint={colors[s.tint]} rotate={SPOTS[i].rotate} />
          </Bob>
        );
      })}
    </>
  );
}

/** A slow, gentle bob. Still when the person has asked their phone to reduce motion. */
export function Bob({ children, still, delay, style }: { children: ReactNode; still: boolean; delay: number; style?: object }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const half = { duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const anim = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(y, { ...half, toValue: 1 }), Animated.timing(y, { ...half, toValue: 0 })]));
    anim.start();
    return () => anim.stop();
  }, [still, delay, y]);
  return <Animated.View style={[style, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]}>{children}</Animated.View>;
}
