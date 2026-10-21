// On the web the app sits in a phone-width column in the middle of the window, so
// anything sized from the screen uses the column's width, not the whole window's.

import { Platform, useWindowDimensions } from 'react-native';

export const WEB_MAX_WIDTH = 480;

export function useAppDimensions(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return Platform.OS === 'web' ? { width: Math.min(width, WEB_MAX_WIDTH), height } : { width, height };
}
