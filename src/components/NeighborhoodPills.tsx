import { Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { currentNeighborhood } from '@/state/selectors';
import { colors } from '@/theme/tokens';
import { CloseIcon, PencilIcon } from './Icons';
import { PillRow } from './Pills';

type Props = { ink?: string; background?: string };

/** The user's neighborhoods as pills. Tap to switch, ✕ (or long-press) to remove, the pencil to move Home, "+" to add. */
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

  // The selected pill carries a small button: a pencil on Home (move it somewhere
  // else), an ✕ on the others (remove it, after a quick check).
  const isHome = (id: string) => state.neighborhoods.find((n) => n.id === id)?.label === 'Home';
  const trailing = (id: string, selected: boolean) => {
    if (!selected || state.neighborhoods.length === 0) return null;
    const home = isHome(id);
    if (!home && state.neighborhoods.length <= 1) return null;
    return (
      <Pressable
        onPress={() => (home ? router.push({ pathname: '/add-place', params: { edit: 'home' } }) : confirmRemove(id))}
        accessibilityRole="button"
        accessibilityLabel={home ? 'Change where Home is' : `Remove ${state.neighborhoods.find((n) => n.id === id)?.label}`}
        hitSlop={10}
        style={({ pressed }) => ({ width: 22, height: 22, borderRadius: 11, backgroundColor: background, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
      >
        {home ? <PencilIcon size={13} color={ink} /> : <CloseIcon size={11} color={ink} />}
      </Pressable>
    );
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
      trailing={trailing}
    />
  );
}
