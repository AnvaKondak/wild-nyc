// A species' photos, big: opens over the page when a photo is tapped. Swipe between
// them, tap ✕ (top left, where the page's back button is) or outside the photo to go back.

import { useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PhotoCredit } from '@/content';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';

type Props = {
  photos: number[];
  credits: PhotoCredit[];
  name: string;
  /** Which photo to open on, or null when closed. */
  index: number | null;
  onClose: () => void;
};

export function PhotoViewer({ photos, credits, name, index, onClose }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [at, setAt] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const size = width - 32;
  const shown = index === null ? 0 : at;

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose} onShow={() => setAt(index ?? 0)}>
      <View style={{ flex: 1, backgroundColor: colors.ink }}>
        {/* Tapping anywhere off the photo closes it. */}
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} accessible={false} />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          hitSlop={8}
          style={({ pressed }) => ({
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            zIndex: 1,
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: border.width,
            borderColor: colors.paper,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 20, color: colors.paper }}>✕</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
          {index !== null && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              ref={scroller}
              // Open on the photo that was tapped, once the pages are laid out.
              onLayout={() => scroller.current?.scrollTo({ x: index * width, animated: false })}
              onMomentumScrollEnd={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / width))}
              style={{ flexGrow: 0 }}
            >
              {photos.map((p, i) => (
                <View key={i} style={{ width, alignItems: 'center' }}>
                  <View style={{ borderRadius: 22, boxShadow: offsetShadow(colors.pink, 5) }}>
                    <Image
                      source={p}
                      accessibilityLabel={`${name}, photo ${i + 1} of ${photos.length}`}
                      style={{ width: size, height: size, borderRadius: 22, borderWidth: border.width, borderColor: colors.paper }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={{ paddingHorizontal: 22, paddingTop: 18, gap: 4 }} pointerEvents="none">
            {photos.length > 1 && (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.yellow }}>
                {shown + 1} of {photos.length} · swipe for more
              </Text>
            )}
            {credits[shown] && (
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.paper }}>
                {credits[shown].attribution}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
