import { Linking, Text, View } from 'react-native';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Title } from '@/components/Title';
import { hurtAnimalGuide } from '@/content';
import { border, colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

export default function HurtAnimal() {
  const { intro, steps, rehabs } = hurtAnimalGuide;

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <BackButton />
      </View>

      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        <Title accent="hurt animal?" size={36}>Found a</Title>
        <Text style={type.body}>{intro}</Text>
      </View>

      <View style={{ marginHorizontal: 16, gap: 10 }}>
        <Text style={[type.kicker, { color: colors.pink, paddingHorizontal: 6 }]}>What to do right now</Text>
        {steps.map((step, i) => (
          <View
            key={step.title}
            style={{
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.white,
              borderWidth: border.width,
              borderColor: colors.ink,
              flexDirection: 'row',
              gap: 14,
            }}
          >
            <View
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.yellow, borderWidth: border.width, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.ink }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: fonts.displayRegular, fontSize: 19, color: colors.ink }}>{step.title}</Text>
              <Text style={[type.body, { fontSize: 14, lineHeight: 20 }]}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginHorizontal: 16, gap: 10 }}>
        <Text style={[type.kicker, { color: colors.pink, paddingHorizontal: 6 }]}>Who can help</Text>
        {rehabs.map((r) => (
          <View
            key={r.name}
            style={{ padding: 16, borderRadius: 18, backgroundColor: colors.pinkTint, borderWidth: border.width, borderColor: colors.ink, gap: 8 }}
          >
            <Text style={[type.label, { fontSize: 11, fontFamily: fonts.bodySemi }]}>{r.area}</Text>
            <Text style={{ fontFamily: fonts.displayRegular, fontSize: 19, color: colors.ink }}>{r.name}</Text>
            <Text style={[type.body, { fontSize: 14, lineHeight: 20 }]}>{r.note}</Text>
            {r.phone ? (
              <Button
                label={`Call ${r.phone}`}
                variant="ink"
                size="medium"
                shadow={null}
                onPress={() => Linking.openURL(`tel:${r.phone!.replace(/[^\d+]/g, '')}`)}
                style={{ alignSelf: 'flex-start' }}
              />
            ) : (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkMuted }}>Phone number coming soon</Text>
            )}
          </View>
        ))}
      </View>
    </Screen>
  );
}
