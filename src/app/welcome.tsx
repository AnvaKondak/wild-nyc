import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { getSpecies, places, speciesFor, speciesPhoto } from '@/content';
import { seenThisYear } from '@/lib/live';
import { locateNeighborhood } from '@/lib/locate';
import { seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { currentNeighborhood } from '@/state/selectors';
import { border, colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppState();
  const [locating, setLocating] = useState(false);

  const hood = currentNeighborhood(state);
  const hasHood = state.neighborhoods.length > 0;
  const placeName = hood.placeId ? places.find((p) => p.id === hood.placeId)?.name : undefined;
  const { live } = useLiveData();
  // With live data, count who's actually been seen around here; otherwise who
  // usually lives in this kind of place.
  const usual = speciesFor(hood.kind, seasonOf(new Date()));
  const seen = seenThisYear(usual, live);
  const count = seen.length > 0 ? seen.length : usual.length;

  const pickInstead = () => router.push({ pathname: '/add-place', params: { from: 'welcome' } });

  const meet = async () => {
    if (hasHood) {
      actions.finishOnboarding();
      router.replace('/');
      return;
    }
    setLocating(true);
    const result = await locateNeighborhood('Home');
    setLocating(false);
    if (result.ok) {
      actions.addNeighborhood(result.neighborhood);
      actions.finishOnboarding();
      router.replace('/');
    } else {
      pickInstead();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>
          Wild <Text style={{ fontFamily: fonts.displayItalic, color: colors.pink }}>Neighbors</Text>
        </Text>
        <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: border.width, borderColor: colors.ink }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink }}>
            {placeName ?? (hasHood ? 'Your street' : 'NYC + JC')}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 28, height: 280 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Sticker art={getSpecies('rock-pigeon')!.art} photo={speciesPhoto('rock-pigeon')} size={120} tint={colors.pinkTint} rotate={-8} style={{ position: 'absolute', left: 4, top: 30 }} />
        <Sticker art={getSpecies('eastern-gray-squirrel')!.art} photo={speciesPhoto('eastern-gray-squirrel')} size={108} tint={colors.yellowTint} rotate={6} style={{ position: 'absolute', left: 134, top: 0 }} />
        <Sticker art={getSpecies('house-sparrow')!.art} photo={speciesPhoto('house-sparrow')} size={112} tint={colors.blueTint} rotate={-4} style={{ position: 'absolute', left: 212, top: 116 }} />
        <Sticker art={getSpecies('raccoon')!.art} photo={speciesPhoto('raccoon')} size={104} tint={colors.pink} rotate={9} style={{ position: 'absolute', left: 80, top: 166 }} />
      </View>

      <Title accent="your street" accentColor="blue" size={42} style={{ marginTop: 16 }}>
        {`${count} neighbors share`}
      </Title>
      <Text style={[type.bodyLarge, { marginTop: 14 }]}>
        Pigeons on the ledges, sparrows in the hedge, squirrels in the tree. Come meet them.
      </Text>

      <View style={{ flex: 1 }} />

      <Button label={locating ? 'Finding your block…' : 'Meet the neighbors'} onPress={meet} accessibilityHint="Uses your location once to find your neighborhood" />
      {!hasHood && (
        <Pressable onPress={pickInstead} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.blue, textDecorationLine: 'underline' }}>
            Pick a neighborhood instead
          </Text>
        </Pressable>
      )}
      <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.displayItalic, fontSize: 15, color: colors.inkMuted }}>
        We notice. We don't follow.
      </Text>
    </View>
  );
}
