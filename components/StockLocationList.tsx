import { useStockLocations } from '@/api/hooks/stock-location';
import { MapPin } from '@/components/icons/map-pin';
import { InfoBanner } from '@/components/InfoBanner';
import { LoadingBanner } from '@/components/LoadingBanner';
import { Text } from '@/components/ui/Text';
import { getCountryByAlpha2 } from '@/constants/countries';
import { findProvinceByCode } from '@/constants/provinces';
import { clx } from '@/utils/clx';
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';

interface StockLocationListProps {
  selectedStockLocationId: string;
  onStockLocationSelect: (id: string) => void;
}

export const StockLocationList: React.FC<StockLocationListProps> = ({
  selectedStockLocationId,
  onStockLocationSelect,
}) => {
  const stockLocationsQuery = useStockLocations();

  if (stockLocationsQuery.isLoading) {
    return <LoadingBanner className="mb-auto">Loading stock locations...</LoadingBanner>;
  }

  if (stockLocationsQuery.isError) {
    return <InfoBanner className="mb-auto">Unable to load stock locations.</InfoBanner>;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={stockLocationsQuery.data?.pages?.[0]?.stock_locations || []}
        keyExtractor={(item) => item.id}
        className="shrink grow-0 rounded-xl border border-gray-200"
        contentContainerClassName="grow-0"
        ItemSeparatorComponent={() => <View className="mx-4 h-hairline bg-gray-200" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={clx('flex-row items-center justify-between gap-2 px-4 py-3', {
              'bg-black': selectedStockLocationId === item.id,
            })}
            onPress={() => onStockLocationSelect(item.id)}
          >
            <View className="flex-1">
              <Text
                className={clx({
                  'text-white': selectedStockLocationId === item.id,
                })}
              >
                {item.name}
              </Text>
              {item.address && (
                <Text
                  className={clx('text-sm text-gray-300', {
                    'text-white': selectedStockLocationId === item.id,
                  })}
                >
                  {[
                    item.address.address_1,
                    item.address.address_2,
                    [item.address.postal_code, item.address.city].filter(Boolean).join(' '),
                    item.address.province
                      ? findProvinceByCode(item.address.country_code, item.address.province)?.name ||
                        item.address.province
                      : undefined,
                    getCountryByAlpha2(item.address.country_code)?.name || item.address.country_code,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
            </View>
            <MapPin
              size={16}
              className={clx({
                'text-white': selectedStockLocationId === item.id,
              })}
            />
          </TouchableOpacity>
        )}
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};
