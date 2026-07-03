import { Text, View } from 'react-native';

export type BadgeTone = 'primary' | 'neutral' | 'success' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_STYLES: Record<BadgeTone, { container: string; text: string }> = {
  primary: { container: 'bg-primary-300', text: 'text-white' },
  neutral: { container: 'bg-primary-100', text: 'text-primary-300' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  danger: { container: 'bg-red-100', text: 'text-red-600' },
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const styles = TONE_STYLES[tone];

  return (
    <View
      className={`px-3 py-1 rounded-full ${styles.container}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text className={`text-xs font-rubik-bold ${styles.text}`}>{label}</Text>
    </View>
  );
}
