import { Text, type StyleProp, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Props = {
  /** Plain part of the title, e.g. "Your". */
  children: string;
  /** The one word set in italic pink or blue, e.g. "block". */
  accent?: string;
  accentColor?: 'pink' | 'blue';
  /** Put the accent word before the plain part instead of after. */
  accentFirst?: boolean;
  size?: number;
  style?: StyleProp<TextStyle>;
};

/** Fraunces 600 with a yellow offset shadow; one word in italic pink or blue. */
export function Title({ children, accent, accentColor = 'pink', accentFirst = false, size = 36, style }: Props) {
  const accentNode = accent ? (
    <Text style={{ fontFamily: fonts.displayItalic, color: colors[accentColor] }}>{accent}</Text>
  ) : null;

  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: fonts.display,
          fontSize: size,
          lineHeight: Math.round(size * 1.08),
          color: colors.ink,
          textShadowColor: colors.yellow,
          textShadowOffset: { width: 3, height: 3 },
          textShadowRadius: 0,
        },
        style,
      ]}
    >
      {accentFirst && accentNode}
      {accentFirst && accent ? ' ' : ''}
      {children}
      {!accentFirst && accent ? ' ' : ''}
      {!accentFirst && accentNode}
    </Text>
  );
}
