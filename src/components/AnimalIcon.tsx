import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

// Placeholder line art until real illustrations exist. 48×48 grid, from the mocks.
const paths = {
  bird: 'M8 28c6 0 10-4 14-10 2-3 5-5 9-5 3 0 5 2 6 4l4 1-4 2c0 7-6 13-15 13H10M18 33l-4 7M24 33l-1 7',
  squirrel: 'M30 40c-8 0-13-6-13-13 0-5 3-8 7-9-3-5-1-13 6-13 8 0 11 10 5 16 4 2 6 6 5 11-1 5-5 8-10 8zM12 40h18',
  critter: 'M6 30c2-7 9-11 17-11 6 0 10 3 12 6l6 1-4 3c0 3-3 5-6 5H14c-3 0-6-1-8-4zM6 30c-2 3-3 7 0 10',
  bug: 'M24 14v22M24 20c-4-8-16-10-16-2 0 6 8 8 16 6M24 20c4-8 16-10 16-2 0 6-8 8-16 6M24 26c-3 4-10 8-10 12 0 3 6 2 10-6M24 26c3 4 10 8 10 12 0 3-6 2-10-6',
} as const;

export type AnimalIconName = keyof typeof paths;

type Props = {
  name: AnimalIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AnimalIcon({ name, size = 48, color = colors.ink, strokeWidth = 2.4 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={paths[name]} />
    </Svg>
  );
}
