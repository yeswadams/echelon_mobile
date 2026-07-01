import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';

import Search from '@/components/search';
import { IconButton, ViewToggle } from '@/components/atoms';
import { FilterBottomSheet, PropertyResultsList } from '@/components/organisms';
import type { FilterBottomSheetHandle } from '@/components/organisms';

import { getProperties } from '@/lib/sanity';
import { useFetch } from '@/lib/useFetch';
import { DEFAULT_FILTER_STATE } from '@/lib/types';
import type { FilterState, SanityPropertyListing, ViewMode } from '@/lib/types';

// Placeholder bounds until a dedicated min/max aggregation query exists in lib/sanity.ts.
const PRICE_BOUNDS: [number, number] = [0, 50_000_000];

/**
 * New Search & Discovery results screen (atomic-design v2 scaffold).
 * Not wired into the tab navigator yet — reachable only via router.push('/search-results')
 * once product decides where it plugs into the nav graph.
 */
function SearchResultsScreen() {
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();
  const filterSheetRef = useRef<FilterBottomSheetHandle>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  const { data: properties, loading } = useFetch<
    SanityPropertyListing[],
    { filter: string; query: string }
  >({
    fn: getProperties,
    params: { filter: params.filter ?? filters.propertyType, query: params.query ?? '' },
  });

  const handlePressItem = (id: string) => router.push(`/properties/${id}`);

  return (
    <SafeAreaView className="h-full bg-white" edges={['top']}>
      <View className="px-5 pt-2">
        <View className="flex flex-row items-center justify-between mb-2">
          <Text className="text-xl font-rubik-bold text-black-300">Search Results</Text>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>

        <View className="flex flex-row items-center gap-3">
          <View className="flex-1">
            <Search />
          </View>
          <IconButton
            glyph="⚙"
            onPress={() => filterSheetRef.current?.present()}
            accessibilityLabel="Open filters"
          />
        </View>
      </View>

      <PropertyResultsList
        data={properties}
        loading={loading}
        viewMode={viewMode}
        onPressItem={handlePressItem}
      />

      <FilterBottomSheet
        ref={filterSheetRef}
        initialFilters={filters}
        priceRange={PRICE_BOUNDS}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

export default function SearchResultsRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SearchResultsScreen />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
