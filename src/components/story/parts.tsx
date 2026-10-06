// Pieces shared by the two story players (Right now and Chapters): the progress bars,
// the round prev/next buttons, swipe handling and the text card.

import { useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import type { PeriodTheme } from '@/theme/periodTheme';
import { border, fonts, offsetShadow } from '@/theme/tokens';

export function StoryProgress({ count, index, theme }: { count: number; index: number; theme: PeriodTheme }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16 }} accessibilityLabel={`Story ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, n) => (
        <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= index ? theme.barOn : theme.barOff }} />
      ))}
    </View>
  );
}

export function RoundNav({ label, onPress, color, fill, children }: { label: string; onPress: () => void; color: string; fill: string; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: border.width,
        borderColor: color,
        backgroundColor: fill, // solid, so the scene never shows through
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/** Swipe left/right to move through the story. Spread the returned handlers on a View. */
export function useSwipe(next: () => void, prev: () => void) {
  const ref = useRef({ next, prev });
  ref.current = { next, prev };
  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -40) ref.current.next();
          else if (g.dx > 40) ref.current.prev();
        },
      }).panHandlers,
    [],
  );
}

/**
 * The words of a slide on a riso card over the scene. Scrolls when long, so the button
 * below always stays in place. `children` go at the bottom of the card (links, chips).
 */
export function StoryCard({ kicker, title, body, fact, theme, children, bottom = false }: { kicker: string; title: string; body: string; fact?: string; theme: PeriodTheme; children?: ReactNode; /** Sit at the bottom, just above the button, when there's room to spare. */ bottom?: boolean }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: 14, ...(bottom ? { flexGrow: 1, justifyContent: 'flex-end' } : {}) }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          padding: 18,
          gap: 8,
          borderRadius: 22,
          borderWidth: border.width,
          borderColor: theme.ink,
          backgroundColor: theme.card,
          boxShadow: offsetShadow(theme.shadow, 4),
        }}
      >
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.accent }}>{kicker}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: title.length > 44 ? 25 : 29, lineHeight: title.length > 44 ? 29 : 33, color: theme.ink }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: theme.body }}>{body}</Text>
        {fact && (
          <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: theme.ink, gap: 2 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.accent }}>Fun fact</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: theme.body }}>{fact}</Text>
          </View>
        )}
        {children}
      </View>
    </ScrollView>
  );
}
