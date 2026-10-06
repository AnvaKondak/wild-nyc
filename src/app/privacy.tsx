import { Text, View } from 'react-native';
import { BackButton } from '@/components/BackButton';
import { Screen } from '@/components/Screen';
import { Title } from '@/components/Title';
import { privacy } from '@/content';
import { border, colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

/** The privacy policy, in plain words. Same text as docs/PRIVACY.md (scripts/build_privacy.py). */
export default function Privacy() {
  const contact = privacy.contact ?? 'the email on our App Store page';
  return (
    <Screen contentStyle={{ gap: 18, paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <BackButton />
      </View>
      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        <Title accent="follow" accentColor="blue" size={34}>We notice. We don't</Title>
        <Text style={type.label}>Privacy · updated {privacy.updated}</Text>
        <Text style={type.bodyLarge}>{privacy.summary}</Text>
      </View>
      {privacy.sections.map((s, i) => (
        <View
          key={s.heading}
          style={{
            marginHorizontal: 16,
            padding: 18,
            gap: 6,
            borderRadius: 20,
            borderWidth: border.width,
            borderColor: colors.ink,
            backgroundColor: [colors.white, colors.blueTint, colors.yellowTint, colors.pinkTint][i % 4],
          }}
        >
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>{s.heading}</Text>
          <Text style={type.body}>{s.body.replace('{contact}', contact)}</Text>
        </View>
      ))}
    </Screen>
  );
}
