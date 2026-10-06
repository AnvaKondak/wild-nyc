// Welcome: three little story pages, in the same style as the app itself. Dawn in the
// park (meet the neighbors), midday on the block (a new story every day), dusk by the
// water (we notice, we don't follow), then find your neighborhood.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/backdrop';
import { useReduceMotion } from '@/components/backdrop/motion';
import { Button } from '@/components/Button';
import { PeriodIcon } from '@/components/PeriodIcon';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { StoryCard, StoryProgress, useSwipe } from '@/components/story/parts';
import { getSpecies, species, speciesPhoto, type Period, type PlaceKind } from '@/content';
import { locateNeighborhood } from '@/lib/locate';
import { seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts } from '@/theme/tokens';

type Page = { period: Period; place: PlaceKind; kicker: string; title: string; body: string };

const PAGES: Page[] = [
  {
    period: 'dawn',
    place: 'park',
    kicker: 'Hello, neighbor',
    title: 'Meet the neighbors',
    body: `The pigeons on the ledge, the sparrows in the hedge, the squirrel in the tree, and ${species.length - 3} more who share NYC and Jersey City with you.`,
  },
  {
    period: 'midday',
    place: 'block',
    kicker: 'Every day',
    title: 'A new story every day',
    body: 'Each time you open the app, follow one neighbor through their day: who they run into, how the weather feels to them, and the sounds outside your window.',
  },
  {
    period: 'dusk',
    place: 'waterfront',
    kicker: 'Our promise',
    title: "We notice. We don't follow.",
    body: 'Your location turns into a neighborhood on your phone and never leaves it. We never show where any animal is. No accounts, no ads, no tracking.',
  },
];

const CAST = ['rock-pigeon', 'eastern-gray-squirrel', 'house-sparrow', 'raccoon', 'northern-cardinal'];

export default function Welcome() {
  const router = useRouter();
  const { state, actions } = useAppState();
  // Dev only: ?page=2 opens on that page.
  const params = useLocalSearchParams<{ page?: string }>();
  const [index, setIndex] = useState(__DEV__ && params.page ? Math.min(PAGES.length - 1, Number(params.page)) : 0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [locating, setLocating] = useState(false);
  const page = PAGES[index];
  const theme = periodThemes[page.period];
  const last = index === PAGES.length - 1;
  const hasHood = state.neighborhoods.length > 0;
  // Light status bar text on the dusk page, like the stories.
  useEffect(() => {
    setStatusBarStyle(theme.statusBar);
    return () => setStatusBarStyle('dark');
  }, [theme.statusBar]);

  const next = useCallback(() => setIndex((i) => Math.min(PAGES.length - 1, i + 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const swipe = useSwipe(next, prev);

  const pickInstead = () => router.push({ pathname: '/add-place', params: { from: 'welcome' } });
  const start = async () => {
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
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={(e) => setArea(e.nativeEvent.layout)}>
      {area.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StoryBackdrop setting="sky" period={page.period} season={seasonOf(new Date())} placeKind={page.place} variant={index} moonLit={0.6} width={area.width} height={area.height} />
        </View>
      )}
      <Screen background="transparent" scroll={false}>
        <View {...swipe} style={{ flex: 1 }}>
          <StoryProgress count={PAGES.length} index={index} theme={theme} />
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: theme.ink, paddingHorizontal: 22, paddingTop: 18 }}>
            Wild <Text style={{ fontFamily: fonts.displayItalic, color: index === 2 ? colors.yellow : colors.pink }}>Neighbors</Text>
          </Text>

          {/* The picture for each page, floating gently in the scene. */}
          <View style={{ height: 300, marginTop: 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {index === 0 && <FloatingCast />}
            {index === 1 && <TimesOfDay ink={theme.ink} />}
            {index === 2 && <Promise />}
          </View>

          <StoryCard kicker={page.kicker} title={page.title} body={page.body} theme={theme} bottom>
            {last && (
              <Pressable onPress={() => router.push('/privacy')} accessibilityRole="link" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: theme.ink, textDecorationLine: 'underline' }}>Read the whole privacy promise</Text>
              </Pressable>
            )}
          </StoryCard>

          <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 4 }}>
            <Button
              label={!last ? 'Next' : locating ? 'Finding your block…' : hasHood ? 'Meet the neighbors' : 'Find my neighborhood'}
              onPress={last ? start : next}
              shadow={theme.shadow}
              style={{ backgroundColor: theme.btnBg }}
              color={theme.btnInk}
              accessibilityHint={last && !hasHood ? 'Uses your location once to find your neighborhood' : undefined}
            />
            {last && !hasHood ? (
              <Pressable onPress={pickInstead} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: theme.ink, textDecorationLine: 'underline' }}>Pick a neighborhood instead</Text>
              </Pressable>
            ) : (
              <View style={{ minHeight: 44 }} />
            )}
          </View>
        </View>
      </Screen>
    </View>
  );
}

