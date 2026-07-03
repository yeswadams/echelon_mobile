import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

import type { FilterState } from '@/lib/types';
import { CounterStepper } from '@/components/atoms';

export interface FilterBottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface FilterBottomSheetProps {
  initialFilters: FilterState;
  priceRange: [number, number];
  onApply: (filters: FilterState) => void;
}

export const FilterBottomSheet = forwardRef<FilterBottomSheetHandle, FilterBottomSheetProps>(
  ({ initialFilters, priceRange, onApply }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['65%'], []);

    const [beds, setBeds] = useState(initialFilters.beds ?? 0);
    const [baths, setBaths] = useState(initialFilters.baths ?? 0);
    const [priceValues, setPriceValues] = useState<[number, number]>([
      initialFilters.priceMin ?? priceRange[0],
      initialFilters.priceMax ?? priceRange[1],
    ]);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleReset = useCallback(() => {
      setBeds(0);
      setBaths(0);
      setPriceValues(priceRange);
    }, [priceRange]);

    const handleApply = useCallback(() => {
      onApply({
        ...initialFilters,
        beds: beds || undefined,
        baths: baths || undefined,
        priceMin: priceValues[0],
        priceMax: priceValues[1],
      });
      sheetRef.current?.dismiss();
    }, [beds, baths, priceValues, initialFilters, onApply]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 96 }}>
          <Text className="text-xl font-rubik-bold text-black-300 mb-2">Filters</Text>

          <Text className="text-base font-rubik-medium text-black-300 mt-3">Price range</Text>
          <View
            style={{ alignItems: 'center', marginVertical: 16 }}
            accessible
            accessibilityLabel="Price range slider"
          >
            <MultiSlider
              min={priceRange[0]}
              max={priceRange[1]}
              values={priceValues}
              onValuesChange={(values) => setPriceValues([values[0], values[1]])}
              selectedStyle={{ backgroundColor: '#0061FF' }}
              markerStyle={{ backgroundColor: '#0061FF', height: 20, width: 20 }}
              sliderLength={280}
            />
          </View>
          <View className="flex flex-row justify-between mb-2">
            <Text className="text-xs font-rubik text-black-200">
              KES {priceValues[0].toLocaleString()}
            </Text>
            <Text className="text-xs font-rubik text-black-200">
              KES {priceValues[1].toLocaleString()}
            </Text>
          </View>

          <View className="border-t border-primary-200 mt-2">
            <CounterStepper label="Bedrooms" value={beds} onChange={setBeds} />
            <CounterStepper label="Bathrooms" value={baths} onChange={setBaths} />
          </View>
        </BottomSheetView>

        <View className="absolute bottom-0 inset-x-0 flex flex-row gap-3 px-5 py-4 bg-white border-t border-primary-200">
          <Pressable
            onPress={handleReset}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
            className="flex-1 items-center justify-center py-3 rounded-full border border-primary-300"
          >
            <Text className="text-primary-300 font-rubik-bold">Reset</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
            className="flex-1 items-center justify-center py-3 rounded-full bg-primary-300"
          >
            <Text className="text-white font-rubik-bold">Apply</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    );
  }
);

FilterBottomSheet.displayName = 'FilterBottomSheet';
