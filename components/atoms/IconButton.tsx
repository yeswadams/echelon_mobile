import { Pressable, Text } from 'react-native';

interface IconButtonProps {
  glyph: string;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  disabled?: boolean;
}

export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
  active = false,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
      className={`size-10 rounded-full items-center justify-center ${
        active ? 'bg-primary-300' : 'bg-primary-100'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base ${active ? 'text-white' : 'text-black-300'}`}>{glyph}</Text>
    </Pressable>
  );
}