/** A few neighbors' stickers bobbing gently, each at their own pace. */
function FloatingCast() {
  const still = useReduceMotion();
  const spots = [
    { left: '6%', top: 40, size: 112, rotate: -8 },
    { left: '36%', top: 0, size: 104, rotate: 6 },
    { left: '64%', top: 56, size: 108, rotate: -4 },
    { left: '16%', top: 170, size: 96, rotate: 9 },
    { left: '52%', top: 180, size: 92, rotate: -6 },
  ] as const;
  return (
    <>
      {CAST.map((id, i) => {
        const s = getSpecies(id)!;
        return (
          <Bob key={id} still={still} delay={i * 300} style={{ position: 'absolute', left: spots[i].left, top: spots[i].top }}>
            <Sticker art={s.art} photo={speciesPhoto(id)} size={spots[i].size} tint={colors[s.tint]} rotate={spots[i].rotate} />
          </Bob>
        );
      })}
    </>
  );
}

/** Dawn, midday, dusk and night, as round stickers in a gentle arc. */
function TimesOfDay({ ink }: { ink: string }) {
  const still = useReduceMotion();
  const times: { period: Period; tint: string }[] = [
    { period: 'dawn', tint: colors.pinkTint },
    { period: 'midday', tint: colors.yellowTint },
    { period: 'dusk', tint: colors.blueTint },
    { period: 'night', tint: colors.white },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 110 }}>
      {times.map((t, i) => (
        <Bob key={t.period} still={still} delay={i * 250} style={{ marginTop: i === 1 || i === 2 ? -24 : 0 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.white, backgroundColor: t.tint, alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${colors.ink}`, transform: [{ rotate: `${i % 2 ? 5 : -5}deg` }] }}>
            <PeriodIcon period={t.period} color={ink === colors.white ? colors.ink : ink} size={34} />
          </View>
        </Bob>
      ))}
    </View>
  );
}

/** Two neighbors, safe and unbothered, under a little heart. */
function Promise() {
  const still = useReduceMotion();
  const pair = ['mourning-dove', 'eastern-gray-squirrel'];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 18, paddingTop: 110 }}>
      {pair.map((id, i) => {
        const s = getSpecies(id)!;
        return (
          <Bob key={id} still={still} delay={i * 400}>
            <Sticker art={s.art} photo={speciesPhoto(id)} size={i === 0 ? 112 : 124} tint={colors[s.tint]} rotate={i === 0 ? -6 : 6} />
          </Bob>
        );
      })}
      <View style={{ position: 'absolute', top: 60, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.pink, borderWidth: border.width, borderColor: colors.ink }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>neighbors, not data ♥</Text>
      </View>
    </View>
  );
}

/** A slow, gentle bob. Still when the person has asked their phone to reduce motion. */
function Bob({ children, still, delay, style }: { children: React.ReactNode; still: boolean; delay: number; style?: object }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const half = { duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const anim = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(y, { ...half, toValue: 1 }), Animated.timing(y, { ...half, toValue: 0 })]));
    anim.start();
    return () => anim.stop();
  }, [still, delay, y]);
  return <Animated.View style={[style, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]}>{children}</Animated.View>;
}
