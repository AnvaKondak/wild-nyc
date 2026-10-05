// The whole-screen, gently animated background behind a story. See layers.tsx for
// what's drawn and motion.tsx for how it moves.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { buildLayers, type BackdropInput } from './layers';
import { MovingLayer, useReduceMotion, useTilt } from './motion';

type Props = Omit<BackdropInput, 'w' | 'h'> & { width: number; height: number };

export function StoryBackdrop({ width, height, ...rest }: Props) {
  const still = useReduceMotion();
  const tilt = useTilt(still);
  const dark = rest.period === 'dusk' || rest.period === 'night';
  const layers = useMemo(
    () => buildLayers({ ...rest, w: width, h: height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, rest.setting, rest.period, rest.season, rest.placeKind, rest.placeId, rest.variant, rest.moonLit],
  );
  return (
    <View style={[StyleSheet.absoluteFill, { opacity: dark ? 0.75 : 0.85 }]} pointerEvents="none">
      {layers.map((layer) => (
        <MovingLayer key={layer.id} layer={layer} width={width} height={height} still={still} tilt={tilt} />
      ))}
    </View>
  );
}
