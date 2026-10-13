import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/backdrop';
import { Button } from '@/components/Button';
import { FavoriteButton } from '@/components/FavoriteButton';
import { CloseUp, closeUpFor } from '@/components/scene/CloseUp';
import { PopIn, RisingHearts } from '@/components/story/Cute';
import { FloatingCast } from '@/components/Floating';
import { BellIcon, BellOffIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, HomeIcon, SoundOffIcon, SoundOnIcon } from '@/components/Icons';
import { GroupSticker } from '@/components/GroupSticker';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { PeriodIcon } from '@/components/PeriodIcon';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { RoundNav, StoryCard, StoryProgress, useSwipe } from '@/components/story/parts';
import { encounters, events, facts, families, sightings, getSpecies, moments, placeKinds, places, seasonChapters, species as allSpecies, speciesPhoto, speciesPhotos, stories, type Period, type StorySlide } from '@/content';
import { decodeGeohash } from '@/lib/geohash';
import { arrivalSlide, arrivalsAmong } from '@/lib/arrivals';
import { dailyNotes } from '@/lib/dailyNote';
import { activeEvent, eventSlide } from '@/lib/events';
import { cameoFor } from '@/lib/cameo';
import { buildIntro } from '@/lib/intro';
import { buildTomorrow } from '@/lib/tomorrow';
import type { Neighborhood } from '@/lib/neighborhood';
import { aroundSlide, buildArc, pickAround, pickLead, poolFor, type StoryContext, type StoryPlace } from '@/lib/neighborStory';
import { favoritesStory } from '@/lib/favoritesStory';
import { withMoods } from '@/lib/mood';
import { hashString, seededRandom } from '@/lib/random';
import { dateKey, moonLitFraction, seasonOf, timeHeader } from '@/lib/time';
import { askForNotes, cancelNotes, scheduleNotes } from '@/lib/notifications';
import { pickSoundscape, SOUNDSCAPE_LABEL } from '@/lib/soundscape';
import { useAmbience } from '@/lib/useAmbience';
import { useNow } from '@/lib/useNow';
import { describeWeather, PREVIEW_WEATHER, type WeatherTag } from '@/lib/weather';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { useWeather } from '@/state/Weather';
import { currentNeighborhood } from '@/state/selectors';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { lowerName } from '@/lib/names';

const PERIOD_LABELS: Record<Period, string> = { dawn: 'Dawn', midday: 'Midday', dusk: 'Dusk', night: 'Night' };
const GREETINGS: Record<Period, string> = { dawn: 'Good morning', midday: 'Good afternoon', dusk: 'Good evening', night: 'Hello, night owl' };
/** After this long away, opening the app again starts on the home screen. */
const HOME_AFTER = 30 * 60 * 1000;

/** "the robins, the crows and 3 more" style lists, lowercase. */
function namesList(names: string[]): string {
  const shown = names.length <= 4 ? names : names.slice(0, 3);
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(', ')} and ${rest} more`;
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}` : shown[0] ?? '';
}

function storyPlace(n: Neighborhood): StoryPlace {
  const place = n.placeId ? places.find((p) => p.id === n.placeId) : undefined;
  return { cell: n.cell, kind: n.kind, placeName: place?.name ?? null, where: placeKinds[n.kind].where, local: place?.local ?? placeKinds[n.kind].local, placeId: n.placeId };
}

function tileFor(slide: StorySlide): string {
  const s = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  return s ? colors[s.tint] : colors.blueTint;
}

