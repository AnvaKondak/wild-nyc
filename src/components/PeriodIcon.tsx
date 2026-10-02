import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Period } from '@/content/types';

const paths: Record<Period, string> = {
  dawn: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 9V4M9 6l3-3 3 3M5 11l2 2M19 11l-2 2',
  midday: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  dusk: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 4v5M9 7l3 3 3-3M5 11l2 2M19 11l-2 2',
  night: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
};

/** Sunrise, sun, sunset or moon for the Right now header. */
export function PeriodIcon({ period, color, size = 26 }: { period: Period; color: ColorValue; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={paths[period]} />
    </Svg>
  );
}
