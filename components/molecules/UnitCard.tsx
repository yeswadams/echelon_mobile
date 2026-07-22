import { Image, Text, TouchableOpacity, View } from 'react-native';

import icons from '@/constants/icons';
import { urlFor } from '@/lib/sanityImage';
import type { SanityPropertyUnit } from '@/lib/types';
import { Badge, type BadgeTone } from '@/components/atoms/Badge';

const STATUS_TONE: Record<string, BadgeTone> = {
  available: 'success',
  reserved: 'neutral',
  sold: 'danger',
  occupied: 'danger',
};

const UNIT_TYPE_LABEL: Record<string, string> = {
  studio: 'Studio',
  '1br': '1 Bedroom',
  '2br': '2 Bedroom',
  '3br': '3 Bedroom',
  '4br': '4 Bedroom',
  '5br-plus': '5 Bedroom+',
  office: 'Office',
  retail: 'Retail',
  plot: 'Plot',
};

interface UnitCardProps {
  unit: SanityPropertyUnit;
  onPress?: () => void;
}

/** Horizontal-scroll card for a property's unit types on the property
 * details screen. Tapping opens the unit's own details screen. */
export function UnitCard({ unit, onPress }: UnitCardProps) {
  const imageSource = unit.floorPlan ?? unit.gallery?.[0]?.image;
  let imageUrl: string | null = null;
  try {
    imageUrl = imageSource
      ? urlFor(imageSource).width(480).height(320).fit('crop').auto('format').url()
      : null;
  } catch {
    imageUrl = null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-64 rounded-2xl border border-primary-200 bg-white overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`View ${unit.title}`}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-full h-36" resizeMode="cover" />
      ) : (
        <View className="w-full h-36 bg-primary-100" />
      )}

      <View className="p-4 gap-2">
        <View className="flex flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 text-base font-rubik-bold text-black-300">
            {unit.title}
          </Text>
          {unit.availabilityStatus && (
            <Badge
              label={unit.availabilityStatus}
              tone={STATUS_TONE[unit.availabilityStatus] ?? 'neutral'}
            />
          )}
        </View>

        {unit.unitType && (
          <Text className="text-xs font-rubik-medium text-black-200">
            {UNIT_TYPE_LABEL[unit.unitType] ?? unit.unitType}
            {unit.floorLevel ? ` · ${unit.floorLevel}` : ''}
          </Text>
        )}

        <View className="flex flex-row items-center gap-4 mt-1">
          {unit.bedrooms != null && (
            <View className="flex flex-row items-center gap-1.5">
              <Image source={icons.bed} className="size-4" />
              <Text className="text-xs font-rubik-medium text-black-300">{unit.bedrooms}</Text>
            </View>
          )}
          {unit.bathrooms != null && (
            <View className="flex flex-row items-center gap-1.5">
              <Image source={icons.bath} className="size-4" />
              <Text className="text-xs font-rubik-medium text-black-300">{unit.bathrooms}</Text>
            </View>
          )}
          {(unit.sizeSqm ?? unit.sizeSqft) != null && (
            <View className="flex flex-row items-center gap-1.5">
              <Image source={icons.area} className="size-4" />
              <Text className="text-xs font-rubik-medium text-black-300">
                {unit.sizeSqm != null ? `${unit.sizeSqm} sqm` : `${unit.sizeSqft} sqft`}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-primary-300 text-lg font-rubik-bold mt-1">
          {unit.price != null
            ? `${unit.currency ?? 'KES'} ${unit.price.toLocaleString()}`
            : 'Price on request'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