export default function RightNow() {
  const router = useRouter();
  const { width: screenWidth, height } = useWindowDimensions();
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
  // Dev only: ?faves=rock-pigeon,raccoon opens the favorites story with those favorites.
  const params = useLocalSearchParams<{ period?: Period; weather?: WeatherTag; slide?: string; faves?: string }>();
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
  // How the place looks and sounds (usually its kind; Liberty State Park looks like a park).
  const scene = place?.scene ?? hood.kind;
  const today = dateKey(now);
  // The story follows one neighbor: today's lead here at this time of day. "Also around
  // today" at the end opens a short story about someone else (visiting).
  const [visiting, setVisiting] = useState<string | null>(null);
  const yesterday = dateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const { lead, around, arrived, ctx, here, placesInOrder, at } = useMemo(() => {
    const ctx: StoryContext = { allSpecies, moments, facts, chapters: seasonChapters, encounters, families, sightings, season, period: header.period, live, weather: weather?.tags ?? [] };
    const saved = state.neighborhoods.length > 0 ? state.neighborhoods : [hood];
    const at = Math.max(0, saved.findIndex((n) => n.id === hood.id));
    const placesInOrder = saved.map(storyPlace);
    const here = placesInOrder[at] ?? storyPlace(hood);
    const lead = pickLead(placesInOrder, at, ctx, today, yesterday);
    // Migrants who just got here for the season, newest first.
    const arrived = arrivalsAmong(poolFor(hood.kind, ctx, hood.placeId), now);
    return { lead, around: pickAround(here, ctx, lead, `${hood.cell}:${today}:${header.period}`, arrived), arrived, ctx, here, placesInOrder, at };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, header.period, hood.id, hood.cell, state.neighborhoods, live, today, weatherKey]);

  const hoodStory = useMemo(() => {
    const random = seededRandom(`${hood.cell}:${today}:${header.period}:${visiting ?? 'lead'}`);
    const last = aroundSlide(here, ctx, around, lead, arrived);
    const visit = visiting ? getSpecies(visiting) : undefined;
    // Today's cast: encounters are with neighbors who are actually around.
    const cast = [...(lead ? [lead.id] : []), ...around.map((s) => s.id)];
    if (visit) return withMoods([...buildArc(visit, here, ctx, 'visit', random, { today: cast, favor: lead?.id }), last]);
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
      residents: poolFor(hood.kind, ctx, hood.placeId),
      random,
    });
    // Whoever just arrived for the season comes first, every time.
    const phrase = here.placeName ? `near ${here.placeName}` : here.where;
    const newcomer = arrived.find((s) => s.id === lead?.id) ?? arrived[0];
    const arrival = newcomer ? arrivalSlide(newcomer, stories, now, phrase, here.local, ctx.weather, random) : undefined;
    // A reason to come back tomorrow: an arrival, a migration wind, frost, or tomorrow's neighbor.
    const teaser = buildTomorrow({ places: placesInOrder, index: at, ctx, now, forecast: weather?.tomorrow, random });
    // A big moment of the season (the dawn chorus, a migration night, a snow day) comes first.
    const moment = activeEvent(events, now, weather);
    const big = moment ? [eventSlide(moment, now, phrase, here.local, random)] : [];
    // Each drawing matches what its slide says: asleep, snacking, delighted or saying hello.
    return withMoods([intro, ...big, ...(arrival ? [arrival] : []), ...(lead ? buildArc(lead, here, ctx, 'lead', random, { today: cast }) : []), teaser, last]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, around, arrived, ctx, here, visiting, placesInOrder, at]);

  // The ♥ Favorites pill: what your favorite kinds of animals are up to right now, wherever
  // they are in the city, in story form.
  const [faves, setFaves] = useState(!!(__DEV__ && params.faves));
  useEffect(() => {
    if (!__DEV__ || !params.faves) return;
    for (const id of params.faves.split(',')) if (!state.favorites.includes(id)) actions.toggleFavorite(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.faves]);
  const favStory = useMemo(
    () => withMoods(favoritesStory({ favorites: state.favorites, ctx: { ...ctx, weather: [] }, saved: placesInOrder, places, kinds: placeKinds, date: today })),
    [state.favorites, ctx, placesInOrder, today],
  );
  const story = faves ? favStory : hoodStory;

  // Switching neighborhood (or between a neighborhood and favorites) starts the story
  // over. A new time of day, weather or season updates it in place: you stay on your slide.
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Where the animal goes in a full-screen close-up: the spot the sticker would take,
  // measured on screen.
  const [band, setBand] = useState<{ top: number; height: number } | null>(null);
  const bandRef = useRef<View>(null);
  // Dev only: ?slide=3 opens on that slide the first time.
  const startAt = useRef(__DEV__ && params.slide ? Number(params.slide) : 0);
  useEffect(() => {
    setIndex(startAt.current);
    startAt.current = 0;
    setVisiting(null);
  }, [hood.id, faves]);
  const i = Math.min(index, story.length - 1);
  const slide = story[i];

  const next = useCallback(() => setIndex((n) => (n + 1) % story.length), [story.length]);
  const prev = useCallback(() => setIndex((n) => Math.max(0, n - 1)), []);

  // The home screen comes first each time the app opens (and after a while away):
  // today's neighbors floating over the scene, then into the story or the whole cast.
  const [home, setHome] = useState(!(__DEV__ && params.slide));
  const awaySince = useRef(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') awaySince.current = Date.now();
      else if (s === 'active' && awaySince.current && Date.now() - awaySince.current > HOME_AFTER) setHome(true);
    });
    return () => sub.remove();
  }, []);
  const startStory = useCallback(() => {
    setVisiting(null);
    setIndex(0);
    setHome(false);
  }, []);
  const seeEveryone = () => {
    setIndex(story.length - 1);
    setHome(false);
  };
  // Favorites skip the home screen: their story is the page.
  const showHome = home && !faves;
  // Back from the first slide goes home (a neighborhood's, not the favorites').
  const back = useCallback(() => (i === 0 && !faves ? setHome(true) : prev()), [i, prev, faves]);

  // Swipe left/right, like stories. On the home screen, swiping left starts the story.
  const swipe = useSwipe(showHome ? startStory : next, showHome ? () => {} : back);

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
    scheduleNotes(dailyNotes(placesInOrder, at, { allSpecies, moments, facts, chapters: seasonChapters, live, sightings }, new Date())).catch(() => {});
  }, [state.notesOn, placesInOrder, at, live, today]);
  const toggleNotes = async () => {
    if (state.notesOn) {
      actions.setNotes(false);
      cancelNotes().catch(() => {});
    } else if (await askForNotes().catch(() => false)) {
      actions.setNotes(true);
    }
  };

  // A gentle sound of the kind of place (or the rain), if sound is on.
  // In the favorites story each animal brings their own kind of place, and its sound.
  const sceneNow = faves ? (slide?.scene ?? 'park') : scene;
  const soundscape = pickSoundscape(sceneNow, header.period, season, faves ? [] : weather?.tags);
  useAmbience(soundscape, state.soundOn, focused);
  const listening = SOUNDSCAPE_LABEL[soundscape];

  if (!slide) return <Screen background={theme.bg} scroll={false}>{null}</Screen>;

  const species = slide.speciesId ? getSpecies(slide.speciesId) : undefined;
  const ctaLabel = slide.cta ?? (species ? `Meet the ${lowerName(species.friendlyName)}` : 'Learn more');
  // From "Also around today": someone else's short story, or back to today's lead.
  const openNeighbor = (id: string) => {
    setVisiting(id === lead?.id ? null : id);
    setIndex(id === lead?.id ? 1 : 0);
  };
  // The button only ever opens a page: the animal's profile or the kindness list.
  // Moving through the story is the arrows' job (and swiping).
  const opensPage = slide.kind === 'favorites-empty' || (slide.kind !== 'intro' && slide.kind !== 'tomorrow' && slide.kind !== 'around' && slide.kind !== 'favorites' && (slide.link === 'kindness' || !!species));
  const onCta = () => {
    if (slide.kind === 'favorites-empty') router.push('/search');
    else if (slide.link === 'kindness') router.push('/kindness');
    else if (species) router.push({ pathname: '/species/[id]', params: { id: species.id } });
  };

  const others = around.filter((s) => s.id !== lead?.id);
  const homeCast = [...(lead ? [lead.id] : []), ...others.map((s) => s.id)];
  const homeList = namesList(others.map((s) => lowerName(s.friendlyName)));
  const homeBody = lead
    ? `Today we're following the ${lowerName(lead.friendlyName)}.${homeList ? ` The ${homeList} are around too.` : ''}`
    : 'Come see who\'s around.';

  const setting = slide.setting ?? (header.period === 'night' ? 'night-sky' : 'sky');
  // A different photo of the same animal on each slide of their story.
  const photos = speciesPhotos((species ?? getSpecies('rock-pigeon')!).id);
  const slidePhoto = photos[(slide.photoIndex ?? 0) % photos.length];
  // Favorites are all over the city, so their story skips one neighborhood's weather.
  const weatherLine = weather && !faves ? `${describeWeather(weather)}${previewWeather ? ' (preview)' : ''} · ${header.sub}` : header.sub;
  const isGrid = slide.kind === 'around' || slide.kind === 'favorites';
  // Pilot: some animals appear right in their setting (on a branch, a sidewalk, the
  // water) instead of on a round sticker.
  const closeUp = slide.kind === 'intro' || slide.cast ? undefined : closeUpFor(species?.id, slide.setting);
  const sceneH = Math.round(stickerSize * 1.1);
  // From the favorites grid: jump back to that favorite's slide.
  const openFavorite = (id: string) => setIndex(Math.max(0, story.findIndex((s) => s.speciesId === id)));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={(e) => setArea(e.nativeEvent.layout)}>
      {/* The moment's setting fills the whole story; the animal is the one circle on top. */}
      {area.width > 0 && closeUp && species && band ? (
        // A close-up fills the whole screen: the animal right in their setting.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <CloseUp
            setting={closeUp}
            speciesId={species.id}
            mood={slide.kind === 'favorite' ? slide.mood : (slide.mood ?? slide.photoIndex ?? 0)}
            width={area.width}
            height={area.height}
            band={band}
            period={header.period}
            season={season}
            sky={theme.bg}
            weather={faves ? undefined : weather?.sky}
            placeId={faves ? slide.placeId : hood.placeId}
            placeKind={faves ? (slide.scene ?? 'park') : hood.kind}
          />
        </View>
      ) : area.width > 0 && !closeUp ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StoryBackdrop
            setting={setting}
            period={header.period}
            season={season}
            placeKind={sceneNow}
            placeId={faves ? undefined : hood.placeId}
            variant={hashString(`${slide.id}:${today}`) % 3}
            moonLit={moonLitFraction(now)}
            sky={faves ? undefined : weather?.sky}
            weather={faves ? undefined : weather?.tags}
            cameo={cameoFor(slide.cameo ? getSpecies(slide.cameo) : undefined)}
            width={area.width}
            height={area.height}
          />
        </View>
      ) : null}
      <Screen background="transparent" scroll={false}>
        <View {...swipe} style={{ flex: 1 }}>
          {!showHome && <StoryProgress count={story.length} index={i} theme={theme} />}

          <View style={{ paddingTop: 14 }}>
            <NeighborhoodPills
              ink={theme.ink}
              background={theme.bg}
              favoritesOn={faves}
              onFavorites={() => setFaves(true)}
              onNeighborhood={() => setFaves(false)}
            />
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
            {!showHome && !faves && (
              <Pressable
                onPress={() => setHome(true)}
                accessibilityRole="button"
                accessibilityLabel="Home"
                hitSlop={6}
                style={({ pressed }) => ({ marginTop: 18, marginRight: 8, width: 44, height: 44, borderRadius: 22, borderWidth: border.width, borderColor: theme.ink, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
              >
                <HomeIcon color={theme.ink} />
              </Pressable>
            )}
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

          {showHome ? (
            <>
              <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 30, color: theme.ink, paddingHorizontal: 22, paddingTop: 14, textShadowColor: header.period === 'dusk' || header.period === 'night' ? colors.ink : colors.yellow, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 }}>
                Wild <Text style={{ fontFamily: fonts.displayItalic, color: theme.accent }}>Neighbors</Text>
              </Text>
              <View style={{ height: 215, marginTop: 10 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <FloatingCast ids={homeCast} scale={0.86} />
              </View>
              <StoryCard kicker={GREETINGS[header.period]} title={placeName ? `Today in ${placeName}` : `Today ${here.where}`} body={homeBody} theme={theme} bottom />
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Button
                  label={lead ? `Today's story: the ${lowerName(lead.friendlyName)}` : "Today's story"}
                  onPress={startStory}
                  shadow={theme.shadow}
                  style={{ backgroundColor: theme.btnBg }}
                  color={theme.btnInk}
                />
                <Pressable onPress={seeEveryone} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: theme.ink, textDecorationLine: 'underline' }}>See everyone around</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* The middle of the slide scrolls as one: picture, shortcut and words. The
                  bars, places and time stay put above; the button stays put below. */}
              <ScrollView key={`${faves ? 'faves' : visiting ?? 'lead'}:${slide.id}`} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
              {isGrid ? (
                // Who else is around (or all your favorites): tap one for their story.
                <>
                {/* Back to the story, without having to swipe. */}
                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                  <RoundNav label="Back to the story" onPress={prev} color={theme.ink} fill={theme.bg}>
                    <ChevronLeftIcon color={theme.ink} />
                  </RoundNav>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 10, rowGap: 14, paddingHorizontal: 16, marginTop: 8 }}>
                  {(slide.aroundSpecies ?? []).map((id, n) => {
                    const s = getSpecies(id)!;
                    const isLead = !faves && id === lead?.id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => (faves ? openFavorite(id) : openNeighbor(id))}
                        accessibilityRole="button"
                        accessibilityLabel={`${s.friendlyName}${isLead ? ', today\'s neighbor' : ''}${slide.arrivedSpecies?.includes(id) ? ', just arrived' : ''}. See their story`}
                        style={({ pressed }) => ({ width: 88, alignItems: 'center', gap: 5, opacity: pressed ? 0.6 : 1 })}
                      >
                        <Sticker art={s.art} photo={speciesPhoto(id)} speciesId={id} size={66} tint={colors[s.tint]} rotate={n % 2 ? 5 : -4} shadowColor={isLead ? theme.shadow : colors.ink} />
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
                </>
              ) : closeUp && species ? (
                // The scene behind draws the animal here; this keeps their spot, with
                // prev / next beside them and the ♥ at their feet.
                <View
                  ref={bandRef}
                  onLayout={() => bandRef.current?.measureInWindow((_x, y, _w, h) => setBand((b) => (b && b.top === y && b.height === h ? b : { top: y, height: h })))}
                  style={{ height: sceneH, marginTop: 16 }}
                >
                  <Pressable onPress={next} accessibilityRole="button" accessibilityLabel={`${species.friendlyName}. Next story`} style={{ position: 'absolute', left: 70, right: 70, top: 0, bottom: 0 }} />
                  <View style={{ position: 'absolute', left: 16, top: sceneH / 2 - 26 }}>
                    <RoundNav label={i === 0 && !faves ? 'Home' : 'Previous story'} onPress={back} color={theme.ink} fill={theme.bg}>
                      <ChevronLeftIcon color={theme.ink} />
                    </RoundNav>
                  </View>
                  <View style={{ position: 'absolute', right: 16, top: sceneH / 2 - 26 }}>
                    <RoundNav label="Next story" onPress={next} color={theme.ink} fill={theme.bg}>
                      <ChevronRightIcon color={theme.ink} />
                    </RoundNav>
                  </View>
                  <View style={{ position: 'absolute', right: 24, bottom: -6 }}>
                    <FavoriteButton speciesId={species.id} size="round" ink={theme.ink} background={theme.bg} />
                  </View>
                </View>
              ) : (
                /* Prev / next sit beside the photo, in the middle of the screen. */
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20 }}>
                  <RoundNav label={i === 0 && !faves ? 'Home' : 'Previous story'} onPress={back} color={theme.ink} fill={theme.bg}>
                    <ChevronLeftIcon color={theme.ink} />
                  </RoundNav>
                  <View>
                    <Pressable
                      onPress={next}
                      accessibilityRole="button"
                      accessibilityLabel={`${slide.kind === 'intro' ? 'Who\'s up' : species?.friendlyName ?? 'Animal'} photo. Next story`}
                    >
                      {slide.kind === 'favorites-empty' ? (
                        <View style={{ width: stickerSize, height: stickerSize, borderRadius: stickerSize / 2, borderWidth: 6, borderColor: colors.white, backgroundColor: colors.pinkTint, alignItems: 'center', justifyContent: 'center', boxShadow: offsetShadow(theme.shadow, 6) }}>
                          <HeartIcon size={stickerSize * 0.45} color={colors.ink} fill={colors.pink} />
                        </View>
                      ) : slide.kind === 'favorite' ? (
                        <PopIn key={slide.id}>
                          <Sticker
                            art={(species ?? getSpecies('rock-pigeon')!).art}
                            photo={slidePhoto}
                            speciesId={species?.id}
                            mood={slide.mood ?? 0}
                            size={stickerSize}
                            tint={tileFor(slide)}
                            rotate={-5}
                            shadowColor={theme.shadow}
                          />
                          {slide.mood !== 'sleepy' && <RisingHearts size={stickerSize} />}
                        </PopIn>
                      ) : slide.kind === 'intro' ? (
                        <GroupSticker period={header.period} speciesIds={slide.introSpecies ?? []} size={stickerSize} tint={theme.card} ink={theme.ink} shadowColor={theme.shadow} />
                      ) : slide.cast ? (
                        <GroupSticker speciesIds={slide.cast} size={stickerSize} tint={theme.card} ink={theme.ink} shadowColor={theme.shadow} />
                      ) : (
                        <Sticker
                          art={(species ?? getSpecies('rock-pigeon')!).art}
                          photo={slidePhoto}
                          speciesId={species?.id}
                          mood={slide.mood ?? slide.photoIndex ?? 0}
                          size={stickerSize}
                          tint={tileFor(slide)}
                          rotate={-5}
                          shadowColor={theme.shadow}
                        />
                      )}
                    </Pressable>
                    {/* Add them to your favorites right from the story. */}
                    {species && slide.kind !== 'intro' && !slide.cast && (
                      <View style={{ position: 'absolute', right: -6, bottom: 0 }}>
                        <FavoriteButton speciesId={species.id} size="round" ink={theme.ink} background={theme.bg} />
                      </View>
                    )}
                  </View>
                  <RoundNav label="Next story" onPress={next} color={theme.ink} fill={theme.bg}>
                    <ChevronRightIcon color={theme.ink} />
                  </RoundNav>
                </View>
              )}

              <StoryCard kicker={slide.kicker} title={slide.title} body={slide.body} fact={slide.fact} chip={slide.status} theme={theme} scroll={false} />
              </ScrollView>

              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                {opensPage && (
                  <Button
                    label={ctaLabel}
                    onPress={onCta}
                    shadow={theme.shadow}
                    style={{ backgroundColor: theme.btnBg }}
                    color={theme.btnInk}
                  />
                )}
                {/* A shortcut to everyone around (or all your favorites), without tapping through. */}
                {!isGrid && slide.kind !== 'favorites-empty' ? (
                  <Pressable
                    onPress={() => setIndex(story.length - 1)}
                    accessibilityRole="button"
                    accessibilityLabel={faves ? 'See all your favorites' : 'See everyone around today'}
                    style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: theme.ink, textDecorationLine: 'underline' }}>
                      {faves ? 'All your favorites' : 'See everyone around'}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ minHeight: 12 }} />
                )}
              </View>
            </>
          )}
        </View>
      </Screen>
    </View>
  );
}
