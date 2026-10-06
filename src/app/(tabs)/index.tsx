import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/backdrop';
import { Button } from '@/components/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import { GroupSticker } from '@/components/GroupSticker';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { PeriodIcon } from '@/components/PeriodIcon';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { facts, getSpecies, moments, speciesPhoto, placeKinds, places, species as allSpecies, speciesFor, stories, type Period, type StorySlide } from '@/content';
import { decodeGeohash } from '@/lib/geohash';
import { buildIntro } from '@/lib/intro';
import { buildLocalStory } from '@/lib/localStory';
import { hashString, seededRandom } from '@/lib/random';
import { dateKey, moonLitFraction, seasonOf, timeHeader } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { describeWeather, PREVIEW_WEATHER, type WeatherTag } from '@/lib/weather';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { useWeather } from '@/state/Weather';
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
  const stickerSize = Math.min(190, Math.round(height * 0.21));
  const now = useNow();
  const { state } = useAppState();
  const { live } = useLiveData();
  const hood = currentNeighborhood(state);

  // Sun times come from the cell's center, never the user's exact position.
  const { lat, lng } = decodeGeohash(hood.cell);
  const realHeader = timeHeader(now, lat, lng);
  // Dev only: tap the time header to preview each time-of-day theme.
  // Dev only: ?period=dusk&weather=rain in the URL starts on a preview too.
  const params = useLocalSearchParams<{ period?: Period; weather?: WeatherTag }>();
  const [previewPeriod, setPreviewPeriod] = useState<Period | null>(__DEV__ && params.period ? params.period : null);
  const header = previewPeriod
    ? { ...realHeader, period: previewPeriod, label: `${PERIOD_LABELS[previewPeriod]} (preview)` }
    : realHeader;
  const cyclePreview = () => {
    const order: (Period | null)[] = [null, 'dawn', 'midday', 'dusk', 'night'];
    setPreviewPeriod((p) => order[(order.indexOf(p) + 1) % order.length]);
  };
  const season = seasonOf(now);
  const theme = periodThemes[header.period];

  // Dev only: long-press the time header to preview each kind of weather.
  const realWeather = useWeather();
  const [previewWeather, setPreviewWeather] = useState<WeatherTag | null>(__DEV__ && params.weather && params.weather in PREVIEW_WEATHER ? params.weather : null);
  const weather = previewWeather ? PREVIEW_WEATHER[previewWeather] : realWeather;
  const cycleWeather = () => {
    const order: (WeatherTag | null)[] = [null, 'rain', 'snow', 'wind', 'heat', 'cold', 'fog'];
    setPreviewWeather((w) => order[(order.indexOf(w) + 1) % order.length]);
  };
  const weatherKey = weather ? `${weather.sky}:${weather.tags.join(',')}` : 'none';

  // Built around who's been seen near this neighborhood (live), with a seeded pick of
  // moments: steady while you look, different tomorrow and down the street.
  const place = hood.placeId ? places.find((p) => p.id === hood.placeId) : undefined;
  const placeName = place?.name ?? null;
  const today = dateKey(now);
  const story = useMemo(() => {
    const residents = speciesFor(hood.kind, season);
    const slides = buildLocalStory({
      moments,
      facts,
      slides: stories,
      residents,
      allSpecies,
      season,
      period: header.period,
      placeKind: hood.kind,
      placeName,
      where: placeKinds[hood.kind].where,
      local: place?.local ?? placeKinds[hood.kind].local,
      live,
      weather: weather?.tags ?? [],
      seed: `${hood.cell}:${today}:${header.period}`,
    });
    // The story opens on where we are, how it feels, and who's up.
    const featured = slides.flatMap((s) => (s.kind === 'scene' && s.speciesId ? [getSpecies(s.speciesId)!] : []));
    const intro = buildIntro({
      period: header.period,
      season,
      weather,
      placeName,
      where: placeKinds[hood.kind].where,
      local: place?.local ?? placeKinds[hood.kind].local,
      featured,
      residents,
      random: seededRandom(`${hood.cell}:${today}:${header.period}:intro`),
    });
    return [intro, ...slides];
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [season, header.period, hood.kind, hood.cell, place, placeName, live, today, weatherKey],
  );

  // Switching neighborhood or time of day restarts the story.
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Where the slide's text ends, so the backdrop's horizon can stay below it.
  const [textArea, setTextArea] = useState<{ top: number; height: number } | null>(null);
  const [textHeight, setTextHeight] = useState(0);
  const insets = useSafeAreaInsets();
  // Screen pads its content by the safe area + 12 (see Screen.tsx).
  const textBottom = textArea ? insets.top + 12 + textArea.top + Math.min(textArea.height, textHeight) : undefined;
  useEffect(() => setIndex(0), [hood.id, header.period, season, weatherKey]);
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
    if (slide.kind === 'intro') next();
    else if (slide.link === 'kindness') router.push('/kindness');
    else if (species) router.push({ pathname: '/species/[id]', params: { id: species.id } });
  };

  const setting = slide.setting ?? (header.period === 'night' ? 'night-sky' : 'sky');
  const weatherLine = weather ? `${describeWeather(weather)}${previewWeather ? ' (preview)' : ''} · ${header.sub}` : header.sub;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={(e) => setArea(e.nativeEvent.layout)}>
      {/* The moment's setting fills the whole story; the animal is the one circle on top. */}
      {area.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StoryBackdrop
            setting={setting}
            period={header.period}
            season={season}
            placeKind={hood.kind}
            placeId={hood.placeId}
            variant={hashString(`${slide.id}:${today}`) % 3}
            moonLit={moonLitFraction(now)}
            textBottom={textBottom}
            sky={weather?.sky}
            weather={weather?.tags}
            width={area.width}
            height={area.height}
          />
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
            onLongPress={__DEV__ ? cycleWeather : undefined}
            disabled={!__DEV__}
            accessible
            accessibilityLabel={`${header.label}, ${header.clock}. ${weatherLine}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 18 }}
          >
            <PeriodIcon period={header.period} color={theme.ink} />
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: theme.ink }}>
                {header.label} · {header.clock}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted }}>{weatherLine}</Text>
            </View>
          </Pressable>

          {/* Prev / next sit beside the photo, in the middle of the screen. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 28 }}>
            <RoundNav label="Previous story" onPress={prev} color={theme.ink} fill={theme.bg}>
              <ChevronLeftIcon color={theme.ink} />
            </RoundNav>
            <Pressable
              onPress={next}
              accessibilityRole="button"
              accessibilityLabel={`${slide.kind === 'intro' ? 'Who\'s up' : species?.friendlyName ?? 'Animal'} photo. Next story`}
            >
              {slide.kind === 'intro' ? (
                <GroupSticker period={header.period} speciesIds={slide.introSpecies ?? []} size={stickerSize} tint={theme.card} ink={theme.ink} shadowColor={theme.shadow} />
              ) : (
                <Sticker
                  art={(species ?? getSpecies('rock-pigeon')!).art}
                  photo={speciesPhoto((species ?? getSpecies('rock-pigeon')!).id)}
                  size={stickerSize}
                  tint={tileFor(slide)}
                  rotate={-5}
                  shadowColor={theme.shadow}
                />
              )}
            </Pressable>
            <RoundNav label="Next story" onPress={next} color={theme.ink} fill={theme.bg}>
              <ChevronRightIcon color={theme.ink} />
            </RoundNav>
          </View>

          {/* The words scroll if they're long, so the button below always stays in place. */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onLayout={(e) => setTextArea({ top: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}
            onContentSizeChange={(_, h) => setTextHeight(h)}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.accent }}>
              {slide.kicker}
            </Text>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: slide.title.length > 44 ? 27 : 32, lineHeight: slide.title.length > 44 ? 31 : 35, color: theme.ink }}>
              {slide.title}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: theme.body }}>{slide.body}</Text>
            {slide.fact && (
              <View
                style={{
                  marginTop: 4,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: theme.ink,
                  backgroundColor: theme.card,
                  gap: 2,
                }}
              >
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.accent }}>Fun fact</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: theme.body }}>{slide.fact}</Text>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            <Button
              label={ctaLabel}
              onPress={onCta}
              shadow={theme.shadow}
              style={{ backgroundColor: theme.btnBg }}
              color={theme.btnInk}
            />
          </View>
        </View>
      </Screen>
    </View>
  );
}

function RoundNav({ label, onPress, color, fill, children }: { label: string; onPress: () => void; color: string; fill: string; children: React.ReactNode }) {
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
        backgroundColor: fill, // solid, so the backdrop (a cloud, a branch) never shows through
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
