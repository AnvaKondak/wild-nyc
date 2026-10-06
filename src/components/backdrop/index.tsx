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
  const layers = useMemo(
    () => buildLayers({ ...rest, w: width, h: height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, rest.setting, rest.period, rest.season, rest.placeKind, rest.placeId, rest.variant, rest.moonLit, rest.sky, rest.weather?.join()],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layers.map((layer) => (
        <MovingLayer key={layer.id} layer={layer} width={width} height={height} still={still} tilt={tilt} />
      ))}
    </View>
  );
}
