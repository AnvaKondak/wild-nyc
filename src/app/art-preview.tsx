// Dev-only gallery of the PLACEHOLDER art: every species, and every story setting.
// Open with the deep link wildneighbors://art-preview (or /art-preview on web).
import { useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { StoryBackdrop } from '@/components/backdrop';
import { getSpecies, moments, places, species, speciesPhoto, type Period, type Setting } from '@/content';
import { canDo, CloseUp, closeUpFor, planCloseUp, type CloseUpSetting, type Plan } from '@/components/scene/CloseUp';
import type { Mood } from '@/content/types';
import { colors, fonts } from '@/theme/tokens';
import { periodThemes } from '@/theme/periodTheme';
import { type } from '@/theme/type';

const SCENES = (['park', 'block', 'waterfront'] as const).flatMap((placeKind, k) =>
  (['spring', 'summer', 'fall', 'winter'] as const).map((season, j) => ({ placeKind, season, period: (['dawn', 'midday', 'dusk', 'night'] as const)[(j + k) % 4] })),
);
const SETTINGS: Setting[] = ['branch', 'trunk', 'den', 'wire', 'ledge', 'rooftop', 'streetlight', 'lawn', 'sidewalk', 'hedge', 'flowers', 'water', 'shore', 'pier', 'reeds', 'fence', 'trashcan', 'web', 'sky', 'night-sky'];

// Close-up scenes: each neighbor in the two scenes their moments use most.
const CLOSEUPS = species.flatMap((s) => {
  const counts = new Map<string, number>();
  for (const m of moments.filter((x) => x.speciesId === s.id)) {
    const scene = closeUpFor(s.id, m.setting);
    if (scene) counts.set(scene, (counts.get(scene) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([scene]) => ({ s, scene: scene as CloseUpSetting }));
});

// Friends and family: a sample of groups and meetings, planned the way the story plans them.
const GROUPS: { label: string; plan?: Plan }[] = ([
  ['3 sparrows, dust bath', 'house-sparrow', 'sidewalk', 'dust', { count: 3, young: 0 }],
  ['Pigeon pair, ledge', 'rock-pigeon', 'ledge', undefined, { count: 2, young: 0 }],
  ['Raccoon mom + kits', 'raccoon', 'lawn', undefined, { count: 3, young: 2 }],
  ['Mallard + ducklings', 'mallard', 'water', undefined, { count: 3, young: 2 }],
  ['Goose family, lawn', 'canada-goose', 'lawn', undefined, { count: 3, young: 2 }],
  ['3 crows, wire', 'american-crow', 'wire', undefined, { count: 3, young: 0 }],
  ['2 squirrels, hollow', 'eastern-gray-squirrel', 'den', 'sleep', { count: 2, young: 0 }],
  ['2 cormorants drying', 'double-crested-cormorant', 'pier', 'dry', { count: 2, young: 0 }],
  ['3 bees, flowers', 'common-eastern-bumble-bee', 'flowers', undefined, { count: 3, young: 0 }],
  ['Gulls flying', 'herring-gull', 'sky', 'fly', { count: 3, young: 0 }],
  ['Pigeons at a puddle', 'rock-pigeon', 'water', 'drink', { count: 2, young: 0 }],
  ['Deer + fawn', 'white-tailed-deer', 'lawn', undefined, { count: 2, young: 1 }],
  ['Robin + fledgling, branch', 'american-robin', 'branch', undefined, { count: 2, young: 1 }],
] as const).map(([label, id, setting, action, crowd]): { label: string; plan?: Plan } => ({ label, plan: planCloseUp(id, setting, action, { crowd: { ...crowd } }) }))
  .concat(
    ([
      ['Jay meets squirrel', 'blue-jay', 'branch', ['blue-jay', 'eastern-gray-squirrel']],
      ['Hawk over squirrel', 'eastern-gray-squirrel', 'lawn', ['eastern-gray-squirrel', 'red-tailed-hawk']],
      ['Crow meets raccoon', 'american-crow', 'sidewalk', ['american-crow', 'raccoon']],
      ['Heron meets cormorant', 'great-blue-heron', 'shore', ['great-blue-heron', 'double-crested-cormorant']],
      ['Sparrow meets pigeon', 'house-sparrow', 'sidewalk', ['house-sparrow', 'rock-pigeon']],
    ] as const).map(([label, id, setting, cast]): { label: string; plan?: Plan } => ({ label, plan: planCloseUp(id, setting, label.includes(' over ') ? 'fly' : undefined, { cast: [...cast] }) })),
  );
const MOODS: Mood[] = ['hello', 'snack', 'happy', 'sleepy', 'surprised', 'curious', 'singing', 'chilly'];

export default function ArtPreview() {
  const raccoon = getSpecies('raccoon')!;
  const { only, from, accents, period: p, place, scene: forced, action, groups, skip } = useLocalSearchParams<{ groups?: string; skip?: string; only?: string; from?: string; accents?: string; period?: Period; place?: string; scene?: CloseUpSetting; action?: 'fly' | 'sleep' | 'dust' | 'drink' | 'dry' }>();
  const { width } = useWindowDimensions();
  if (only === 'closeups') return <CloseUpGallery width={width} initial={{ period: p, place, scene: forced, action, groups: !!groups, skip: Number(skip ?? 0) }} />;
  const thumb = (width - 32 - 12) / 2;
  if (only === 'backdrops') {
    const h = thumb * 1.9;
    return (
      <Screen contentStyle={{ gap: 12, paddingHorizontal: 16 }}>
        <BackButton />
        <Text style={type.kicker}>Story backdrops</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SCENES.slice(Number(from ?? 0)).map(({ placeKind, season, period }, i) => (
            <View key={`${placeKind}-${season}`} style={{ width: thumb, gap: 4 }}>
              <View style={{ width: thumb, height: h, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.ink, backgroundColor: periodThemes[period].bg, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', top: 0, left: 0, width: thumb - 3, height: h - 3 }}>
                  <StoryBackdrop
                    setting={accents ? SETTINGS[(i + Number(from ?? 0)) % SETTINGS.length] : 'sky'}
                    period={period}
                    season={season}
                    placeKind={placeKind}
                    variant={i % 3}
                    moonLit={0.4}
                    width={thumb - 3}
                    height={h - 3}
                  />
                </View>
                <Sticker art={raccoon.art} photo={speciesPhoto('raccoon')} size={thumb * 0.5} rotate={-5} style={{ marginBottom: h * 0.2 }} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{placeKind} · {season} · {period}{accents ? ` · ${SETTINGS[(i + Number(from ?? 0)) % SETTINGS.length]}` : ''}</Text>
            </View>
          ))}
        </View>
      </Screen>
    );
  }
  return (
    <Screen contentStyle={{ gap: 18, paddingHorizontal: 16 }}>
      <BackButton />
      <Title accent="art" accentColor="blue">Placeholder</Title>
      <Text style={type.body}>Drawn in code until real illustrations exist. {species.length} species.</Text>

      {only !== 'settings' && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {species.map((s, i) => (
          <View key={s.id} style={{ width: 96, alignItems: 'center', gap: 6 }}>
            <Sticker art={s.art} photo={speciesPhoto(s.id)} size={84} tint={colors[s.tint]} rotate={[-5, 4, -3, 6][i % 4]} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink, textAlign: 'center' }}>{s.friendlyName}</Text>
          </View>
        ))}
      </View>}

      <Text style={[type.kicker, { marginTop: 8 }]}>Story settings</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {SETTINGS.map((setting) => (
          <View key={setting} style={{ width: 96, alignItems: 'center', gap: 6 }}>
            <Sticker art={raccoon.art} photo={speciesPhoto('raccoon')} size={84} tint={colors.blueTint} rotate={0} setting={setting} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{setting}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

// Dev only: every close-up, scrollable, with buttons to try each action, time of day and look.
type Act = 'fly' | 'sleep' | 'dust' | 'drink' | 'dry' | undefined;
const LOOKS = ['park-slope', 'chelsea', 'coney-island', 'battery-park-city', 'bay-ridge'];

function CloseUpGallery({ width, initial }: { width: number; initial: { period?: Period; place?: string; scene?: CloseUpSetting; action?: Act; groups?: boolean; skip?: number } }) {
  const [period, setPeriod] = useState<Period>(initial.period ?? 'midday');
  const [place, setPlace] = useState(initial.place ?? 'park-slope');
  const [action, setAction] = useState<Act>(initial.action);
  const [mood, setMood] = useState<Mood>('hello');
  const [groups, setGroups] = useState(!!initial.groups);
  // Which version of each scene: "mixed" gives each tile its own, like the story does.
  const [version, setVersion] = useState<number | undefined>(undefined);
  const cw = (width - 24) / 3;
  const ch = cw * 1.65;
  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={{ paddingHorizontal: 10, minHeight: 32, justifyContent: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: on ? colors.ink : colors.white }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: on ? colors.white : colors.ink }}>{label}</Text>
    </Pressable>
  );
  const scene = (id: string, own: CloseUpSetting) => initial.scene ?? (action ? (closeUpFor(id, 'lawn', action) ?? own) : own);
  // With an action picked, only the neighbors who really do it.
  const singles = (action ? species.filter((s) => canDo(s.id, action)).map((s) => ({ s, scene: 'lawn' as CloseUpSetting })) : CLOSEUPS).map(({ s, scene: own }) => ({
    label: `${s.friendlyName} · ${scene(s.id, own)}`,
    plan: { scene: scene(s.id, own), figures: [{ id: s.id, x: 0.5, scale: 1, action: action && canDo(s.id, action) ? action : undefined }] } as Plan,
    id: s.id,
  }));
  // ?skip=6 starts further down (for screenshots).
  const list = (groups ? GROUPS.filter((g) => g.plan).map((g) => ({ ...g, id: g.plan!.figures[0].id })) : singles).slice(initial.skip ?? 0);
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: 54 }}>
      <View style={{ paddingHorizontal: 8, gap: 6, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {chip('Singles', !groups, () => setGroups(false))}
          {chip('Friends + family', groups, () => setGroups(true))}
          {!groups && chip('No action', !action, () => setAction(undefined))}
          {!groups && (['fly', 'sleep', 'dust', 'drink', 'dry'] as const).map((a) => chip(a, action === a, () => setAction(a)))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{MOODS.map((m) => chip(m, mood === m, () => setMood(m)))}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['dawn', 'midday', 'dusk', 'night'] as const).map((x) => chip(x, period === x, () => setPeriod(x)))}
          {chip('mixed', version === undefined, () => setVersion(undefined))}
          {[0, 1, 2].map((v) => chip(`v${v + 1}`, version === v, () => setVersion(v)))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{LOOKS.map((x) => chip(x, place === x, () => setPlace(x)))}</View>
      </View>
      <FlatList
        data={list}
        key={`${groups}:${action ?? 'none'}`}
        numColumns={3}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40, gap: 4 }}
        columnWrapperStyle={{ gap: 4 }}
        initialNumToRender={6}
        maxToRenderPerBatch={3}
        windowSize={2}
        removeClippedSubviews
        renderItem={({ item: { label, plan, id }, index }) => (
          <View style={{ width: cw, gap: 2 }}>
            <View style={{ width: cw, height: ch, overflow: 'hidden', borderRadius: 8 }}>
              <View style={{ width, height: width * 1.65, transformOrigin: 'top left', transform: [{ scale: cw / width }] }}>
                <CloseUp setting={plan!.scene} speciesId={id} figures={plan!.figures} mood={action === 'sleep' || plan!.figures[0].action === 'sleep' ? 'sleepy' : mood} width={width} height={width * 1.65} band={{ top: 228, height: 195 }} period={period} season="fall" sky={periodThemes[period].bg} weather="clear" placeId={place} placeKind={places.find((x) => x.id === place)?.kind} variant={version ?? index} action={plan!.figures[0].action} />
              </View>
            </View>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 9, color: colors.ink }}>
              {index + 1}. {label}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
