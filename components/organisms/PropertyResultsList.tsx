import { ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import type { SanityPropertyListing, ViewMode } from '@/lib/types';
import NoResults from '@/components/noResult';
import { PropertyCard } from '@/components/molecules';

interface PropertyResultsListProps {
  data: SanityPropertyListing[] | null;
  loading: boolean;
  viewMode: ViewMode;
  onPressItem: (id: string) => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
}

export function PropertyResultsList({
  data,
  loading,
  viewMode,
  onPressItem,
  ListHeaderComponent,
}: PropertyResultsListProps) {
  return (
    <FlashList
      key={viewMode}
      data={data ?? []}
      numColumns={viewMode === 'grid' ? 2 : 1}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <PropertyCard item={item} variant={viewMode} onPress={() => onPressItem(item._id)} />
      )}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={loading ? <ActivityIndicator size="large" className="mt-5" /> : <NoResults />}
    />
  );
}
