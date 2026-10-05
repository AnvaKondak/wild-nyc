import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/art/StoryBackdrop';
import { Button } from '@/components/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { PeriodIcon } from '@/components/PeriodIcon';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { getSpecies, moments, speciesPhoto, placeKinds, places, species as allSpecies, speciesFor, stories, type Period, type StorySlide } from '@/content';
import { decodeGeohash } from '@/lib/geohash';
import { buildLocalStory } from '@/lib/localStory';
import { dateKey, seasonOf, timeHeader } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { currentNeighborhood } from '@/state/selectors';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts } from '@/theme/tokens';

const PERIOD_LABELS: Record<Period, string> = { dawn: 'Dawn', midday: 'Midday', dusk: 'Dusk', night: 'Night' };

function tileFor(slide: StorySlide): string {
  if (slide.kind === 'arriving') return colors.yellow;
  if (slide.kind === 'goodbye') return colors.pink;
  const s = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  return s ? colors[s.tint] : colors.blueTint;
}

export default function RightNow() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  // Smaller phones get a smaller sticker so the story still fits without scrolling.
  const stickerSize = Math.min(210, Math.round(height * 0.24));
  const now = useNow();
  const { state } = useAppState();
  const { live } = useLiveData();
  const hood = currentNeighborhood(state);

  // Sun times come from the cell's center, never the user's exact position.
  const { lat, lng } = decodeGeohash(hood.cell);
  const realHeader = timeHeader(now, lat, lng);
  // Dev only: tap the time header to preview each time-of-day theme.
  const [previewPeriod, setPreviewPeriod] = useState<Period | null>(null);
  const header = previewPeriod
    ? { ...realHeader, period: previewPeriod, label: `${PERIOD_LABELS[previewPeriod]} (preview)` }
    : realHeader;
  const cyclePreview = () => {
    const order: (Period | null)[] = [null, 'dawn', 'midday', 'dusk', 'night'];
    setPreviewPeriod((p) => order[(order.indexOf(p) + 1) % order.length]);
  };
  const season = seasonOf(now);
  const theme = periodThemes[header.period];

  // Built around who's been seen near this neighborhood (live), with a seeded pick of
  // moments: steady while you look, different tomorrow and down the street.
  const placeName = hood.placeId ? places.find((p) => p.id === hood.placeId)?.name ?? null : null;
  const today = dateKey(now);
  const story = useMemo(
    () =>
      buildLocalStory({
        moments,
        slides: stories,
        residents: speciesFor(hood.kind, season),
        allSpecies,
        season,
        period: header.period,
        placeKind: hood.kind,
        placeName,
        where: placeKinds[hood.kind].where,
        live,
        seed: `${hood.cell}:${today}:${header.period}`,
      }),
    [season, header.period, hood.kind, hood.cell, placeName, live, today],
  );

  // Switching neighborhood or time of day restarts the story.
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  useEffect(() => setIndex(0), [hood.id, header.period, season]);
  const i = Math.min(index, story.length - 1);
  const slide = story[i];

  const next = useCallback(() => setIndex((n) => (n + 1) % story.length), [story.length]);
  const prev = useCallback(() => setIndex((n) => Math.max(0, n - 1)), []);

  // Swipe left/right, like stories.
  const swipeRef = useRef({ next, prev });
  swipeRef.current = { next, prev };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -40) swipeRef.current.next();
          else if (g.dx > 40) swipeRef.current.prev();
        },
      }),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(theme.statusBar);
      return () => setStatusBarStyle('dark');
    }, [theme.statusBar]),
  );

  if (!slide) return <Screen background={theme.bg} scroll={false}>{null}</Screen>;

  const species = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  const ctaLabel = slide.cta ?? (species ? `Meet the ${species.friendlyName.toLowerCase()}` : 'Learn more');
  const onCta = () => {
    if (slide.link === 'kindness') router.push('/kindness');
    else if (species) router.push({ pathname: '/species/[id]', params: { id: species.id } });
  };

  const setting = slide.setting ?? (header.period === 'night' ? 'night-sky' : 'sky');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={(e) => setArea(e.nativeEvent.layout)}>
      {/* The moment's setting fills the whole story; the animal is the one circle on top. */}
      {area.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StoryBackdrop setting={setting} period={header.period} width={area.width} height={area.height} />
        </View>
      )}
      <Screen background="transparent" scroll={false}>
        <View {...pan.panHandlers} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16 }} accessibilityLabel={`Story ${i + 1} of ${story.length}`}>
            {story.map((s, n) => (
              <View key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= i ? theme.barOn : theme.barOff }} />
            ))}
          </View>

          <View style={{ paddingTop: 14 }}>
            <NeighborhoodPills ink={theme.ink} background={theme.bg} />
          </View>

          <Pressable
            onPress={__DEV__ ? cyclePreview : undefined}
            disabled={!__DEV__}
            accessible
            accessibilityLabel={`${header.label}, ${header.clock}. ${header.sub}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 18 }}
          >
            <PeriodIcon period={header.period} color={theme.ink} />
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: theme.ink }}>
                {header.label} · {header.clock}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted }}>{header.sub}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Next story"
            style={{ alignSelf: 'center', marginTop: 28 }}
          >
            <Sticker
              art={(species ?? getSpecies('rock-pigeon')!).art}
              photo={speciesPhoto((species ?? getSpecies('rock-pigeon')!).id)}
              size={stickerSize}
              tint={tileFor(slide)}
              rotate={-5}
              shadowColor={theme.shadow}
            />
          </Pressable>

          <View style={{ paddingHorizontal: 24, paddingTop: 30, gap: 10 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.accent }}>
              {slide.kicker}
            </Text>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 35, color: theme.ink }}>
              {slide.title}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: theme.body }}>{slide.body}</Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 20 }}>
            <RoundNav label="Previous story" onPress={prev} color={theme.ink}>
              <ChevronLeftIcon color={theme.ink} />
            </RoundNav>
            <View style={{ flex: 1 }}>
              <Button
                label={ctaLabel}
                onPress={onCta}
                shadow={theme.shadow}
                style={{ backgroundColor: theme.btnBg }}
                color={theme.btnInk}
              />
            </View>
            <RoundNav label="Next story" onPress={next} color={theme.ink}>
              <ChevronRightIcon color={theme.ink} />
            </RoundNav>
          </View>
        </View>
      </Screen>
    </View>
  );
}

function RoundNav({ label, onPress, color, children }: { label: string; onPress: () => void; color: string; children: React.ReactNode }) {
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
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
