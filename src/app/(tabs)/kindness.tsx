import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRightIcon, CheckIcon, HelpCrossIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Title } from '@/components/Title';
import { kindnessesFor, soundCredits } from '@/content';
import { seasonKey, seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { kindnessDone } from '@/state/selectors';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

export default function Kindness() {
  const router = useRouter();
  const { state, actions } = useAppState();
  const now = new Date();
  const key = seasonKey(now);
  const list = kindnessesFor(seasonOf(now));
  const done = kindnessDone(state, key);
  const count = list.filter((k) => done[k.id]).length;

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        <Title accent="kindnesses" size={38}>Small</Title>
        <Text style={type.body}>Little things that make city life easier for your neighbors.</Text>
      </View>

      <Pressable
        onPress={() => router.push('/hurt-animal')}
        accessibilityRole="button"
        accessibilityLabel="Found a hurt animal? What to do right now, and who can help"
        style={({ pressed }) => ({
          marginHorizontal: 16,
          minHeight: 60,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 20,
          backgroundColor: colors.pink,
          borderWidth: border.width,
          borderColor: colors.ink,
          boxShadow: offsetShadow(colors.ink, pressed ? 1 : 4),
          transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : [],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        })}
      >
        <HelpCrossIcon color={colors.ink} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>Found a hurt animal?</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>What to do right now, and who can help</Text>
        </View>
        <ChevronRightIcon size={18} color={colors.ink} />
      </Pressable>

      <View
        style={{
          marginHorizontal: 16,
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderRadius: 18,
          backgroundColor: colors.blue,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        accessible
        accessibilityLabel={`This season: ${count} of ${list.length} done`}
      >
        <Text style={{ fontFamily: fonts.displayRegular, fontSize: 20, color: colors.white }}>This season</Text>
        <Text style={{ fontFamily: fonts.displayRegular, fontSize: 20, color: colors.yellow }}>
          {count} of {list.length}
        </Text>
      </View>

      <View style={{ marginHorizontal: 16, gap: 10 }}>
        {list.map((k) => {
          const isDone = !!done[k.id];
          return (
            <View
              key={k.id}
              style={{
                padding: 16,
                borderRadius: 18,
                backgroundColor: isDone ? colors.yellowTint : colors.white,
                borderWidth: border.width,
                borderColor: colors.ink,
                flexDirection: 'row',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.label, { fontSize: 11, fontFamily: fonts.bodySemi }]}>{k.who}</Text>
                <Text style={{ fontFamily: fonts.displayRegular, fontSize: 19, lineHeight: 23, color: colors.ink }}>{k.title}</Text>
                <Text style={[type.body, { fontSize: 14, lineHeight: 20 }]}>{k.why}</Text>
              </View>
              <Pressable
                onPress={() => actions.toggleKindness(k.id, key)}
                accessibilityRole="checkbox"
                accessibilityLabel={k.title}
                accessibilityState={{ checked: isDone }}
                hitSlop={4}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: border.width,
                  borderColor: colors.ink,
                  backgroundColor: isDone ? colors.yellow : colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDone && <CheckIcon color={colors.ink} />}
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Credits for everything we borrowed, as CC BY / CC BY-SA ask. */}
      <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8, gap: 6 }}>
        <Text style={type.label}>Credits</Text>
        <Text style={credit}>
          Sightings from iNaturalist and eBird, at neighborhood level. Weather from Open-Meteo (CC BY 4.0). Photos are credited on each species page.
        </Text>
        <Text style={credit}>Sounds: wind, rain, waves and city hum are made in code. Recordings via Wikimedia Commons:</Text>
        {soundCredits.map((c) => (
          <Text key={c.source} style={[credit, { textDecorationLine: 'underline' }]} accessibilityRole="link" onPress={() => Linking.openURL(c.source)}>
            {c.title.replace(/\.(mp3|ogg|wav)$/, '')}, by {c.artist} ({c.license})
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const credit = [type.body, { fontSize: 12, lineHeight: 17, color: colors.inkMuted }];
