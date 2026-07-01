import icons from '@/constants/icons';
import images from '@/constants/images';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { urlFor } from '@/lib/sanityImage';
import type { SanityPropertyListing } from '@/lib/types';

interface Props {
  item: SanityPropertyListing;
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

export const FeaturedCard = ({ item, onPress }: Props) => {
  const imageUrl = buildImageUrl(item, 480, 640);
  const address = buildAddress(item);

  return (
    <Pressable onPress={onPress} className="flex flex-col items-start w-60 h-80 relative">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="size-full rounded-2xl" />
      ) : (
        <View className="size-full rounded-2xl bg-primary-100" />
      )}
      <Image
        source={images.cardGradient}
        className="size-full rounded-2xl absolute bottom-0"
      />

      {item.isNew && (
        <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5">
          <Image source={icons.star} className="size-3.5" />
          <Text className="text-xs font-rubik-bold text-primary-300 ml-1">New</Text>
        </View>
      )}

      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text
          className="text-xl font-rubik-bold text-white"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text className="text-base font-rubik text-white">{address}</Text>

        <View className="flex flex-row items-center justify-between w-full mt-1">
          <Text className="text-xl font-rubik-bold text-white">
            {item.currency} {item.price?.toLocaleString()}
          </Text>
          <Image source={icons.heart} className="size-5" />
        </View>
      </View>
    </Pressable>
  );
};

export const Card = ({ item, onPress }: Props) => {
  const imageUrl = buildImageUrl(item, 400, 320);
  const address = buildAddress(item);

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 w-full px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative my-2.5"
    >
      {item.isNew && (
        <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
          <Image source={icons.star} className="size-2.5" />
          <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">New</Text>
        </View>
      )}

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-full h-40 rounded-lg" />
      ) : (
        <View className="w-full h-40 rounded-lg bg-primary-100" />
      )}

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-[#2c2c2c]">{item.title}</Text>
        <Text className="text-xs font-rubik text-black-300">{address}</Text>

        <View className="flex flex-row items-center justify-between mt-2">
          <Text className="text-base font-rubik-bold text-primary-300">
            {item.currency} {item.price?.toLocaleString()}
          </Text>
          <Image source={icons.heart} className="w-5 h-5 mr-2" tintColor="#191D31" />
        </View>
      </View>
    </Pressable>
  );
};
