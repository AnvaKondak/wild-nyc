import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  background?: string;
  /** Scrolls by default; pass false for full-height screens like the story. */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Paper background with safe-area top padding. */
export function Screen({ children, background = colors.paper, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const padding = { paddingTop: insets.top + 12 };

  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: background }, padding, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={[padding, { paddingBottom: 32 }, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}
