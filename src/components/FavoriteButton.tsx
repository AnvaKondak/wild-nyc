// The ♥ that adds a kind of animal to your favorites. A pill on species pages, a small
// round button on story stickers. It gives a little bounce when tapped (unless the
// person has asked their phone to reduce motion).

import { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { getSpecies } from '@/content';
import { lowerName } from '@/lib/names';
import { useAppState } from '@/state/AppState';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { useReduceMotion } from './backdrop/motion';
import { HeartIcon } from './Icons';

type Props = { speciesId: string; size?: 'pill' | 'round'; ink?: string; background?: string };

export function FavoriteButton({ speciesId, size = 'pill', ink = colors.ink, background = colors.white }: Props) {
  const { state, actions } = useAppState();
  const on = state.favorites.includes(speciesId);
  const still = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const name = lowerName(getSpecies(speciesId)?.friendlyName ?? 'them');

  const toggle = () => {
    actions.toggleFavorite(speciesId);
    if (still) return;
    scale.setValue(0.8);
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }).start();
  };

  const round = size === 'round';
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        accessibilityLabel={on ? `Favorite: the ${name}` : `Add the ${name} to your favorites`}
        hitSlop={round ? 8 : 4}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: round ? 44 : 38,
          minWidth: round ? 44 : undefined,
          paddingHorizontal: round ? 0 : 14,
          borderRadius: 22,
          borderWidth: border.width,
          borderColor: ink,
          backgroundColor: on ? colors.pink : background,
          boxShadow: offsetShadow(ink, 2),
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <HeartIcon size={round ? 20 : 16} color={ink} fill={on ? colors.white : 'none'} />
        {!round && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: ink }}>{on ? 'Favorite' : 'Add to favorites'}</Text>}
      </Pressable>
    </Animated.View>
  );
}
