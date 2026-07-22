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

import icons from '@/constants/icons';
import images from '@/constants/images';

import { getUnitById } from '@/lib/sanity';
import { urlFor } from '@/lib/sanityImage';
import { useFetch } from '@/lib/useFetch';
import { Badge, type BadgeTone } from '@/components/atoms/Badge';
import type { SanityImage, SanityPropertyUnit } from '@/lib/types';

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

const UnitDetails = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const windowHeight = Dimensions.get('window').height;

  const { data: unit, loading } = useFetch<SanityPropertyUnit | null, { id: string }>({
    fn: getUnitById,
    params: { id: id! },
  });

  const heroSource = unit?.floorPlan ?? unit?.gallery?.[0]?.image;
  let heroImageUrl: string | null = null;
  try {
    heroImageUrl = heroSource
      ? urlFor(heroSource).width(800).height(500).fit('crop').auto('format').url()
      : null;
  } catch {
    heroImageUrl = null;
  }

  const buildGalleryImageUrl = (image: SanityImage | undefined) => {
    if (!image) return null;
    try {
      return urlFor(image).width(320).height(160).fit('crop').auto('format').url();
    } catch {
      return null;
    }
  };

  const handleInquire = () => {
    const message = `Hi, I'm interested in "${unit?.title}" at ${unit?.property?.title ?? 'your property'}. Could you share more details?`;
    const whatsappNumber = unit?.property?.leadCapture?.whatsappNumber || unit?.property?.agent?.whatsapp;

    if (whatsappNumber) {
      Linking.openURL(
        `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      );
    } else if (unit?.property?.agent?.phone) {
      Linking.openURL(`tel:${unit.property.agent.phone}`);
    } else {
      Alert.alert(
        'No contact information',
        'This listing has no contact number available yet. Please check back later.'
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300" size="large" />
      </SafeAreaView>
    );
  }

  if (!unit) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <Text className="text-black-200 text-lg">Failed to load unit details</Text>
      </SafeAreaView>
    );
  }

  const specs = [
    { icon: icons.bed, label: unit.bedrooms != null ? `${unit.bedrooms} Beds` : null },
    { icon: icons.bath, label: unit.bathrooms != null ? `${unit.bathrooms} Baths` : null },
    {
      icon: icons.area,
      label:
        unit.sizeSqm != null
          ? `${unit.sizeSqm} sqm`
          : unit.sizeSqft != null
            ? `${unit.sizeSqft} sqft`
            : null,
    },
  ].filter((s) => s.label);

  return (
    <SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-32 bg-white">
        <View className="relative w-full" style={{ height: windowHeight / 2.4 }}>
          {heroImageUrl ? (
            <Image source={{ uri: heroImageUrl }} className="size-full" resizeMode="cover" />
          ) : (
            <View className="size-full bg-primary-100" />
          )}
          <Image source={images.whiteGradient} className="absolute top-0 w-full z-40" />

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
            </View>
          </View>
        </View>

        <View className="px-5 mt-7 flex gap-2">
          {unit.property?.title && (
            <Text className="text-black-200 text-sm font-rubik-medium">{unit.property.title}</Text>
          )}

          <View className="flex flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-2xl font-rubik-extrabold">{unit.title}</Text>
            {unit.availabilityStatus && (
              <Badge
                label={unit.availabilityStatus}
                tone={STATUS_TONE[unit.availabilityStatus] ?? 'neutral'}
              />
            )}
          </View>

          <View className="flex flex-row items-center gap-3 flex-wrap">
            {unit.unitType && (
              <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
                <Text className="text-xs font-rubik-bold text-primary-300">
                  {UNIT_TYPE_LABEL[unit.unitType] ?? unit.unitType}
                </Text>
              </View>
            )}
            {unit.unitCode && (
              <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
                <Text className="text-xs font-rubik-bold text-primary-300">{unit.unitCode}</Text>
              </View>
            )}
          </View>

          {specs.length > 0 && (
            <View className="flex flex-row items-center mt-5">
              {specs.map((spec, i) => (
                <View key={spec.label} className={`flex flex-row items-center ${i > 0 ? 'ml-7' : ''}`}>
                  <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10">
                    <Image source={spec.icon} className="size-4" />
                  </View>
                  <Text className="text-black-300 text-sm font-rubik-medium ml-2">{spec.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Unit facts */}
          {(unit.floorLevel || unit.view || unit.ensuiteBedrooms != null || unit.completionDate) && (
            <View className="w-full border-t border-primary-200 pt-7 mt-5 gap-3">
              <Text className="text-black text-xl font-rubik-bold">Unit details</Text>
              {unit.floorLevel && (
                <View className="flex flex-row justify-between">
                  <Text className="text-black-200 text-sm font-rubik">Floor</Text>
                  <Text className="text-black-300 text-sm font-rubik-medium">{unit.floorLevel}</Text>
                </View>
              )}
              {unit.view && (
                <View className="flex flex-row justify-between">
                  <Text className="text-black-200 text-sm font-rubik">View</Text>
                  <Text className="text-black-300 text-sm font-rubik-medium">{unit.view}</Text>
                </View>
              )}
              {unit.ensuiteBedrooms != null && unit.ensuiteBedrooms > 0 && (
                <View className="flex flex-row justify-between">
                  <Text className="text-black-200 text-sm font-rubik">Ensuite bedrooms</Text>
                  <Text className="text-black-300 text-sm font-rubik-medium">{unit.ensuiteBedrooms}</Text>
                </View>
              )}
              {unit.completionDate && (
                <View className="flex flex-row justify-between">
                  <Text className="text-black-200 text-sm font-rubik">Expected completion</Text>
                  <Text className="text-black-300 text-sm font-rubik-medium">
                    {new Date(unit.completionDate).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* AI summary */}
          {unit.aiUnitSummary?.summary && (
            <View className="mt-7">
              <Text className="text-black text-xl font-rubik-bold">About this unit</Text>
              <Text className="text-black-200 text-base font-rubik mt-2">
                {unit.aiUnitSummary.summary}
              </Text>
            </View>
          )}

          {/* Features */}
          {(unit.features?.length ?? 0) > 0 && (
            <View className="mt-7">
              <Text className="text-black text-xl font-rubik-bold">Features</Text>
              <View className="flex flex-row flex-wrap gap-2 mt-3">
                {unit.features!.map((feature) => (
                  <View key={feature._id} className="px-4 py-2 bg-primary-100 rounded-full">
                    <Text className="text-xs font-rubik-medium text-primary-300">{feature.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Gallery */}
          {(unit.gallery?.length ?? 0) > 0 && (
            <View className="mt-7">
              <Text className="text-black-300 text-xl font-rubik-bold">Gallery</Text>
              <FlatList
                contentContainerStyle={{ paddingRight: 20 }}
                data={unit.gallery}
                keyExtractor={(_item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const galleryImageUrl = buildGalleryImageUrl(item.image);
                  return galleryImageUrl ? (
                    <Image source={{ uri: galleryImageUrl }} className="size-40 rounded-xl" />
                  ) : (
                    <View className="size-40 rounded-xl bg-primary-100" />
                  );
                }}
                contentContainerClassName="flex gap-4 mt-3"
              />
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
              {unit.price != null
                ? `${unit.currency ?? 'KES'} ${unit.price.toLocaleString()}`
                : 'On request'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleInquire}
            className="flex-1 flex flex-row items-center justify-center bg-primary-300 py-3 rounded-full shadow-md shadow-zinc-400"
          >
            <Text className="text-white text-lg text-center font-rubik-bold">Inquire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UnitDetails;
