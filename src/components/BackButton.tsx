import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { border, colors } from '@/theme/tokens';
import { ChevronLeftIcon } from './Icons';

/** Round white back button. Falls back to the home tab if there's nowhere to go back to. */
export function BackButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={4}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.white,
          borderWidth: border.width,
          borderColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <ChevronLeftIcon size={18} color={colors.ink} />
    </Pressable>
  );
}
