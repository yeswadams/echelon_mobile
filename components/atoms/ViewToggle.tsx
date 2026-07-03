import { View } from 'react-native';

import type { ViewMode } from '@/lib/types';

import { IconButton } from './IconButton';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <View className="flex flex-row items-center gap-2">
      <IconButton
        glyph="▦"
        active={value === 'grid'}
        onPress={() => onChange('grid')}
        accessibilityLabel="Grid view"
      />
      <IconButton
        glyph="☰"
        active={value === 'list'}
        onPress={() => onChange('list')}
        accessibilityLabel="List view"
      />
    </View>
  );
}
