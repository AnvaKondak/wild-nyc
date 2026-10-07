import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeartIcon } from '@/components/Icons';
import { StoryBackdrop } from '@/components/backdrop';
import { PeriodIcon } from '@/components/PeriodIcon';
import { PhotoViewer } from '@/components/PhotoViewer';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { encounters, getSpecies, moments, photoCreditsFor, placeKinds, speciesPhoto, speciesPhotos, type Species } from '@/content';
import { seenLabel } from '@/lib/live';
import { decodeGeohash } from '@/lib/geohash';
import { fillPlace } from '@/lib/localStory';
import { dayInTheLife, homeSetting } from '@/lib/profile';
import { dateKey, periodOf, seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { currentNeighborhood } from '@/state/selectors';
import { periodThemes } from '@/theme/periodTheme';
import { border, colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

const CHIP_TINTS = [colors.pinkTint, colors.yellowTint, colors.blueTint];

export default function SpeciesProfile() {
  // Dev only: ?photo=1 opens on that photo, big.
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  const species = getSpecies(id);
  if (!species) return <NotFound />;
  return <Profile species={species} startPhoto={__DEV__ && photo ? Number(photo) : null} />;
}

function Profile({ species, startPhoto }: { species: Species; startPhoto: number | null }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const season = seasonOf(now);
  const name = species.friendlyName.toLowerCase();
  const seen = seenLabel(useLiveData().live.get(species.id), now);
  const { state } = useAppState();
  const hood = currentNeighborhood(state);
  const { lat, lng } = decodeGeohash(hood.cell);
  const period = periodOf(now, lat, lng);
  const [width, setWidth] = useState(0);
  const heroHeight = 400 + insets.top;
  const photos = speciesPhotos(species.id);
  // Tap any photo to see it big.
  const [viewing, setViewing] = useState<number | null>(startPhoto);
  const local = placeKinds[species.homeScene].local;
  const day = dayInTheLife(species, season, moments, placeKinds[species.homeScene].where, local, dateKey(now));
  const friends = encounters.filter((e) => e.species.includes(species.id));
  const meet = (id: string) => router.push({ pathname: '/species/[id]', params: { id } });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      {/* Where they live: their kind of place, in today's season and light, with them in it. */}
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: heroHeight, backgroundColor: periodThemes[period].bg, borderBottomWidth: border.width, borderBottomColor: colors.ink, overflow: 'hidden' }}
      >
        {/* The scene is composed for a full screen; draw it taller and shift it up so the
            hero frames its middle band: skyline, trees and their spot. */}
        {width > 0 && (
          <View style={{ position: 'absolute', left: 0, top: -heroHeight * 0.4, width, height: heroHeight * 2.2 }}>
            <StoryBackdrop
              setting={homeSetting(species)}
              period={period}
              season={season}
              placeKind={species.homeScene}
              variant={0}
              moonLit={0.6}
              width={width}
              height={heroHeight * 2.2}
            />
          </View>
        )}
        <BackButton style={{ position: 'absolute', left: 16, top: insets.top + 8 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 60, alignItems: 'center' }}>
          <Pressable onPress={() => photos.length && setViewing(0)} disabled={!photos.length} accessibilityRole="imagebutton" accessibilityLabel={`${species.friendlyName} photo. Open it big`}>
            <Sticker art={species.art} photo={speciesPhoto(species.id)} size={170} tint={colors.white} rotate={-5} shadowColor={colors.blue} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 22, paddingTop: 22, gap: 6 }}>
        <Title size={species.friendlyName.length > 14 ? 36 : 46}>{species.friendlyName}</Title>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft }}>
          {species.commonName} · <Text style={{ fontFamily: fonts.displayItalic }}>{species.scientificName}</Text>
        </Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.blue }}>
          <Text style={{ fontFamily: fonts.displayItalic, fontSize: 15, color: colors.white }}>
            {species.collectiveNoun} of {name}
          </Text>
        </View>
        {seen && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, marginTop: 4 }}>{seen}</Text>}
      </View>

      {/* Their photos, to swipe through. */}
      {photos.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, gap: 12 }}>
          {photos.map((p, i) => (
            <Pressable key={i} onPress={() => setViewing(i)} accessibilityRole="imagebutton" accessibilityLabel={`${species.friendlyName}, photo ${i + 1} of ${photos.length}. Open it big`}>
              <Image
                source={p}
                style={{ width: 150, height: 150, borderRadius: 18, borderWidth: border.width, borderColor: colors.ink, transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }] }}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={{ paddingHorizontal: 22 }}>
        <PhotoCreditLine speciesId={species.id} />
      </View>

      <Card style={{ marginHorizontal: 16, marginTop: 24 }}>
        <Text style={type.kicker}>Meet the {name}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 31, color: colors.ink }}>{species.personality.type}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {species.personality.traits.map((t, i) => (
            <View key={t} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, backgroundColor: CHIP_TINTS[i % 3] }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={type.body}>{species.personality.blurb}</Text>
      </Card>

      {/* A day in their life, dawn to night, this season. */}
      {day.length > 0 && (
        <View style={{ paddingHorizontal: 22, paddingTop: 28, gap: 14 }}>
          <Text style={[type.kicker, { color: colors.pink }]}>A {season} day in their life</Text>
          {day.map((b) => (
            <View key={b.period} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', gap: 4, width: 34 }}>
                <PeriodIcon period={b.period} color={colors.ink} size={24} />
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.inkMuted }}>{b.period}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.displayRegular, fontSize: 18, lineHeight: 23, color: colors.ink }}>{b.title}</Text>
                <Text style={[type.body, { fontSize: 14, lineHeight: 20 }]}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* How they feel about us. */}
      <View style={{ marginHorizontal: 16, marginTop: 28, padding: 18, borderRadius: 20, backgroundColor: colors.blueTint, borderWidth: border.width, borderColor: colors.ink, gap: 6 }}>
        <Text style={[type.kicker, { color: colors.blue }]}>How they feel about us</Text>
        <Text style={type.serifBody}>{species.withPeople}</Text>
      </View>

      {/* Who they run into: their encounters, each a door to the other neighbor's page. */}
      {friends.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 28, gap: 12 }}>
          <Text style={[type.kicker, { color: colors.pink, paddingHorizontal: 6 }]}>Who they run into</Text>
          {friends.map((e) => {
            const other = getSpecies(e.species[0] === species.id ? e.species[1] : e.species[0])!;
            return (
              <Pressable
                key={e.id}
                onPress={() => meet(other.id)}
                accessibilityRole="button"
                accessibilityLabel={`${e.title}. Meet the ${other.friendlyName.toLowerCase()}`}
                style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: border.width, borderColor: colors.ink, backgroundColor: colors.white, opacity: pressed ? 0.7 : 1 })}
              >
                <Sticker art={other.art} photo={speciesPhoto(other.id)} size={56} tint={colors[other.tint]} rotate={-4} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: fonts.displayRegular, fontSize: 17, lineHeight: 21, color: colors.ink }}>{e.title}</Text>
                  <Text style={[type.body, { fontSize: 13, lineHeight: 19 }]}>{fillPlace(e.body, placeKinds[species.homeScene].where, local)}</Text>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.blue }}>Meet the {other.friendlyName.toLowerCase()} ›</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Their year, season by season. */}
      <View style={{ paddingHorizontal: 22, paddingTop: 28, gap: 12 }}>
        <Text style={[type.kicker, { color: colors.pink }]}>Their year</Text>
        {SEASONS.filter((x) => species.seasons.includes(x) || x === season).map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, minWidth: 74, alignItems: 'center', backgroundColor: x === season ? colors.yellow : colors.paper, borderWidth: border.width, borderColor: colors.ink }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink }}>{x === season ? `${cap(x)} · now` : cap(x)}</Text>
            </View>
            <Text style={[type.body, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{species.rightNow[x]}</Text>
          </View>
        ))}
      </View>

      <Section label="Where they came from" text={species.origin} />

      <View
        style={{
          marginHorizontal: 16,
          marginTop: 22,
          padding: 18,
          borderRadius: 18,
          backgroundColor: colors.yellowTint,
          borderWidth: border.width,
          borderColor: colors.ink,
          gap: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{species.funFact.title}</Text>
        <Text style={[type.body, { fontSize: 14 }]}>{species.funFact.body}</Text>
      </View>

      <Card background={colors.pink} shadow={null} style={{ marginHorizontal: 16, marginTop: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HeartIcon size={14} color={colors.ink} />
          <Text style={[type.kicker, { color: colors.ink }]}>A small kindness</Text>
        </View>
        <Text style={{ fontFamily: fonts.displayRegular, fontSize: 22, lineHeight: 28, color: colors.ink }}>{species.kindness.title}</Text>
        <Text style={[type.body, { fontSize: 14, color: colors.ink }]}>{species.kindness.body}</Text>
        <Button
          label="More small kindnesses"
          variant="white"
          size="medium"
          onPress={() => router.push('/kindness')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>
      <PhotoViewer photos={photos} credits={photoCreditsFor(species.id)} name={species.friendlyName} index={viewing} onClose={() => setViewing(null)} />
    </ScrollView>
  );
}

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Who took each photo, and its license. Required by CC BY / CC BY-SA. */
function PhotoCreditLine({ speciesId }: { speciesId: string }) {
  const credits = photoCreditsFor(speciesId);
  if (credits.length === 0) return null;
  return (
    <View style={{ marginTop: 6, gap: 2 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }}>{credits.length > 1 ? 'Photos (cropped), via iNaturalist:' : 'Photo (cropped), via iNaturalist:'}</Text>
      {credits.map((c) => (
        <Pressable key={c.source} onPress={() => Linking.openURL(c.source)} accessibilityRole="link" accessibilityHint="Opens the photo on iNaturalist" hitSlop={4}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, textDecorationLine: 'underline' }}>{c.attribution}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 24, gap: 8 }}>
      <Text style={[type.kicker, { color: colors.pink }]}>{label}</Text>
      <Text style={type.serifBody}>{text}</Text>
    </View>
  );
}

function NotFound() {
  return (
    <Screen contentStyle={{ paddingHorizontal: 22, gap: 16 }}>
      <BackButton />
      <Title accent="moved on" accentFirst={false}>This neighbor has</Title>
      <Text style={type.body}>We couldn't find that page.</Text>
    </Screen>
  );
}
