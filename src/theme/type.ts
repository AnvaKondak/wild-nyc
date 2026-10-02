import { StyleSheet } from 'react-native';
import { colors, fonts } from './tokens';

// Shared text styles. Screen-specific sizes stay in the screen.
export const type = StyleSheet.create({
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.blue,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.inkSoft,
  },
  serifBody: {
    fontFamily: fonts.displayRegular,
    fontSize: 19,
    lineHeight: 27,
    color: colors.ink,
  },
});
