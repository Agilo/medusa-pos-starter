import { useProducts } from '@/api/hooks/products';
import { CircleAlert } from '@/components/icons/circle-alert';
import { SearchInput } from '@/components/SearchInput';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { useBreakpointValue } from '@/hooks/useBreakpointValue';
import { clx } from '@/utils/clx';
import { AdminProduct } from '@medusajs/types';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { router } from 'expo-router';
import * as React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

const isPlaceholderProduct = (
  product: AdminProduct | { id: `placeholder_${string}` },
): product is { id: `placeholder_${string}` } => {
  return typeof product.id === 'string' && product.id.startsWith('placeholder_');
};

const ProductPlaceholder: React.FC<{ index: number; numColumns: number }> = ({ index, numColumns }) => {
  return (
    <View
      className={clx('flex-1 px-1', {
        'pl-0': index % numColumns === 0,
        'pr-0': (index + 1) % numColumns === 0,
      })}
    >
      <View className="flex-1 gap-4">
        <View className="aspect-square overflow-hidden rounded-lg bg-gray-200" />
        <View>
          <View className="mb-1 h-4 rounded-md bg-gray-200" />
          <View className="mb-1 h-4 w-1/3 rounded-md bg-gray-200" />
        </View>
      </View>
    </View>
  );
};

export default function ProductsScreen() {
  const settings = useSettings();
  const numColumns = useBreakpointValue({ base: 2, md: 3, xl: 4 });
  const [searchQuery, setSearchQuery] = React.useState('');
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
    ({ item, index }: ListRenderItemInfo<AdminProduct | { id: `placeholder_${string}` }>) => {
      if (isPlaceholderProduct(item)) {
        return <ProductPlaceholder index={index} numColumns={numColumns} />;
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
        <View
          className={clx('w-full px-1', {
            'pl-0': index % numColumns === 0,
            'pr-0': (index + 1) % numColumns === 0,
          })}
        >
          <TouchableOpacity className="flex w-full gap-4" onPress={() => handleProductPress(item)} activeOpacity={0.7}>
            <View
              className="aspect-square overflow-hidden rounded-lg bg-gray-200"
              testID={`product-handle_${item.handle}_image`}
            >
              {thumbnail && <Image source={{ uri: thumbnail }} className="h-full w-full object-cover" />}
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
    [handleProductPress, numColumns, settings.data?.region?.currency_code],
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
    <Layout className="gap-6">
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search products..." />

      <FlashList
        data={data}
        numColumns={numColumns}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        estimatedItemSize={70}
        refreshing={productsQuery.isRefetching}
        ItemSeparatorComponent={() => <View className="h-6 w-full" />}
        automaticallyAdjustKeyboardInsets
        ListEmptyComponent={
          <View className="mt-60 flex-1 items-center">
            <CircleAlert size={24} />
            <Text className="mt-2 text-center text-xl">No products match{'\n'}the search</Text>
          </View>
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View className="gap-6">
              <View className="flex-row">
                {Array.from({ length: numColumns }, (_, index) => (
                  <ProductPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
              </View>
              <View className="flex-row">
                {Array.from({ length: numColumns }, (_, index) => (
                  <ProductPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
              </View>
              <View className="flex-row">
                {Array.from({ length: numColumns }, (_, index) => (
                  <ProductPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
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
        keyboardDismissMode="on-drag"
      />
    </Layout>
  );
}
