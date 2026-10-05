import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Button } from '@/components/Button';
import { ShareIcon } from '@/components/Icons';
import { placeResidents, SCENE_WIDTH, SCENES, SceneView } from '@/components/scenes';
import { NeighborhoodScene, placeSpecies, SCENE_SIZE } from '@/components/scenes/NeighborhoodScene';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { species as allSpecies, type PlaceKind, type Season, type Species } from '@/content';
import { shortDate } from '@/lib/format';
import { seenLabel } from '@/lib/live';
import { seasonOf } from '@/lib/time';
import { useAppState } from '@/state/AppState';
import { useLiveData } from '@/state/LiveData';
import { currentNeighborhood, movedIn } from '@/state/selectors';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

const STICKER = 46;
const TILTS = [-6, 4, -3, 6, -5, 3, -4];
const TABS: { kind: PlaceKind; label: string }[] = [
  { kind: 'block', label: 'Block' },
  { kind: 'park', label: 'Park' },
  { kind: 'waterfront', label: 'Water' },
];

export default function Neighbors() {
  const { width } = useWindowDimensions();
  const { state } = useAppState();
  const met = movedIn(state);
  const season = seasonOf(new Date());
  // Neighbors live in one of three scenes; start on the one that fits where you are.
  const [tab, setTab] = useState<PlaceKind>(currentNeighborhood(state).kind);
  const placements = useMemo(
    () =>
      tab === 'block'
        ? placeSpecies(allSpecies)
        : placeResidents(tab, allSpecies).map((p, i) => ({ ...p, tilt: TILTS[i % TILTS.length] })),
    [tab],
  );
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = placements.find((p) => p.species.id === pickedId)?.species ?? placements[0]?.species;
  const sceneRef = useRef<View>(null);

  // Scene sits in a 2px frame, 16px from each edge.
  const sceneWidth = width - 32 - 4;
  const scale = sceneWidth / (tab === 'block' ? SCENE_SIZE.width : SCENE_WIDTH);

  const share = async () => {
    try {
      const uri = await captureRef(sceneRef, { format: 'png', quality: 1 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing isn't available here", 'Try it on your phone.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your neighborhood' });
    } catch {
      Alert.alert("Couldn't make the picture", 'Please try again.');
    }
  };

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Text style={type.label}>
          {met.size} of {allSpecies.length} have moved in
        </Text>
        <Title accent="you've met">Neighbors</Title>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }} accessibilityRole="tablist">
        {TABS.map((t) => {
          const on = t.kind === tab;
          const here = placeCount(t.kind, met);
          return (
            <Pressable
              key={t.kind}
              onPress={() => setTab(t.kind)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 22,
                borderWidth: border.width,
                borderColor: colors.ink,
                backgroundColor: on ? colors.ink : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: on ? colors.paper : colors.ink }}>
                {t.label} <Text style={{ fontFamily: fonts.body, fontSize: 12 }}>{here}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        ref={sceneRef}
        collapsable={false}
        style={{
          marginHorizontal: 16,
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.ink,
          backgroundColor: tab === 'block' ? colors.pinkTint : colors.paper,
        }}
      >
        {tab === 'block' ? <NeighborhoodScene width={sceneWidth} /> : <SceneView kind={tab} width={sceneWidth} landmark={false} />}
        {placements.map(({ species: s, x, y, tilt }) => {
          const isMet = met.has(s.id);
          const selected = s.id === pickedId;
          return (
            <Pressable
              key={s.id}
              onPress={() => setPickedId(s.id)}
              accessibilityRole="button"
              accessibilityLabel={isMet ? `Show ${s.friendlyName}` : `Not met yet: ${s.friendlyName}`}
              accessibilityState={{ selected }}
              hitSlop={2}
              style={{
                position: 'absolute',
                left: x * scale,
                top: y * scale,
                borderRadius: STICKER / 2,
                boxShadow: selected ? `0px 0px 0px 4px ${colors.yellow}` : undefined,
              }}
            >
              <Sticker art={s.art} size={STICKER} tint={colors[s.tint]} rotate={isMet ? tilt : 0} ghost={!isMet} />
            </Pressable>
          );
        })}
      </View>

      {picked && <NeighborCard species={picked} movedInOn={met.get(picked.id)} season={season} />}

      <View style={{ marginHorizontal: 16 }}>
        <Button
          label="Share your neighborhood"
          variant="outline"
          icon={<ShareIcon color={colors.ink} />}
          onPress={share}
          accessibilityHint="Shares a picture of your neighborhood scene"
        />
      </View>
    </Screen>
  );
}

/** "3/12": met / living in that scene. */
function placeCount(kind: PlaceKind, met: Map<string, string>): string {
  const residents = allSpecies.filter((s) => s.homeScene === kind);
  return `${residents.filter((s) => met.has(s.id)).length}/${residents.length}`;
}

function NeighborCard({ species, movedInOn, season }: { species: Species; movedInOn?: string; season: Season }) {
  const router = useRouter();
  const { live } = useLiveData();
  const isMet = !!movedInOn;
  const away = !species.seasons.includes(season);
  const backIn = species.seasons[0];
  const seen = seenLabel(live.get(species.id), new Date());

  let line: string;
  if (isMet) line = `Moved in ${shortDate(movedInOn)}. ${species.home}`;
  else if (away) line = `Not met yet. They're away right now, back in ${backIn}. ${species.spotHint}`;
  else line = `Not met yet. ${species.spotHint}`;

  return (
    <View
      style={{
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 22,
        backgroundColor: isMet ? colors.blue : colors.white,
        borderWidth: border.width,
        borderColor: colors.ink,
        boxShadow: isMet ? offsetShadow(colors.yellow, 4) : undefined,
        gap: 8,
      }}
    >
      <Text style={[type.kicker, { color: isMet ? colors.yellow : colors.inkMuted }]}>
        {isMet ? 'Your neighbor' : 'Waiting to move in'}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: isMet ? colors.white : colors.ink }}>{species.friendlyName}</Text>
        <Text style={{ fontFamily: fonts.displayItalic, fontSize: 15, color: isMet ? colors.white : colors.ink }}>{species.collectiveNoun}</Text>
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: isMet ? colors.white : colors.inkSoft }}>{line}</Text>
      <Button
        label={isMet ? 'Visit their page' : `Read about ${species.friendlyName.toLowerCase()}`}
        variant={isMet ? 'yellow' : 'white'}
        size="medium"
        onPress={() => router.push({ pathname: '/species/[id]', params: { id: species.id } })}
        style={{ alignSelf: 'flex-start', marginTop: 4, borderWidth: border.width, borderColor: colors.ink }}
      />
      {!isMet && seen && (
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.blue }}>{seen}. Keep an eye out!</Text>
      )}
      {!isMet && !away && (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
          They move in the first time you tap "I noticed them".
        </Text>
      )}
    </View>
  );
}
