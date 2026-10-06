// Chapters: each season told as a story. An overview, then the stories of neighbors
// together (the acorn race, the dawn chorus), then who's arriving and who's leaving.
// One story per screen, arrows and swipes between them, over the season's animated scene.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { StoryBackdrop } from '@/components/backdrop';
import { Button } from '@/components/Button';
import { GroupSticker } from '@/components/GroupSticker';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import { PillRow } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { RoundNav, StoryCard, StoryProgress, useSwipe } from '@/components/story/parts';
import { getSpecies, speciesPhoto, type Period, type Season } from '@/content';
import { chapterSlides } from '@/lib/chapters';
import { hashString } from '@/lib/random';
import { seasonOf } from '@/lib/time';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts } from '@/theme/tokens';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
/** Each season gets its own light: spring mornings, summer middays, fall evenings, winter nights. */
const LIGHT: Record<Season, Period> = { spring: 'dawn', summer: 'midday', fall: 'dusk', winter: 'night' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Chapters() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const stickerSize = Math.min(190, Math.round(height * 0.21));
  const now = seasonOf(new Date());
  const [season, setSeason] = useState<Season>(now);
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const slides = useMemo(() => chapterSlides(season), [season]);
  useEffect(() => setIndex(0), [season]);

  const period = LIGHT[season];
  const theme = periodThemes[period];
  const i = Math.min(index, slides.length - 1);
  const slide = slides[i];
  const next = useCallback(() => setIndex((n) => (n + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((n) => Math.max(0, n - 1)), []);
  const swipe = useSwipe(next, prev);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(theme.statusBar);
      return () => setStatusBarStyle('dark');
    }, [theme.statusBar]),
  );

  const meet = (id: string) => router.push({ pathname: '/species/[id]', params: { id } });
  const one = slide.species.length === 1 ? getSpecies(slide.species[0]) : undefined;
  const last = i === slides.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={(e) => setArea(e.nativeEvent.layout)}>
      {area.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StoryBackdrop
            setting="sky"
            period={period}
            season={season}
            placeKind={slide.place}
            variant={hashString(slide.id) % 3}
            moonLit={0.6}
            width={area.width}
            height={area.height}
          />
        </View>
      )}
      <Screen background="transparent" scroll={false}>
        <View {...swipe} style={{ flex: 1 }}>
          <StoryProgress count={slides.length} index={i} theme={theme} />

          <View style={{ paddingTop: 14 }}>
            <PillRow
              items={SEASONS.map((s) => ({ id: s, label: s === now ? `${cap(s)} · now` : cap(s) }))}
              selectedId={season}
              onSelect={(id) => setSeason(id as Season)}
              ink={theme.ink}
              background={theme.bg}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 40 }}>
            <RoundNav label="Previous story" onPress={prev} color={theme.ink} fill={theme.bg}>
              <ChevronLeftIcon color={theme.ink} />
            </RoundNav>
            <Pressable onPress={next} accessibilityRole="button" accessibilityLabel="Next story">
              {one ? (
                <Sticker art={one.art} photo={speciesPhoto(one.id)} size={stickerSize} tint={colors[one.tint]} rotate={-5} shadowColor={theme.shadow} />
              ) : (
                <GroupSticker speciesIds={slide.species} size={stickerSize} tint={theme.card} ink={theme.ink} shadowColor={theme.shadow} />
              )}
            </Pressable>
            <RoundNav label="Next story" onPress={next} color={theme.ink} fill={theme.bg}>
              <ChevronRightIcon color={theme.ink} />
            </RoundNav>
          </View>

          <StoryCard kicker={slide.kicker} title={slide.title} body={slide.body} theme={theme}>
            {i > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {slide.species.map((id) => (
                  <Chip key={id} label={`Meet the ${getSpecies(id)!.friendlyName.toLowerCase()}`} onPress={() => meet(id)} ink={theme.ink} fill={theme.bg} />
                ))}
              </View>
            )}
          </StoryCard>

          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            <Button
              label={last ? 'Start over' : 'Next story'}
              onPress={last ? () => setIndex(0) : next}
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

function Chip({ label, onPress, ink, fill }: { label: string; onPress: () => void; ink: string; fill: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: 22,
        borderWidth: border.width,
        borderColor: ink,
        backgroundColor: fill,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: ink }}>{label}</Text>
    </Pressable>
  );
}
