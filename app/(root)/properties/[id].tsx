import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { facilities } from '@/constants/data';
import icons from '@/constants/icons';
import images from '@/constants/images';

import { getPropertyById } from '@/lib/sanity';
import { urlFor } from '@/lib/sanityImage';
import { useFetch } from '@/lib/useFetch';
import type { SanityImage, SanityPropertyDetail } from '@/lib/types';

const PropertyDetails = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const windowHeight = Dimensions.get('window').height;

  const { data: property, loading } = useFetch<
    SanityPropertyDetail | null,
    { id: string }
  >({
    fn: getPropertyById,
    params: { id: id! },
  });

  const heroImageUrl = property?.heroImage
    ? urlFor(property.heroImage).width(800).height(500).fit('crop').auto('format').url()
    : null;

  const agentAvatarUrl = property?.agent?.avatar
    ? urlFor(property.agent.avatar).width(100).height(100).fit('crop').url()
    : null;

  const displayAddress = [property?.location?.area, property?.location?.city]
    .filter(Boolean)
    .join(', ') || 'Kenya';

  const handleBookNow = () => {
    const bookingMessage = `Hi, I'm interested in booking a viewing for "${property?.title}". Could you help me schedule a visit?`;
    const whatsappNumber = property?.leadCapture?.whatsappNumber || property?.agent?.whatsapp;

    if (whatsappNumber) {
      Linking.openURL(
        `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(bookingMessage)}`
      );
    } else if (property?.agent?.phone) {
      Linking.openURL(`tel:${property.agent.phone}`);
    } else {
      Alert.alert(
        'No contact information',
        'This listing has no contact number available yet. Please check back later.'
      );
    }
  };

  const buildGalleryImageUrl = (image: SanityImage | undefined) => {
    if (!image) return null;
    try {
      return urlFor(image).width(320).height(160).fit('crop').auto('format').url();
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300" size="large" />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <Text className="text-black-200 text-lg">Failed to load property details</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        <View className="relative w-full" style={{ height: windowHeight / 2 }}>
          {heroImageUrl ? (
            <Image source={{ uri: heroImageUrl }} className="size-full" resizeMode="cover" />
          ) : (
            <View className="size-full bg-primary-100" />
          )}
          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full z-40"
          />

          <View
            className="z-50 absolute inset-x-7"
            style={{ top: Platform.OS === 'ios' ? 70 : 20 }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>

              <View className="flex flex-row items-center gap-3">
                <Image source={icons.heart} className="size-7" tintColor="#191D31" />
                <Image source={icons.send} className="size-7" />
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 mt-7 flex gap-2">
          <Text className="text-2xl font-rubik-extrabold">{property.title}</Text>

          <View className="flex flex-row items-center gap-3">
            <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {property.propertyType}
              </Text>
            </View>

            {property.listingType && (
              <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
                <Text className="text-xs font-rubik-bold text-primary-300 capitalize">
                  {property.listingType}
                </Text>
              </View>
            )}
          </View>

          <View className="flex flex-row items-center mt-5">
            {property.bedrooms != null && (
              <>
                <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10">
                  <Image source={icons.bed} className="size-4" />
                </View>
                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                  {property.bedrooms} Beds
                </Text>
              </>
            )}

            {property.bathrooms != null && (
              <>
                <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
                  <Image source={icons.bath} className="size-4" />
                </View>
                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                  {property.bathrooms} Baths
                </Text>
              </>
            )}

            {(property.sizeSqft ?? property.sizeSqm) != null && (
              <>
                <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
                  <Image source={icons.area} className="size-4" />
                </View>
                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                  {property.sizeSqft ?? property.sizeSqm} {property.sizeSqft ? 'sqft' : 'sqm'}
                </Text>
              </>
            )}
          </View>

          {/* Agent */}
          {property.agent && (
            <View className="w-full border-t border-primary-200 pt-7 mt-5">
              <Text className="text-black text-xl font-rubik-bold">Agent</Text>
              <View className="flex flex-row items-center justify-between mt-4">
                <View className="flex flex-row items-center">
                  {agentAvatarUrl ? (
                    <Image
                      source={{ uri: agentAvatarUrl }}
                      className="size-14 rounded-full"
                    />
                  ) : (
                    <View className="size-14 rounded-full bg-primary-100" />
                  )}
                  <View className="flex flex-col items-start justify-center ml-3">
                    <Text className="text-lg text-black-300 font-rubik-bold">
                      {property.agent.name}
                    </Text>
                    {property.agent.email && (
                      <Text className="text-sm text-black-200 font-rubik-medium">
                        {property.agent.email}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex flex-row items-center gap-3">
                  {property.agent.whatsapp && (
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${property.agent!.whatsapp!.replace(/\D/g, '')}`
                        )
                      }
                    >
                      <Image source={icons.chat} className="size-7" />
                    </TouchableOpacity>
                  )}
                  {property.agent.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${property.agent!.phone}`)}
                    >
                      <Image source={icons.phone} className="size-7" />
                    </TouchableOpacity>
                  )}
                  {!property.agent.whatsapp && !property.agent.phone && (
                    <>
                      <Image source={icons.chat} className="size-7" />
                      <Image source={icons.phone} className="size-7" />
                    </>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Overview */}
          {property.description && (
            <View className="mt-7">
              <Text className="text-black text-xl font-rubik-bold">Overview</Text>
              <Text className="text-black-200 text-base font-rubik mt-2">
                {property.description}
              </Text>
            </View>
          )}

          {/* Amenities / Facilities */}
          {(property.amenities?.length ?? 0) > 0 && (
            <View className="mt-7">
              <Text className="text-black text-xl font-rubik-bold">Facilities</Text>
              <View className="flex flex-row flex-wrap items-start justify-start mt-2 gap-5">
                {property.amenities!.map((amenity) => {
                  const match = facilities.find(
                    (f) => f.title.toLowerCase() === amenity.name.toLowerCase()
                  );
                  return (
                    <View
                      key={amenity._id}
                      className="flex flex-1 flex-col items-center min-w-16 max-w-20"
                    >
                      <View className="size-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <Image
                          source={match ? match.icon : icons.info}
                          className="size-6"
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-black-300 text-sm text-center font-rubik mt-1.5"
                      >
                        {amenity.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Gallery */}
          {(property.gallery?.length ?? 0) > 0 && (
            <View className="mt-7">
              <Text className="text-black-300 text-xl font-rubik-bold">Gallery</Text>
              <FlatList
                contentContainerStyle={{ paddingRight: 20 }}
                data={property.gallery}
                keyExtractor={(_item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const galleryImageUrl = buildGalleryImageUrl(item.image);
                  return galleryImageUrl ? (
                    <Image
                      source={{ uri: galleryImageUrl }}
                      className="size-40 rounded-xl"
                    />
                  ) : (
                    <View className="size-40 rounded-xl bg-primary-100" />
                  );
                }}
                contentContainerClassName="flex gap-4 mt-3"
              />
            </View>
          )}

          {/* Location */}
          <View className="mt-7">
            <Text className="text-black text-xl font-rubik-bold">Location</Text>
            <View className="flex flex-row items-center justify-start mt-4 gap-2">
              <Image source={icons.location} className="w-7 h-7" />
              <Text className="text-black-200 text-sm font-rubik-medium">
                {displayAddress}
              </Text>
            </View>
            <Image source={images.map} className="h-52 w-full mt-5 rounded-xl" />
          </View>

          {/* Highlights / Features */}
          {(property.highlights?.length ?? 0) > 0 && (
            <View className="mt-7">
              <Text className="text-black text-xl font-rubik-bold">Highlights</Text>
              {property.highlights!.map((h, i) => (
                <View key={i} className="flex flex-row items-start mt-2 gap-2">
                  <Image source={icons.star} className="size-4 mt-1" />
                  <Text className="text-black-200 text-base font-rubik flex-1">{h}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 p-7">
        <View className="flex flex-row items-center justify-between gap-10">
          <View className="flex flex-col items-start">
            <Text className="text-black-200 text-xs font-rubik-medium">Price</Text>
            <Text
              numberOfLines={1}
              className="text-primary-300 text-start text-2xl font-rubik-bold"
            >
              {property.currency} {property.price?.toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleBookNow}
            className="flex-1 flex flex-row items-center justify-center bg-primary-300 py-3 rounded-full shadow-md shadow-zinc-400"
          >
            <Text className="text-white text-lg text-center font-rubik-bold">Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PropertyDetails;
