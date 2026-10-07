// A drawn neighbor (see scripts/build_characters.js): blinks now and then and bobs
// gently, unless the person has asked their phone to reduce motion.

import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { Mood } from '@/content/types';
import { useReduceMotion } from '../backdrop/motion';
import { characterXml } from './xml';

/** Is there a drawing of this species yet? Photos fill in for the rest. */
export function hasCharacter(speciesId?: string): speciesId is string {
  return !!speciesId && speciesId in characterXml;
}

/** How many moods (different drawings) a species has. */
export function moodCount(speciesId: string): number {
  return characterXml[speciesId]?.length ?? 0;
}

// The drawings themselves never change between blinks, so they're drawn once: a blink
// only flips which one is showing.
const Drawing = memo(SvgXml);

type Props = {
  speciesId: string;
  size: number;
  /** Hold still: no blink, no bob (long lists). */
  still?: boolean;
  /** Which drawing: a mood by name, or an index that wraps around like photo indexes. */
  mood?: number | Mood;
};

export function Character({ speciesId, size, mood = 0, still: holdStill = false }: Props) {
  const frames = characterXml[speciesId];
  const at = typeof mood === 'string' ? Math.max(0, frames.findIndex((f) => f.mood === mood)) : ((mood % frames.length) + frames.length) % frames.length;
  const frame = frames[at];
  const still = useReduceMotion() || holdStill;

  // Blink: eyes shut for a moment every few seconds, at a slightly different pace each time.
  const [shut, setShut] = useState(false);
  useEffect(() => {
    if (still || !frame.shut) return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setShut(true);
        timer = setTimeout(() => {
          setShut(false);
          next();
        }, 140);
      }, 2500 + Math.random() * 3500);
    };
    next();
    return () => clearTimeout(timer);
  }, [still, frame.shut]);

  // Bob: a slow breath up and down.
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const half = { duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const anim = Animated.loop(Animated.sequence([Animated.timing(y, { ...half, toValue: 1 }), Animated.timing(y, { ...half, toValue: 0 })]));
    anim.start();
    return () => anim.stop();
  }, [still, y]);

  // Drawn a little larger than the circle, so the bob never shows an edge.
  const big = Math.round(size * 1.08);
  const offset = -(big - size) / 2;
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: offset,
          top: offset,
          transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.025] }) }],
        }}
      >
        <Drawing xml={frame.open} width={big} height={big} />
        {frame.shut && (
          <View style={{ position: 'absolute', top: 0, left: 0, opacity: shut ? 1 : 0 }}>
            <Drawing xml={frame.shut} width={big} height={big} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
