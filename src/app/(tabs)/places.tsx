import { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { STREET_SIZE, STREET_SPOTS, StreetScene } from '@/components/StreetScene';
import { Title } from '@/components/Title';
import { speciesFor, type SceneSpot, type Season, type Species } from '@/content';
import { seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { currentNeighborhood } from '@/state/selectors';
import { useNoticed } from '@/state/useNoticed';
import { colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

const SPOT = 48;

export default function Places() {
  const { width } = useWindowDimensions();
  const { state } = useAppState();
  const hood = currentNeighborhood(state);
  const season = seasonOf(new Date());

  // One neighbor per spot on the street: the first in this place's list who lives there.
  const regulars = useMemo(() => {
    const taken = new Set<SceneSpot>();
    const out: Species[] = [];
    for (const s of speciesFor(hood.kind, season)) {
      if (STREET_SPOTS[s.sceneSpot] && !taken.has(s.sceneSpot)) {
        taken.add(s.sceneSpot);
        out.push(s);
      }
    }
    return out;
  }, [hood.kind, season]);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = regulars.find((s) => s.id === pickedId) ?? regulars[0];

  // The scene sits inside a 2px frame, 16px from each screen edge.
  const sceneWidth = width - 32 - 4;
  const scale = sceneWidth / STREET_SIZE.width;

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Text style={type.label}>Who shares your street</Text>
        <Title accent="block">Your</Title>
      </View>

      <NeighborhoodPills />

      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.ink,
        }}
      >
        <StreetScene width={sceneWidth} />
        {regulars.map((s) => {
          const spot = STREET_SPOTS[s.sceneSpot]!;
          const selected = s.id === picked?.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setPickedId(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Show the ${s.friendlyName.toLowerCase()}`}
              accessibilityState={{ selected }}
              style={{ position: 'absolute', left: spot.x * scale, top: spot.y * scale, alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  borderRadius: SPOT / 2,
                  boxShadow: selected ? `0px 0px 0px 4px ${colors.yellow}` : undefined,
                }}
              >
                <Sticker icon={s.icon} size={SPOT} tint={colors[s.tint]} rotate={0} shadowColor={colors.ink} />
              </View>
              <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, backgroundColor: colors.ink }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white }}>{s.friendlyName}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {picked && <RegularCard species={picked} season={season} />}
    </Screen>
  );
}

function RegularCard({ species, season }: { species: Species; season: Season }) {
  const router = useRouter();
  const { noticedToday, toggle } = useNoticed(species.id);

  return (
    <View
      style={{
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 22,
        backgroundColor: colors.blue,
        boxShadow: offsetShadow(colors.yellow, 4),
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <Pressable
          onPress={() => router.push({ pathname: '/species/[id]', params: { id: species.id } })}
          accessibilityRole="link"
          accessibilityHint="Opens their page"
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.white, textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.4)' }}>
            {species.friendlyName}
          </Text>
        </Pressable>
        <Text style={{ fontFamily: fonts.displayItalic, fontSize: 15, color: '#D6E0FF' }}>
          {species.commonName} · {species.collectiveNoun}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.white }}>{species.home}</Text>
      <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.blueDeep, gap: 3 }}>
        <Text style={[type.kicker, { color: colors.yellow }]}>In their lives right now</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.white }}>{species.rightNow[season]}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={noticedToday ? 'Noticed today' : 'I noticed them today'}
          variant="yellow"
          size="medium"
          selected={noticedToday}
          accessibilityHint={noticedToday ? 'Tap again to undo' : 'Saves that you noticed them, on this phone only'}
          onPress={toggle}
          style={{ flexGrow: 1 }}
        />
        <Button label="How to help" variant="outline" color={colors.white} size="medium" onPress={() => router.push('/kindness')} />
      </View>
    </View>
  );
}
