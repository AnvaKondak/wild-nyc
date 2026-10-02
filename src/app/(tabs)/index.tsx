// TEMPORARY (step 1): a gallery of the shared parts so the riso look can be
// checked in the simulator. Replaced by the Right now story in step 3.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EyeIcon } from '@/components/Icons';
import { PillRow } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

const hoods = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'park', label: 'Prospect Park' },
];

export default function PartsGallery() {
  const [hood, setHood] = useState('home');
  const [noticed, setNoticed] = useState(false);

  return (
    <Screen contentStyle={{ gap: 24 }}>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Text style={type.label}>Step 1 · parts gallery</Text>
        <Title accent="Neighbors">Wild</Title>
      </View>

      <PillRow items={hoods} selectedId={hood} onSelect={setHood} onAdd={() => {}} />

      <View style={{ height: 260 }}>
        <Sticker icon="bird" size={120} tint={colors.pinkTint} rotate={-8} style={{ position: 'absolute', left: 30, top: 20 }} />
        <Sticker icon="squirrel" size={108} tint={colors.yellowTint} rotate={6} style={{ position: 'absolute', left: 160, top: 0 }} />
        <Sticker icon="bug" size={100} tint={colors.blueTint} rotate={-4} style={{ position: 'absolute', left: 240, top: 110 }} />
        <Sticker icon="critter" size={100} tint={colors.pink} rotate={9} style={{ position: 'absolute', left: 100, top: 145 }} />
        <Sticker icon="bird" size={46} ghost style={{ position: 'absolute', left: 20, top: 190 }} />
      </View>

      <View style={{ paddingHorizontal: 22 }}>
        <Title accent="your street" accentColor="blue" size={42}>6 neighbors share</Title>
        <Text style={[type.bodyLarge, { marginTop: 12 }]}>
          Pigeons on the ledges, sparrows in the hedge, squirrels in the tree. Come meet them.
        </Text>
      </View>

      <Card style={{ marginHorizontal: 16 }}>
        <Text style={type.kicker}>Personality type</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.ink }}>The Loyal Homebody</Text>
        <Text style={type.body}>
          Pairs usually stay together and come back to the same ledge year after year.
        </Text>
      </Card>

      <Card background={colors.blue} shadow={colors.yellow} bordered={false} style={{ marginHorizontal: 16 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.white }}>Pigeons</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label={noticed ? 'Noticed today' : 'I noticed them today'}
            variant="yellow"
            size="medium"
            selected={noticed}
            onPress={() => setNoticed((n) => !n)}
            style={{ flexGrow: 1 }}
          />
          <Button label="How to help" variant="outline" color={colors.white} size="medium" onPress={() => {}} />
        </View>
      </Card>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Button label="Meet the neighbors" onPress={() => {}} />
        <Button label="I noticed pigeons today" shadow={colors.yellow} icon={<EyeIcon color={colors.white} />} onPress={() => {}} />
        <Button label="Share your neighborhood" variant="outline" onPress={() => {}} />
      </View>

      <Text style={{ textAlign: 'center', fontFamily: fonts.displayItalic, fontSize: 15, color: colors.inkMuted }}>
        We notice. We don't follow.
      </Text>
    </Screen>
  );
}
