// Dev-only gallery of the PLACEHOLDER art: every species, and every story setting.
// Open with the deep link wildneighbors://art-preview (or /art-preview on web).
import { Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { StoryBackdrop } from '@/components/backdrop';
import { SceneView } from '@/components/scenes';
import { getSpecies, places, species, speciesPhoto, type Setting } from '@/content';
import { colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

const SETTINGS: Setting[] = ['branch', 'trunk', 'den', 'wire', 'ledge', 'rooftop', 'streetlight', 'lawn', 'sidewalk', 'hedge', 'flowers', 'water', 'shore', 'pier', 'reeds', 'fence', 'trashcan', 'web', 'sky', 'night-sky'];

export default function ArtPreview() {
  const raccoon = getSpecies('raccoon')!;
  const { only } = useLocalSearchParams<{ only?: string }>();
  const { width } = useWindowDimensions();
  const thumb = (width - 32 - 12) / 2;
  if (only === 'backdrops') {
    const h = thumb * 1.9;
    return (
      <Screen contentStyle={{ gap: 12, paddingHorizontal: 16 }}>
        <BackButton />
        <Text style={type.kicker}>Story backdrops</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SETTINGS.map((setting, i) => (
            <View key={setting} style={{ width: thumb, gap: 4 }}>
              <View style={{ width: thumb, height: h, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.ink, backgroundColor: i % 4 === 3 ? colors.ink : i % 4 === 2 ? colors.blue : i % 4 === 1 ? colors.yellowTint : colors.pinkTint, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', top: 0, left: 0, width: thumb - 3, height: h - 3 }}>
                  <StoryBackdrop
                    setting={setting}
                    period={(['dawn', 'midday', 'dusk', 'night'] as const)[i % 4]}
                    season={(['spring', 'summer', 'fall', 'winter'] as const)[Math.floor(i / 4) % 4]}
                    placeKind={(['block', 'park', 'waterfront'] as const)[i % 3]}
                    placeId={['park-slope', 'prospect-park', 'liberty-state-park', 'astoria', 'exchange-place'][i % 5]}
                    variant={i % 3}
                    moonLit={0.4}
                    width={thumb - 3}
                    height={h - 3}
                  />
                </View>
                <Sticker art={raccoon.art} photo={speciesPhoto('raccoon')} size={thumb * 0.5} rotate={-5} style={{ marginBottom: h * 0.2 }} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{setting}</Text>
            </View>
          ))}
        </View>
      </Screen>
    );
  }
  if (only === 'scenes') {
    return (
      <Screen contentStyle={{ gap: 12, paddingHorizontal: 16 }}>
        <BackButton />
        <Text style={type.kicker}>Scenes + landmarks</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {places.map((p) => (
            <View key={p.id} style={{ width: thumb, gap: 4 }}>
              <View style={{ borderWidth: 1.5, borderColor: colors.ink, borderRadius: 12, overflow: 'hidden' }}>
                <SceneView kind={p.kind} width={thumb - 3} placeId={p.id} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{p.name}</Text>
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
