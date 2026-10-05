import { colors } from '@/theme/tokens';

// Inks for the placeholder animal art: the app's palette plus a few extra
// riso-style inks animals need (a cardinal has to be red). Placeholder until real
// illustrations replace it.
export const inks = {
  ink: colors.ink,
  paper: colors.paper,
  white: colors.white,
  pink: colors.pink,
  pinkTint: colors.pinkTint,
  blue: colors.blue,
  blueTint: colors.blueTint,
  yellow: colors.yellow,
  yellowTint: colors.yellowTint,
  red: '#E5484D',
  orange: '#F28C28',
  green: '#3FA66B',
  teal: '#2A9D8F',
  gray: '#9C9AB0',
  lightGray: '#D9D7E3',
  tan: '#C9A27A',
  brown: '#8A6247',
} as const;

export type Ink = keyof typeof inks;
