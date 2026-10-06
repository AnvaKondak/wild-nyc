import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PillRow } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { getSpecies, seasonChapters, speciesPhoto, stories, type Season } from '@/content';
import { seasonOf } from '@/lib/time';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
const LOOK: Record<Season, { tint: string; shadow: string; accent: string }> = {
  spring: { tint: colors.pinkTint, shadow: colors.pink, accent: colors.pink },
  summer: { tint: colors.yellowTint, shadow: colors.yellow, accent: colors.blue },
  fall: { tint: colors.yellowTint, shadow: colors.pink, accent: colors.pink },
  winter: { tint: colors.blueTint, shadow: colors.blue, accent: colors.blue },
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Chapters() {
  const router = useRouter();
  const now = seasonOf(new Date());
  const [season, setSeason] = useState<Season>(now);
  const chapter = seasonChapters.find((c) => c.season === season)!;
  const look = LOOK[season];
  const journeys = stories.filter((s) => s.season === season && (s.kind === 'arriving' || s.kind === 'goodbye'));
  const meet = (id: string) => router.push({ pathname: '/species/[id]', params: { id } });

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        <Title accent="chapters" size={38}>Season</Title>
        <Text style={type.body}>What the neighbors get up to all season long, and how their stories cross.</Text>
      </View>

      <PillRow items={SEASONS.map((s) => ({ id: s, label: s === now ? `${cap(s)} · now` : cap(s) }))} selectedId={season} onSelect={(id) => setSeason(id as Season)} />

      {/* The season at a glance. */}
      <View
        style={{
          marginHorizontal: 16,
          padding: 20,
          borderRadius: 24,
          borderWidth: border.width,
          borderColor: colors.ink,
          backgroundColor: look.tint,
          boxShadow: offsetShadow(look.shadow, 5),
          gap: 8,
        }}
      >
        <Text style={[type.kicker, { color: look.accent }]}>The {season} chapter</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink }}>
          {chapter.name}
        </Text>
        <Text style={type.bodyLarge}>{chapter.intro}</Text>
      </View>

      {chapter.stories.map((st, n) => (
        <View
          key={st.id}
          style={{
            marginHorizontal: 16,
            padding: 18,
            borderRadius: 20,
            borderWidth: border.width,
            borderColor: colors.ink,
            backgroundColor: colors.white,
            boxShadow: offsetShadow(n % 2 ? look.shadow : colors.ink, 4),
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', paddingLeft: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {st.species.map((id, i) => {
              const s = getSpecies(id)!;
              return (
                <Sticker
                  key={id}
                  art={s.art}
                  photo={speciesPhoto(id)}
                  size={58}
                  tint={colors[s.tint]}
                  rotate={i % 2 ? 6 : -5}
                  style={{ marginLeft: i === 0 ? 0 : -12, zIndex: st.species.length - i }}
                />
              );
            })}
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink }}>
            {st.title}
          </Text>
          <Text style={type.body}>{st.body}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {st.species.map((id) => (
              <Chip key={id} label={`Meet the ${getSpecies(id)!.friendlyName.toLowerCase()}`} onPress={() => meet(id)} />
            ))}
          </View>
        </View>
      ))}

      {journeys.length > 0 && (
        <View style={{ marginHorizontal: 16, gap: 12 }}>
          <Text style={[type.kicker, { color: look.accent, paddingHorizontal: 6 }]}>Coming and going</Text>
          {journeys.map((j) => {
            const s = j.speciesId ? getSpecies(j.speciesId) : undefined;
            return (
              <Pressable
                key={j.id}
                onPress={s ? () => meet(s.id) : undefined}
                accessibilityRole="button"
                accessibilityLabel={`${j.title}. ${j.body.replace(/\{where\}/g, 'nearby')}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: border.width,
                  borderColor: colors.ink,
                  backgroundColor: j.kind === 'arriving' ? colors.yellowTint : colors.pinkTint,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {s && <Sticker art={s.art} photo={speciesPhoto(s.id)} size={54} tint={colors[s.tint]} rotate={-4} />}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={type.label}>{j.kind === 'arriving' ? 'Arriving' : 'Goodbye for now'}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 17, lineHeight: 21, color: colors.ink }}>{j.title}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[type.body, { fontSize: 12, lineHeight: 17, color: colors.inkMuted, paddingHorizontal: 22, paddingBottom: 8 }]}>
        Sightings from iNaturalist and eBird, at neighborhood level. Weather from Open-Meteo (CC BY 4.0). Photos are credited on each species page.
      </Text>
    </Screen>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
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
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.blueTint : colors.paper,
      })}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
