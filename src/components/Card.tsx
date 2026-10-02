import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { border, colors, offsetShadow, radius } from '@/theme/tokens';

type Props = ViewProps & {
  background?: string;
  /** Offset shadow color, or null for a flat card. */
  shadow?: string | null;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Rounded card with an ink outline and a solid offset shadow. */
export function Card({
  background = colors.white,
  shadow = colors.pink,
  bordered = true,
  style,
  children,
  ...rest
}: Props) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: background,
          borderRadius: radius.card,
          padding: 20,
          gap: 12,
        },
        bordered && { borderWidth: border.width, borderColor: colors.ink },
        shadow && { boxShadow: offsetShadow(shadow, 4) },
        style,
      ]}
    >
      {children}
    </View>
  );
}
