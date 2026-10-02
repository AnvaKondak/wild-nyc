import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { currentNeighborhood } from '@/state/selectors';
import { colors } from '@/theme/tokens';
import { PillRow } from './Pills';

type Props = { ink?: string; background?: string };

/** The user's neighborhoods as pills. Tap to switch, long-press to remove, "+" to add. */
export function NeighborhoodPills({ ink = colors.ink, background = colors.paper }: Props) {
  const router = useRouter();
  const { state, actions } = useAppState();
  const current = currentNeighborhood(state);
  const items = state.neighborhoods.length > 0
    ? state.neighborhoods.map((n) => ({ id: n.id, label: n.label }))
    : [{ id: current.id, label: current.label }];

  const confirmRemove = (id: string) => {
    const n = state.neighborhoods.find((x) => x.id === id);
    if (!n || state.neighborhoods.length <= 1) return;
    Alert.alert(`Remove ${n.label}?`, 'You can add it back any time.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => actions.removeNeighborhood(id) },
    ]);
  };

  return (
    <PillRow
      items={items}
      selectedId={current.id}
      onSelect={actions.selectNeighborhood}
      onLongPress={confirmRemove}
      onAdd={() => router.push('/add-place')}
      ink={ink}
      background={background}
    />
  );
}
