import { Pressable, ScrollView, Text } from 'react-native';
import { border, colors, fonts } from '@/theme/tokens';
import { PlusIcon } from './Icons';

export type PillItem = { id: string; label: string };

type Props = {
  items: PillItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onLongPress?: (id: string) => void;
  onAdd?: () => void;
  /** Outline/text color. Selected pill is filled with this. */
  ink?: string;
  /** Background behind the row; used as the selected pill's text color. */
  background?: string;
};

/** Neighborhood pills with a dashed "+" at the end. Scrolls sideways when long. */
export function PillRow({ items, selectedId, onSelect, onLongPress, onAdd, ink = colors.ink, background = colors.paper }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
    >
      {items.map((item) => {
        const on = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            onLongPress={onLongPress ? () => onLongPress(item.id) : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityHint={onLongPress ? 'Long press to remove' : undefined}
            accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Remove' }] : undefined}
            onAccessibilityAction={(e) => {
              if (e.nativeEvent.actionName === 'longpress') onLongPress?.(item.id);
            }}
            hitSlop={{ top: 2, bottom: 2 }}
            style={{
              minHeight: 40,
              paddingHorizontal: 14,
              borderRadius: 20,
              borderWidth: border.width,
              borderColor: ink,
              backgroundColor: on ? ink : 'transparent',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: on ? background : ink }}>{item.label}</Text>
          </Pressable>
        );
      })}
      {onAdd && (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a neighborhood"
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: border.width,
            borderStyle: 'dashed',
            borderColor: ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusIcon color={ink} />
        </Pressable>
      )}
    </ScrollView>
  );
}
