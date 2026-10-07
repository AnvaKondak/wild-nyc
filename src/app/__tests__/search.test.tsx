import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';
import Search from '../(tabs)/search';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/components/Sticker', () => ({ Sticker: () => null }));

const names = (tree: ReactTestRenderer) =>
  tree.root.findAll((n) => n.props.accessibilityLabel?.endsWith?.('Open their page') && n.props.onPress).map((n) => n.props.accessibilityLabel as string);

describe('Search screen', () => {
  it('narrows the list as you type', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<Search />);
    });
    expect(names(tree).length).toBeGreaterThan(5);
    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('jay');
    });
    expect(names(tree)).toEqual(['Blue Jays, Blue Jay. Open their page']);
  });
});
