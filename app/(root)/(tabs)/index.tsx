import {
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import "./../../globals.css";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import images from "@/constants/images";
import Search from "@/components/search";
import { Card, FeaturedCard } from "@/components/cards";
import Filters from "@/components/filters";
import { useGlobalContext } from "@/lib/global-provider";

export default function Index() {
  const { user } = useGlobalContext();

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={[1, 2, 3, 4]}
        renderItem={({ item }) => <Card />}
        keyExtractor={(item) => item.toString()}
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
                      { user?.name?.charAt(0) }
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
                data={[1, 2, 3]}
                renderItem={() => <FeaturedCard />}
                keyExtractor={(item) => item.toString()}
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
