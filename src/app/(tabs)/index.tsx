import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/backdrop';
import { Button } from '@/components/Button';
import { BellIcon, BellOffIcon, ChevronLeftIcon, ChevronRightIcon, SoundOffIcon, SoundOnIcon } from '@/components/Icons';
import { GroupSticker } from '@/components/GroupSticker';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { PeriodIcon } from '@/components/PeriodIcon';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { RoundNav, StoryCard, StoryProgress, useSwipe } from '@/components/story/parts';
import { encounters, facts, getSpecies, moments, placeKinds, places, seasonChapters, species as allSpecies, speciesPhoto, speciesPhotos, stories, type Period, type StorySlide } from '@/content';
import { decodeGeohash } from '@/lib/geohash';
import { arrivalSlide, arrivalsAmong } from '@/lib/arrivals';
import { dailyNotes } from '@/lib/dailyNote';
import { buildIntro } from '@/lib/intro';
import { buildTomorrow } from '@/lib/tomorrow';
import type { Neighborhood } from '@/lib/neighborhood';
import { aroundSlide, buildArc, pickAround, pickLead, poolFor, type StoryContext, type StoryPlace } from '@/lib/neighborStory';
import { hashString, seededRandom } from '@/lib/random';
import { dateKey, moonLitFraction, seasonOf, timeHeader } from '@/lib/time';
import { askForNotes, cancelNotes, scheduleNotes } from '@/lib/notifications';
import { pickSoundscape, SOUNDSCAPE_LABEL } from '@/lib/soundscape';
import { useAmbience, voiceFor } from '@/lib/useAmbience';
import { useNow } from '@/lib/useNow';
import { describeWeather, PREVIEW_WEATHER, type WeatherTag } from '@/lib/weather';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { useWeather } from '@/state/Weather';
import { currentNeighborhood } from '@/state/selectors';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts } from '@/theme/tokens';

const PERIOD_LABELS: Record<Period, string> = { dawn: 'Dawn', midday: 'Midday', dusk: 'Dusk', night: 'Night' };

function storyPlace(n: Neighborhood): StoryPlace {
  const place = n.placeId ? places.find((p) => p.id === n.placeId) : undefined;
  return { cell: n.cell, kind: n.kind, placeName: place?.name ?? null, where: placeKinds[n.kind].where, local: place?.local ?? placeKinds[n.kind].local };
}

function tileFor(slide: StorySlide): string {
  const s = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  return s ? colors[s.tint] : colors.blueTint;
}

