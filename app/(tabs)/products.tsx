import { useProducts } from '@/api/hooks/products';
import { CircleAlert } from '@/components/icons/circle-alert';
import { SearchInput } from '@/components/SearchInput';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { AdminProduct } from '@medusajs/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, TouchableOpacity, View } from 'react-native';

const isPlaceholderProduct = (
  product: AdminProduct | { id: `placeholder_${string}` },
): product is { id: `placeholder_${string}` } => {
  return typeof product.id === 'string' && product.id.startsWith('placeholder_');
};

export default function ProductsScreen() {
  const settings = useSettings();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const productsQuery = useProducts({
    q: searchQuery ? searchQuery : undefined,
    sales_channel_id: settings.data?.sales_channel?.id ?? undefined,
    fields: '+variants.prices.*',
  });

  const handleProductPress = React.useCallback((product: AdminProduct) => {
    router.push({
      pathname: '/product-details',
      params: { productId: product.id, productName: product.title },
    });
  }, []);

  const renderProduct = React.useCallback(
    ({ item }: { item: AdminProduct | { id: `placeholder_${string}` } }) => {
      if (isPlaceholderProduct(item)) {
        return (
          <View className="gap-4 flex w-full px-1">
            <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
            <View>
              <View className="mb-1 h-4 rounded-md bg-gray-200" />
              <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
            </View>
          </View>
        );
      }

      const thumbnail = item.thumbnail || item.images?.[0]?.url;
      const variantPrices = (item.variants ?? [])
        .flatMap((variant) =>
          variant.prices?.filter((price) => price.currency_code === settings.data?.region?.currency_code),
        )
        .filter((price) => typeof price !== 'undefined');
      const currencyCode = variantPrices[0]?.currency_code ?? undefined;
      const amounts = variantPrices.map((price) => price.amount);
      const minPrice = amounts.length ? Math.min(...amounts) : undefined;
      const maxPrice = amounts.length ? Math.max(...amounts) : undefined;

      return (
        <View className="px-1 w-full">
          <TouchableOpacity className="flex w-full gap-4" onPress={() => handleProductPress(item)} activeOpacity={0.7}>
            <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden">
              {thumbnail && <Image source={{ uri: thumbnail }} className="w-full h-full object-cover" />}
            </View>
            <View>
              <Text className="mb-1 font-light">{item.title}</Text>
              {/* TODO: display discounted price */}
              <Text className="font-bold">
                {amounts.length === 0 || (typeof minPrice !== 'number' && typeof maxPrice !== 'number')
                  ? 'No price available'
                  : minPrice === maxPrice
                    ? minPrice?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                        currencyDisplay: 'narrowSymbol',
                      })
                    : `${minPrice?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                        currencyDisplay: 'narrowSymbol',
                      })} — ${maxPrice?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                        currencyDisplay: 'narrowSymbol',
                      })}`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleProductPress, settings.data?.region?.currency_code],
  );

  const data = React.useMemo(() => {
    if (productsQuery.isLoading) {
      return Array.from({ length: 8 }, (_, index) => ({
        id: `placeholder_${index + 1}` as const,
      }));
    }

    return productsQuery.data?.pages.flatMap((page) => page.products) || [];
  }, [productsQuery]);

  return (
    <Layout>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        className="mb-6"
      />

      <FlashList
        data={data}
        numColumns={2}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        estimatedItemSize={70}
        refreshing={productsQuery.isRefetching}
        ItemSeparatorComponent={() => <View className="w-full h-6" />}
        automaticallyAdjustKeyboardInsets
        ListEmptyComponent={
          <View className="flex-1 mt-60 items-center">
            <CircleAlert size={24} />
            <Text className="text-center text-xl mt-2">No products match{'\n'}the search</Text>
          </View>
        }
        contentContainerStyle={Platform.select({
          ios: {
            paddingBottom: bottomTabBarHeight - 14,
          },
        })}
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View className="flex-row flex-wrap">
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
              <View className="flex w-1/2 mb-6 px-1">
                <View className="flex-1 gap-4">
                  <View className="bg-gray-200 aspect-square rounded-lg overflow-hidden" />
                  <View>
                    <View className="mb-1 h-4 rounded-md bg-gray-200" />
                    <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
                  </View>
                </View>
              </View>
            </View>
          ) : null
        }
        onRefresh={() => {
          productsQuery.refetch();
        }}
        onEndReached={() => {
          if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
            productsQuery.fetchNextPage();
          }
        }}
        showsVerticalScrollIndicator={false}
      />
    </Layout>
  );
}
