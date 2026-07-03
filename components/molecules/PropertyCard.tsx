import { Image, Pressable, Text, View } from 'react-native';

import { urlFor } from '@/lib/sanityImage';
import type { SanityPropertyListing, ViewMode } from '@/lib/types';

import { Badge } from '@/components/atoms';

interface PropertyCardProps {
  item: SanityPropertyListing;
  variant: ViewMode;
  onPress?: () => void;
}

function buildImageUrl(item: SanityPropertyListing, width: number, height: number): string | null {
  if (!item.heroImage) return null;
  try {
    return urlFor(item.heroImage).width(width).height(height).fit('crop').auto('format').url();
  } catch {
    return null;
  }
}

function buildAddress(item: SanityPropertyListing): string {
  return [item.location?.area, item.location?.city].filter(Boolean).join(', ') || 'Kenya';
}

export function PropertyCard({ item, variant, onPress }: PropertyCardProps) {
  const address = buildAddress(item);

  if (variant === 'list') {
    const imageUrl = buildImageUrl(item, 200, 200);

    return (
      <Pressable
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${address}, ${item.currency} ${item.price}`}
        className="flex flex-row items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm shadow-black-100/40 my-1.5"
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="size-20 rounded-lg" />
        ) : (
          <View className="size-20 rounded-lg bg-primary-100" />
        )}

        <View className="flex-1 flex flex-col gap-1">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base font-rubik-bold text-black-300 flex-1" numberOfLines={1}>
              {item.title}
            </Text>
            {item.isNew && <Badge label="New" tone="primary" />}
          </View>
          <Text className="text-xs font-rubik text-black-200" numberOfLines={1}>
            {address}
          </Text>
          <Text className="text-sm font-rubik-bold text-primary-300">
            {item.currency} {item.price?.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  }

  const imageUrl = buildImageUrl(item, 400, 320);

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${address}, ${item.currency} ${item.price}`}
      className="flex-1 w-full px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative my-2.5"
    >
      {item.isNew && (
        <View className="absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
          <Badge label="New" tone="primary" />
        </View>
      )}

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-full h-40 rounded-lg" />
      ) : (
        <View className="w-full h-40 rounded-lg bg-primary-100" />
      )}

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-black-300" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs font-rubik text-black-300" numberOfLines={1}>
          {address}
        </Text>
        <Text className="text-base font-rubik-bold text-primary-300 mt-2">
          {item.currency} {item.price?.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}
