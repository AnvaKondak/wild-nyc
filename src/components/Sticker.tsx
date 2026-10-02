import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, offsetShadow } from '@/theme/tokens';
import { AnimalIcon, type AnimalIconName } from './AnimalIcon';

type Props = {
  icon: AnimalIconName;
  size?: number;
  tint?: string;
  /** Degrees. Stickers sit slightly crooked, ±3–8°. */
  rotate?: number;
  shadowColor?: string;
  /** A faint dashed outline, for neighbors who haven't moved in yet. */
  ghost?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round animal "sticker": white border, slight tilt, offset ink shadow. */
export function Sticker({
  icon,
  size = 120,
  tint = colors.pinkTint,
  rotate = -5,
  shadowColor = colors.ink,
  ghost = false,
  style,
}: Props) {
  const borderWidth = size >= 150 ? 6 : size >= 80 ? 4 : 3;
  const shadowOffset = size >= 150 ? 6 : size >= 80 ? 4 : 2;
  const iconSize = Math.round(size * (size >= 150 ? 0.57 : 0.58));
  const strokeWidth = size >= 150 ? 1.8 : size >= 80 ? 2.4 : 3;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ghost
          ? {
              backgroundColor: 'rgba(250,247,242,0.88)',
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.inkMuted,
            }
          : {
              backgroundColor: tint,
              borderWidth,
              borderColor: colors.white,
              boxShadow: offsetShadow(shadowColor, shadowOffset),
              transform: [{ rotate: `${rotate}deg` }],
            },
        style,
      ]}
    >
      <AnimalIcon
        name={icon}
        size={iconSize}
        strokeWidth={strokeWidth}
        color={ghost ? colors.inkMuted : colors.ink}
      />
    </View>
  );
}