export default function RightNow() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  // Smaller phones get a smaller sticker so the story still fits without scrolling.
  const stickerSize = Math.min(190, Math.round(height * 0.21));
  const now = useNow();
  const { state, actions } = useAppState();
  const { live } = useLiveData();
  const hood = currentNeighborhood(state);

  // Sun times come from the cell's center, never the user's exact position.
  const { lat, lng } = decodeGeohash(hood.cell);
  const realHeader = timeHeader(now, lat, lng);
  // Dev only: tap the time header to preview each time-of-day theme.
  // Dev only: ?period=dusk&weather=rain in the URL starts on a preview too.
  const params = useLocalSearchParams<{ period?: Period; weather?: WeatherTag; slide?: string }>();
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
  // The story follows one neighbor: today's lead here at this time of day. "Also around
  // today" at the end opens a short story about someone else (visiting).
  const [visiting, setVisiting] = useState<string | null>(null);
  const yesterday = dateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const { lead, around, arrived, ctx, here, placesInOrder, at } = useMemo(() => {
    const ctx: StoryContext = { allSpecies, moments, facts, chapters: seasonChapters, encounters, season, period: header.period, live, weather: weather?.tags ?? [] };
    const saved = state.neighborhoods.length > 0 ? state.neighborhoods : [hood];
    const at = Math.max(0, saved.findIndex((n) => n.id === hood.id));
    const placesInOrder = saved.map(storyPlace);
    const here = placesInOrder[at] ?? storyPlace(hood);
    const lead = pickLead(placesInOrder, at, ctx, today, yesterday);
    // Migrants who just got here for the season, newest first.
    const arrived = arrivalsAmong(poolFor(hood.kind, ctx), now);
    return { lead, around: pickAround(here, ctx, lead, `${hood.cell}:${today}:${header.period}`, arrived), arrived, ctx, here, placesInOrder, at };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, header.period, hood.id, hood.cell, state.neighborhoods, live, today, weatherKey]);

  const story = useMemo(() => {
    const random = seededRandom(`${hood.cell}:${today}:${header.period}:${visiting ?? 'lead'}`);
    const last = aroundSlide(here, ctx, around, lead, arrived);
    const visit = visiting ? getSpecies(visiting) : undefined;
    // Today's cast: encounters are with neighbors who are actually around.
    const cast = [...(lead ? [lead.id] : []), ...around.map((s) => s.id)];
    if (visit) return [...buildArc(visit, here, ctx, 'visit', random, { today: cast, favor: lead?.id }), last];
    // The story opens on where we are, how it feels, who's up, and who we're following.
    const intro = buildIntro({
      period: header.period,
      season,
      weather,
      placeName,
      where: here.where,
      local: here.local,
      lead,
      featured: around,
      residents: poolFor(hood.kind, ctx),
      random,
    });
    // Whoever just arrived for the season comes first, every time.
    const phrase = here.placeName ? `near ${here.placeName}` : here.where;
    const newcomer = arrived.find((s) => s.id === lead?.id) ?? arrived[0];
    const arrival = newcomer ? arrivalSlide(newcomer, stories, now, phrase, here.local, ctx.weather, random) : undefined;
    // A reason to come back tomorrow: an arrival, a migration wind, frost, or tomorrow's neighbor.
    const teaser = buildTomorrow({ places: placesInOrder, index: at, ctx, now, forecast: weather?.tomorrow, random });
    return [intro, ...(arrival ? [arrival] : []), ...(lead ? buildArc(lead, here, ctx, 'lead', random, { today: cast }) : []), teaser, last];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, around, arrived, ctx, here, visiting, placesInOrder, at]);

  // Switching neighborhood or time of day restarts the story.
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Dev only: ?slide=3 opens on that slide the first time.
  const startAt = useRef(__DEV__ && params.slide ? Number(params.slide) : 0);
  useEffect(() => {
    setIndex(startAt.current);
    startAt.current = 0;
    setVisiting(null);
  }, [hood.id, header.period, season, weatherKey]);
  const i = Math.min(index, story.length - 1);
  const slide = story[i];

  const next = useCallback(() => setIndex((n) => (n + 1) % story.length), [story.length]);
  const prev = useCallback(() => setIndex((n) => Math.max(0, n - 1)), []);

  // Swipe left/right, like stories.
  const swipe = useSwipe(next, prev);

  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(theme.statusBar);
      setFocused(true);
      return () => {
        setStatusBarStyle('dark');
        setFocused(false);
      };
    }, [theme.statusBar]),
  );

  // The one-a-day morning note, if it's on: rescheduled for the week ahead whenever the
  // neighborhood or the day changes, so it always matches where you are.
  useEffect(() => {
    if (!state.notesOn) return;
    scheduleNotes(dailyNotes(placesInOrder, at, { allSpecies, moments, facts, chapters: seasonChapters, live }, new Date())).catch(() => {});
  }, [state.notesOn, placesInOrder, at, live, today]);
  const toggleNotes = async () => {
    if (state.notesOn) {
      actions.setNotes(false);
      cancelNotes().catch(() => {});
    } else if (await askForNotes().catch(() => false)) {
      actions.setNotes(true);
    }
  };

  // What you'd hear out there right now, if sound is on.
  const soundscape = pickSoundscape(season, header.period, weather?.sky, weather?.tags);
  // A light layer of neighbors' voices: the story's animal first, then others around.
  const voiceIds = useMemo(() => [visiting ?? lead?.id, lead?.id, ...around.map((s) => s.id)].filter((id): id is string => !!id), [visiting, lead, around]);
  useAmbience(soundscape, voiceIds, state.soundOn, focused);
  const firstVoice = voiceIds.find((id) => voiceFor(id));
  const listening = firstVoice
    ? `${SOUNDSCAPE_LABEL[soundscape]}, with the ${getSpecies(firstVoice)!.friendlyName.toLowerCase()} nearby`
    : SOUNDSCAPE_LABEL[soundscape];

  if (!slide) return <Screen background={theme.bg} scroll={false}>{null}</Screen>;

  const species = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  const ctaLabel = slide.cta ?? (species ? `Meet the ${species.friendlyName.toLowerCase()}` : 'Learn more');
  // From "Also around today": someone else's short story, or back to today's lead.
  const openNeighbor = (id: string) => {
    setVisiting(id === lead?.id ? null : id);
    setIndex(id === lead?.id ? 1 : 0);
  };
  const onCta = () => {
    if (slide.kind === 'intro' || slide.kind === 'tomorrow') next();
    else if (slide.kind === 'around') {
      setVisiting(null);
      setIndex(0);
    } else if (slide.link === 'kindness') router.push('/kindness');
    else if (species) router.push({ pathname: '/species/[id]', params: { id: species.id } });
  };

  const setting = slide.setting ?? (header.period === 'night' ? 'night-sky' : 'sky');
  // A different photo of the same animal on each slide of their story.
  const photos = speciesPhotos((species ?? getSpecies('rock-pigeon')!).id);
  const slidePhoto = photos[(slide.photoIndex ?? 0) % photos.length];
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
            sky={weather?.sky}
            weather={weather?.tags}
            width={area.width}
            height={area.height}
          />
        </View>
      )}
      <Screen background="transparent" scroll={false}>
        <View {...swipe} style={{ flex: 1 }}>
          <StoryProgress count={story.length} index={i} theme={theme} />

          <View style={{ paddingTop: 14 }}>
            <NeighborhoodPills ink={theme.ink} background={theme.bg} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
            <Pressable
              onPress={__DEV__ ? cyclePreview : undefined}
              onLongPress={__DEV__ ? cycleWeather : undefined}
              disabled={!__DEV__}
              accessible
              accessibilityLabel={`${header.label}, ${header.clock}. ${weatherLine}`}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 22, paddingRight: 8, paddingTop: 18 }}
            >
              <PeriodIcon period={header.period} color={theme.ink} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: theme.ink }}>
                  {header.label} · {header.clock}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted }}>{weatherLine}</Text>
                {state.soundOn && (
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted }}>Listening to {listening}</Text>
                )}
              </View>
            </Pressable>
            <Pressable
              onPress={toggleNotes}
              accessibilityRole="switch"
              accessibilityState={{ checked: state.notesOn }}
              accessibilityLabel="A good-morning note each day, with today's neighbor"
              hitSlop={6}
              style={({ pressed }) => ({
                marginTop: 18,
              marginRight: 8,
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: border.width,
                borderColor: theme.ink,
                backgroundColor: state.notesOn ? theme.ink : theme.bg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {state.notesOn ? <BellIcon color={theme.bg} /> : <BellOffIcon color={theme.ink} />}
            </Pressable>
            <Pressable
              onPress={() => actions.setSound(!state.soundOn)}
              accessibilityRole="switch"
              accessibilityState={{ checked: state.soundOn }}
              accessibilityLabel={`Sounds of the neighborhood: ${listening}`}
              hitSlop={6}
              style={({ pressed }) => ({
                marginTop: 18,
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: border.width,
                borderColor: theme.ink,
                backgroundColor: state.soundOn ? theme.ink : theme.bg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {state.soundOn ? <SoundOnIcon color={theme.bg} /> : <SoundOffIcon color={theme.ink} />}
            </Pressable>
          </View>

          {slide.kind === 'around' ? (
            // Who else is around: tap one for their story. Today's neighbor is first.
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 10, rowGap: 14, paddingHorizontal: 16, marginTop: 24 }}>
              {(slide.aroundSpecies ?? []).map((id, n) => {
                const s = getSpecies(id)!;
                const isLead = id === lead?.id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => openNeighbor(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.friendlyName}${isLead ? ', today\'s neighbor' : ''}${slide.arrivedSpecies?.includes(id) ? ', just arrived' : ''}. See their story`}
                    style={({ pressed }) => ({ width: 88, alignItems: 'center', gap: 5, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Sticker art={s.art} photo={speciesPhoto(id)} size={66} tint={colors[s.tint]} rotate={n % 2 ? 5 : -4} shadowColor={isLead ? theme.shadow : colors.ink} />
                    {/* Names sit on a solid tag so they read over any scene. */}
                    <View style={{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: theme.ink, backgroundColor: theme.card }}>
                      <Text numberOfLines={2} style={{ fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 15, textAlign: 'center', color: theme.ink }}>
                        {isLead ? `★ ${s.friendlyName}` : s.friendlyName}
                      </Text>
                    </View>
                    {slide.arrivedSpecies?.includes(id) && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.pink }}>
                        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.ink }}>Just arrived</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            /* Prev / next sit beside the photo, in the middle of the screen. */
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
                ) : slide.cast ? (
                  <GroupSticker speciesIds={slide.cast} size={stickerSize} tint={theme.card} ink={theme.ink} shadowColor={theme.shadow} />
                ) : (
                  <Sticker
                    art={(species ?? getSpecies('rock-pigeon')!).art}
                    photo={slidePhoto}
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
          )}

          <StoryCard kicker={slide.kicker} title={slide.title} body={slide.body} fact={slide.fact} theme={theme} />

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
