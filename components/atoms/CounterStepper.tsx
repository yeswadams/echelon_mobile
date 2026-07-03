import { Pressable, Text, View } from 'react-native';

interface CounterStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}

export function CounterStepper({
  label,
  value,
  min = 0,
  max = 10,
  onChange,
}: CounterStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const displayValue = value === 0 ? 'Any' : value >= max ? `${max}+` : String(value);

  return (
    <View className="flex flex-row items-center justify-between py-3">
      <Text className="text-base font-rubik-medium text-black-300">{label}</Text>

      <View className="flex flex-row items-center gap-4">
        <Pressable
          onPress={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityState={{ disabled: !canDecrement }}
          className={`size-8 rounded-full border border-primary-200 items-center justify-center ${
            !canDecrement ? 'opacity-30' : ''
          }`}
        >
          <Text className="text-lg font-rubik-bold text-black-300">−</Text>
        </Pressable>

        <Text className="text-base font-rubik-medium text-black-300 min-w-10 text-center">
          {displayValue}
        </Text>

        <Pressable
          onPress={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          accessibilityState={{ disabled: !canIncrement }}
          className={`size-8 rounded-full border border-primary-200 items-center justify-center ${
            !canIncrement ? 'opacity-30' : ''
          }`}
        >
          <Text className="text-lg font-rubik-bold text-black-300">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
