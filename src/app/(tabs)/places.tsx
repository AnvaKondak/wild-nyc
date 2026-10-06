import { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { NeighborhoodPills } from '@/components/NeighborhoodPills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { placeRegulars, SCENE_WIDTH, SceneView } from '@/components/scenes';
import { Title } from '@/components/Title';
import { places, speciesFor, speciesPhoto, type Season, type Species } from '@/content';
import { rankByLive, seenLabel, type LiveSpecies } from '@/lib/live';
import { seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { currentNeighborhood } from '@/state/selectors';
import { useNoticed } from '@/state/useNoticed';
import { colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

const SPOT = 48;
const TITLE_WORD = { block: 'block', park: 'park', waterfront: 'waterfront' } as const;

export default function Places() {
  const { width } = useWindowDimensions();
  const { state } = useAppState();
  const { live, report } = useLiveData();
  const hood = currentNeighborhood(state);
  const season = seasonOf(new Date());
  const placeName = hood.placeId ? places.find((p) => p.id === hood.placeId)?.name : undefined;

  // The scene for this kind of place (block, park or waterfront), one regular per
  // spot. With live data, whoever's been seen nearby most lately gets the spot.
  const regulars = useMemo(() => placeRegulars(hood.kind, rankByLive(speciesFor(hood.kind, season), live)), [hood.kind, season, live]);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = regulars.find((p) => p.species.id === pickedId)?.species ?? regulars[0]?.species;

  // The scene sits inside a 2px frame, 16px from each screen edge.
  const sceneWidth = width - 32 - 4;
  const scale = sceneWidth / SCENE_WIDTH;

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Text style={type.label}>{placeName ? `Who shares ${placeName}` : 'Who shares your street'}</Text>
        <Title accent={TITLE_WORD[hood.kind]}>Your</Title>
      </View>

      <NeighborhoodPills />

      {/* The picked neighbor's card sits right under the tabs, above the scene. */}
      {picked && (
        <RegularCard species={picked} season={season} live={live.get(picked.id)} sourceNames={report?.sources.map((s) => s.name) ?? []} />
      )}

      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.ink,
        }}
      >
        <SceneView kind={hood.kind} width={sceneWidth} placeId={hood.placeId} />
        {regulars.map(({ species: s, x, y }) => {
          const selected = s.id === picked?.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setPickedId(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Show the ${s.friendlyName.toLowerCase()}`}
              accessibilityState={{ selected }}
              style={{ position: 'absolute', left: x * scale, top: y * scale, alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  borderRadius: SPOT / 2,
                  boxShadow: selected ? `0px 0px 0px 4px ${colors.yellow}` : undefined,
                }}
              >
                <Sticker art={s.art} photo={speciesPhoto(s.id)} size={SPOT} tint={colors[s.tint]} rotate={0} shadowColor={colors.ink} />
              </View>
              <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, backgroundColor: colors.ink }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white }}>{s.friendlyName}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>


    </Screen>
  );
}

type CardProps = { species: Species; season: Season; live?: LiveSpecies; sourceNames: string[] };

function RegularCard({ species, season, live, sourceNames }: CardProps) {
  const router = useRouter();
  const { noticedToday, toggle } = useNoticed(species.id);
  const seen = seenLabel(live, new Date());

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
      {seen && (
        <View style={{ alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.yellow }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink }}>{seen}</Text>
        </View>
      )}
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
      {seen && sourceNames.length > 0 && (
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: '#D6E0FF' }}>
          Sightings nearby from {sourceNames.join(' and ')}
        </Text>
      )}
    </View>
  );
}
