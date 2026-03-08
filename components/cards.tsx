import icons from "@/constants/icons";
import images from "@/constants/images";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { Property } from "@/lib/types";

interface Props {
  item: Property;
  onPress?: () => void;
}

export const FeaturedCard = ({
  item: { image, rating, name, address, price },
  onPress,
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex flex-col items-start w-60 h-80 relative"
    >
      <Image source={{ uri: image }} className="size-full rounded-2xl" />
      <Image
        source={images.cardGradient}
        className="size-full rounded-2xl absolute bottom-0"
      />

      <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5">
        <Image source={icons.star} className="size-3.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-1">
          {rating}
        </Text>
      </View>

      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text
          className="text-xl font-rubik-bold text-white"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        <Text className="text-base font-rubik text-white">{address}</Text>

        <View className="flex flex-row items-center justify-between w-full mt-1">
          <Text className="text-xl font-rubik-bold text-white">
            KSH. {price}
          </Text>
          <Image source={icons.heart} className="size-5" />
        </View>
      </View>
    </Pressable>
  );
};

export const Card = ({
  item: { image, rating, name, address, price },
  onPress,
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 w-full px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative my-2.5"
    >
      <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
        <Image source={icons.star} className="size-2.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">
          {rating}
        </Text>
      </View>

      <Image source={{ uri: image }} className="w-full h-40 rounded-lg" />

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-[#2c2c2c]">{name}</Text>
        <Text className="text-xs font-rubik text-black-300">{address}</Text>

        <View className="flex flex-row items-center justify-between mt-2">
          <Text className="text-base font-rubik-bold text-primary-300">
            KSH. {price}
          </Text>
          <Image
            source={icons.heart}
            className="w-5 h-5 mr-2"
            tintColor="#191D31"
          />
        </View>
      </View>
    </Pressable>
  );
};
