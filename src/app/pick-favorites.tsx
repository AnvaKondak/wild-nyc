// The last step of joining: tap the neighbors you'd love to hear from. Pigeons first,
// then the neighborhood's own, then the crowd-pleasers who live there. Skippable, no minimum.

import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { HeartIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { sightings, species, speciesPhoto, type Species } from '@/content';
import { suggestFavorites } from '@/lib/favoriteSuggestions';
import { Title } from '@/components/Title';
import { useAppState } from '@/state/AppState';
import { border, colors, fonts, offsetShadow, radius } from '@/theme/tokens';
import { type } from '@/theme/type';

export default function PickFavorites() {
  const router = useRouter();
  const { state, actions } = useAppState();
  const home = state.neighborhoods[0];
  const picks = useMemo(() => suggestFavorites(species, home, sightings), [home]);
  const chosen = state.favorites.length;

  const finish = (then?: '/search') => {
    actions.finishOnboarding();
    router.replace(then ?? '/');
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={{ gap: 18, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 22, gap: 8 }}>
          <Title accent="favorites">Who are your</Title>
          <Text style={type.body}>Tap the neighbors you'd love to hear from. They'll get their own story every day. You can change this anytime.</Text>
        </View>

        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          {picks.map((s, i) => (
            <Pick key={s.id} s={s} i={i} on={state.favorites.includes(s.id)} onPress={() => actions.toggleFavorite(s.id)} />
          ))}
        </View>

        <Pressable
          onPress={() => finish('/search')}
          accessibilityRole="link"
          accessibilityHint="Opens search, where you can heart anyone"
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.blue, textDecorationLine: 'underline' }}>Find someone else</Text>
        </Pressable>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 4, borderTopWidth: border.width, borderTopColor: colors.ink, backgroundColor: colors.paper }}>
        <Button label="Meet the neighbors" onPress={() => finish()} />
        {chosen === 0 ? (
          <Pressable onPress={() => finish()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.inkMuted }}>Maybe later</Text>
          </Pressable>
        ) : (
          <Text style={{ minHeight: 44, textAlign: 'center', textAlignVertical: 'center', lineHeight: 44, fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }} accessibilityLiveRegion="polite">
            {chosen} {chosen === 1 ? 'favorite' : 'favorites'}
          </Text>
        )}
      </View>
    </Screen>
  );
}

/** One suggestion: their sticker and name on a card. Hearted, it turns pink. */
function Pick({ s, i, on, onPress }: { s: Species; i: number; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={s.friendlyName}
      style={({ pressed }) => ({
        width: '48%',
        alignItems: 'center',
        gap: 10,
        paddingTop: 16,
        paddingBottom: 12,
        borderRadius: radius.card,
        borderWidth: border.width,
        borderColor: colors.ink,
        backgroundColor: on ? colors.pinkTint : colors.white,
        boxShadow: offsetShadow(on ? colors.pink : colors.ink, pressed ? 2 : 4),
        transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
      })}
    >
      <Sticker art={s.art} photo={speciesPhoto(s.id)} speciesId={s.id} size={96} tint={colors[s.tint]} rotate={i % 2 ? 5 : -5} still />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 }}>
        <HeartIcon size={18} color={on ? colors.pink : colors.inkMuted} fill={on ? colors.pink : 'none'} />
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, flexShrink: 1 }} numberOfLines={2}>
          {s.friendlyName}
        </Text>
      </View>
    </Pressable>
  );
}
