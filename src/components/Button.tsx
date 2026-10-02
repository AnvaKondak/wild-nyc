import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { border, colors, fonts, offsetShadow, touch } from '@/theme/tokens';

type Variant = 'primary' | 'yellow' | 'ink' | 'outline' | 'white';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Override the offset shadow color. null removes it. */
  shadow?: string | null;
  /** Override text/outline color (e.g. white outline on a blue card). */
  color?: string;
  icon?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  selected?: boolean;
  size?: 'large' | 'medium';
  style?: StyleProp<ViewStyle>;
};

const variants: Record<Variant, { bg: string; fg: string; shadow: string | null; outline: boolean }> = {
  primary: { bg: colors.blue, fg: colors.white, shadow: colors.pink, outline: false },
  yellow: { bg: colors.yellow, fg: colors.ink, shadow: null, outline: false },
  ink: { bg: colors.ink, fg: colors.white, shadow: colors.blue, outline: false },
  outline: { bg: 'transparent', fg: colors.ink, shadow: null, outline: true },
  white: { bg: colors.white, fg: colors.ink, shadow: null, outline: true },
};

/** Pill button. On press it shifts into its shadow, like pressing a sticker down. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  shadow,
  color,
  icon,
  accessibilityLabel,
  accessibilityHint,
  selected,
  size = 'large',
  style,
}: Props) {
  const v = variants[variant];
  const shadowColor = shadow === undefined ? v.shadow : shadow;
  const fg = color ?? v.fg;
  const height = size === 'large' ? 52 : touch.min;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={({ pressed }) => [
        {
          minHeight: height,
          borderRadius: height / 2,
          paddingHorizontal: 18,
          backgroundColor: v.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        v.outline && { borderWidth: border.width, borderColor: fg },
        shadowColor && { boxShadow: offsetShadow(shadowColor, pressed ? 1 : 4) },
        pressed && { transform: [{ translateX: shadowColor ? 3 : 0 }, { translateY: shadowColor ? 3 : 0 }], opacity: shadowColor ? 1 : 0.8 },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: size === 'large' ? 16 : 14, color: fg }}>{label}</Text>
      </View>
    </Pressable>
  );
}
