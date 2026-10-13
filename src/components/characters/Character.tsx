// A drawn neighbor (see scripts/build_characters.js): blinks now and then and bobs
// gently, unless the person has asked their phone to reduce motion.

import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { Mood } from '@/content/types';
import { useReduceMotion } from '../backdrop/motion';
import { characterXml, cutoutXml } from './xml';

/** Is there a drawing of this species yet? Photos fill in for the rest. */
export function hasCharacter(speciesId?: string): speciesId is string {
  return !!speciesId && speciesId in characterXml;
}

/** Is there a close-up-scene version (no background, no perch) of this species? */
export function hasCutout(speciesId?: string): speciesId is string {
  return !!speciesId && speciesId in cutoutXml;
}

/** Where a cutout's feet are, as a fraction of its height, to stand them on the scene's ground. */
export function cutoutFeet(speciesId: string): number {
  return cutoutXml[speciesId]?.feet ?? 0.9;
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
  /** The close-up-scene version: no background, drawn at exactly `size`, free to bob. */
  cutout?: boolean;
};

export function Character({ speciesId, size, mood = 0, still: holdStill = false, cutout = false }: Props) {
  const frames = cutout ? cutoutXml[speciesId].frames : characterXml[speciesId];
  const at = typeof mood === 'string' ? Math.max(0, frames.findIndex((f) => f.mood === mood)) : ((mood % frames.length) + frames.length) % frames.length;
  const frame = frames[at];
  const still = useReduceMotion() || holdStill;

  // Blink: three quick blinks in a row (blink-blink-blink), then a pause of about two
  // seconds, then three more. Each blink is long enough to always show on screen. The pause varies a little so it never feels mechanical.
  const [shut, setShut] = useState(false);
  useEffect(() => {
    if (still || !frame.shut) return;
    let timer: ReturnType<typeof setTimeout>;
    const blink = (left: number) => {
      setShut(true);
      timer = setTimeout(() => {
        setShut(false);
        timer = left > 1 ? setTimeout(() => blink(left - 1), 90) : setTimeout(() => blink(3), 1500 + Math.random() * 1000);
      }, 100);
    };
    timer = setTimeout(() => blink(3), 400 + Math.random() * 1200);
    return () => clearTimeout(timer);
  }, [still, frame.shut]);

  // Bob: a slow breath up and down. Not in a close-up scene, where they stand on
  // something (a branch, the sidewalk) and bobbing would look like floating.
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still || cutout) return;
    const half = { duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const anim = Animated.loop(Animated.sequence([Animated.timing(y, { ...half, toValue: 1 }), Animated.timing(y, { ...half, toValue: 0 })]));
    anim.start();
    return () => anim.stop();
  }, [still, cutout, y]);

  // Drawn a little larger than the circle, so the bob never shows an edge. A cutout has
  // no edge to hide: it's drawn at its size and bobs freely.
  const big = cutout ? size : Math.round(size * 1.08);
  const offset = -(big - size) / 2;
  return (
    <View style={{ width: size, height: size, overflow: cutout ? 'visible' : 'hidden' }}>
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
