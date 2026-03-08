import { Card, FeaturedCard } from "@/components/cards";
import Filters from "@/components/filters";
import Search from "@/components/search";
import icons from "@/constants/icons";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "./../../globals.css";
// import seed from "@/lib/seed";

export default function Index() {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();

  const { data: latestProperties, loading: latestPropertiesLoading } =
    useAppwrite({
      fn: getLatestProperties,
    });

  const {
    data: properties,
    loading,
    refetch,
  } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
      limit: 6,
    },
    skip: true,
  });

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  useEffect(() => {
    refetch({
      filter: params.filter!,
      query: params.query!,
      limit: 6,
    });
  }, [params.filter, params.query]);

  return (
    <SafeAreaView className="bg-white h-full">
      {/* <Button title="Seed" onPress={seed} /> */}
      <FlatList
        data={properties}
        renderItem={({ item }) => (
          <Card item={item} onPress={() => handleCardPress(item.$id)} />
        )}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        contentContainerClassName="pb-20 "
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row items-center">
                <View className="size-12 rounded-full items-center justify-center bg-[#C9B581]">
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      className="size-12 rounded-full"
                    />
                  ) : (
                    <Text className="text-sm font-rubik-bold text-white">
                      {user?.name?.charAt(0)}
                    </Text>
                  )}
                </View>
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="font-rubik-medium text-xs text-black">
                    Good Morning
                  </Text>
                  <Text className="font-rubik-medium text-base text-primary-300">
                    {user?.name}
                  </Text>
                </View>
              </View>
              <Image source={icons.bell} className="size-6" />
            </View>
            <Search />
            <View className="my-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-rubik-medium">
                  Top Listings
                </Text>
                <Pressable>
                  <Text className="text-sm font-rubik-medium text-primary-300">
                    See All
                  </Text>
                </Pressable>
              </View>

              <FlatList
                data={latestProperties}
                renderItem={({ item }) => (
                  <FeaturedCard
                    item={item}
                    onPress={() => handleCardPress(item.$id)}
                  />
                )}
                keyExtractor={(item) => item.$id}
                horizontal
                bounces={false} // Disable bounce animation
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex gap-5 mt-5"
              />

              {/* <View className="flex flex-row gap-5 mt-5">
                <FeaturedCard />
                <FeaturedCard />
                <FeaturedCard />
              </View> */}
            </View>

            <View className="flex flex-row items-center justify-between">
              <Text className="text-base font-rubik-medium">
                Our Recommendation
              </Text>
              <Pressable>
                <Text className="text-sm font-rubik-medium text-primary-300">
                  See All
                </Text>
              </Pressable>
            </View>

            <Filters />
            {/* <View className="flex flex-row gap-5 mt-5">
              <Card />
              <Card />
            </View> */}
          </View>
        }
      />
    </SafeAreaView>
  );
}
