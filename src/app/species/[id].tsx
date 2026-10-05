import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CheckIcon, EyeIcon, HeartIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { getSpecies, photoCredit, speciesPhoto, type Species } from '@/content';
import { seenLabel } from '@/lib/live';
import { seasonOf } from '@/lib/time';
import { useLiveData } from '@/state/LiveData';
import { useNoticed } from '@/state/useNoticed';
import { border, colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

const CHIP_TINTS = [colors.pinkTint, colors.yellowTint, colors.blueTint];

export default function SpeciesProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const species = getSpecies(id);
  if (!species) return <NotFound />;
  return <Profile species={species} />;
}

function Profile({ species }: { species: Species }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { noticedToday, met, toggle } = useNoticed(species.id);
  const season = seasonOf(new Date());
  const name = species.friendlyName.toLowerCase();
  const seen = seenLabel(useLiveData().live.get(species.id), new Date());

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View
        style={{
          height: 300 + insets.top,
          paddingTop: insets.top,
          backgroundColor: colors[species.tint === 'yellow' ? 'yellowTint' : species.tint === 'pink' ? 'pinkTint' : species.tint],
          borderBottomWidth: border.width,
          borderBottomColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BackButton style={{ position: 'absolute', left: 16, top: insets.top + 8 }} />
        {met && (
          <View
            style={{
              position: 'absolute',
              right: 16,
              top: insets.top + 12,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: colors.yellow,
              borderWidth: border.width,
              borderColor: colors.ink,
            }}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink }}>You've met them</Text>
          </View>
        )}
        <Sticker art={species.art} photo={speciesPhoto(species.id)} size={170} tint={colors.white} rotate={-5} shadowColor={colors.blue} style={{ marginTop: 24 }} />
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
        <PhotoCreditLine speciesId={species.id} />
      </View>

      <Card style={{ marginHorizontal: 16, marginTop: 24 }}>
        <Text style={type.kicker}>Personality type</Text>
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

      <Section label="Where they came from" text={species.origin} />
      <Section label="In their lives right now" text={species.rightNow[season]} />

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

      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Button
          label={noticedToday ? `Noticed ${name} today` : `I noticed ${name} today`}
          shadow={colors.yellow}
          selected={noticedToday}
          icon={noticedToday ? <CheckIcon size={18} color={colors.white} /> : <EyeIcon color={colors.white} />}
          accessibilityHint={noticedToday ? 'Tap again to undo' : 'Saves that you noticed them, on this phone only'}
          onPress={toggle}
        />
      </View>
    </ScrollView>
  );
}

/** Who took the photo, and its license. Required by CC BY / CC BY-SA. */
function PhotoCreditLine({ speciesId }: { speciesId: string }) {
  const credit = photoCredit(speciesId);
  if (!credit) return null;
  return (
    <Pressable onPress={() => Linking.openURL(credit.source)} accessibilityRole="link" accessibilityHint="Opens the photo on iNaturalist" hitSlop={6}>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 6 }}>
        Photo: {credit.attribution}. Cropped. Via iNaturalist.
      </Text>
    </Pressable>
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
