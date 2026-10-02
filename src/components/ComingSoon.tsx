// TEMPORARY: placeholder body for tabs that are built in later steps.
import { Text, View } from 'react-native';
import { type } from '@/theme/type';
import { Screen } from './Screen';
import { Title } from './Title';

type Props = { title: string; accent: string; kicker: string; step: number };

export function ComingSoon({ title, accent, kicker, step }: Props) {
  return (
    <Screen>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Text style={type.label}>{kicker}</Text>
        <Title accent={accent}>{title}</Title>
        <Text style={[type.body, { marginTop: 12 }]}>Coming in step {step}.</Text>
      </View>
    </Screen>
  );
}
