import { DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL } from '@/api/hooks/draft-orders';
import { useOrders } from '@/api/hooks/orders';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { CircleAlert } from '@/components/icons/circle-alert';
import { UserRound } from '@/components/icons/user-round';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { SearchInput } from '@/components/SearchInput';
import { Layout } from '@/components/ui/Layout';
import { OrderListStatus } from '@/components/ui/OrderStatus';
import { Text } from '@/components/ui/Text';
import { useBreakpointValue } from '@/hooks/useBreakpointValue';
import { clx } from '@/utils/clx';
import { formatDate } from '@/utils/date';
import { AdminOrder } from '@medusajs/types';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

const isPlaceholderOrder = (
  order: AdminOrder | { id: `placeholder_${string}` },
): order is { id: `placeholder_${string}` } => {
  return typeof order.id === 'string' && order.id.startsWith('placeholder_');
};

const allowedOrderStatuses = ['pending', 'completed', 'draft', 'archived', 'canceled', 'requires_action'] as const;

const isValidOrderStatus = (status: string): status is (typeof allowedOrderStatuses)[number] => {
  return allowedOrderStatuses.includes(status as (typeof allowedOrderStatuses)[number]);
};

const OrderPlaceholder: React.FC<{ index: number; numColumns: number }> = ({ index, numColumns }) => {
  return (
    <View
      className={clx('flex-1 px-2', {
        'pl-0': index % numColumns === 0,
        'pr-0': (index + 1) % numColumns === 0,
      })}
    >
      <View className="w-full gap-2 rounded-2xl border border-gray-200 p-4">
        <View className="w-full flex-row justify-between gap-2">
          <View className="h-6 w-1/3 rounded-md bg-gray-200" />
          <View className="h-5 w-24 rounded-md bg-gray-200" />
        </View>
        <View className="flex-row justify-between">
          <View className="w-1/2 gap-2">
            <View className="h-4 w-full rounded-md bg-gray-200" />
            <View className="h-4 w-20 rounded-md bg-gray-200" />
          </View>
          <View className="mt-auto h-8 w-32 rounded-full bg-gray-200" />
        </View>
      </View>
    </View>
  );
};

export default function OrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const numColumns = useBreakpointValue({ base: 1, md: 2, xl: 3 });

  const validatedStatusFilter = statusFilter.filter(isValidOrderStatus);

  const ordersQuery = useOrders({
    q: searchQuery || undefined,
    fields: '+customer.*,+total,+currency_code',
    order: '-created_at',
    status: validatedStatusFilter.length > 0 ? validatedStatusFilter : undefined,
    created_at: dateRange
      ? {
          $gte: dateRange.startDate.toISOString(),
          $lte: dateRange.endDate.toISOString(),
        }
      : undefined,
  });

  const handleOrderPress = React.useCallback((order: AdminOrder) => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId: order.id, orderNumber: order.display_id, orderDate: formatDate(order.created_at) },
    });
  }, []);

  const renderOrder = React.useCallback(
    ({ item, index }: ListRenderItemInfo<AdminOrder | { id: `placeholder_${string}` }>) => {
      if (isPlaceholderOrder(item)) {
        return <OrderPlaceholder index={index} numColumns={numColumns} />;
      }

      const customerName =
        item.customer?.first_name && item.customer?.last_name
          ? `${item.customer.first_name} ${item.customer.last_name}`
          : item.customer?.email === DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL
            ? 'POS'
            : item.customer?.email || 'Unknown Customer';

      return (
        <View
          className={clx('w-full px-2', {
            'pl-0': index % numColumns === 0,
            'pr-0': (index + 1) % numColumns === 0,
          })}
        >
          <TouchableOpacity
            className="w-full flex-row justify-between gap-4 rounded-2xl border border-gray-200 p-4"
            onPress={() => handleOrderPress(item)}
            activeOpacity={0.7}
          >
            <View className="flex-1 gap-4">
              <View className="flex-1">
                <Text textBreakStrategy="balanced" className="shrink text-xl">
                  Order #{item.display_id || item.id.slice(-6)}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <UserRound size={16} className="mt-1" />
                <View className="flex-1">
                  <Text textBreakStrategy="balanced" className="shrink">
                    {customerName}
                  </Text>
                </View>
              </View>
              <Text>
                {item.total.toLocaleString('en-US', {
                  style: 'currency',
                  currency: item.currency_code,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            </View>
            <View className="gap-4">
              <View className="flex-1">
                <Text className="mb-auto text-right text-gray-300">{formatDate(item.created_at)}</Text>
              </View>
              <OrderListStatus order={item} />
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleOrderPress, numColumns],
  );

  const data = React.useMemo(() => {
    if (ordersQuery.isLoading) {
      return Array.from({ length: 8 }, (_, index) => ({
        id: `placeholder_${index + 1}` as const,
      }));
    }

    return ordersQuery.data?.pages.flatMap((page) => page.orders) || [];
  }, [ordersQuery]);

  return (
    <Layout>
      <Text className="mb-6 text-4xl">My Orders</Text>

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for a specific order..."
        className="mb-4"
      />

      <View className="mb-4 flex-row items-center gap-2">
        <MultiSelectFilter
          variant="secondary"
          placeholder="Status"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Completed', value: 'completed' },
            { label: 'Canceled', value: 'canceled' },
          ]}
          className="flex-1"
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          placeholder="Date Range"
          className="flex-1"
          maxDate={new Date()}
        />
      </View>

      <FlashList
        data={data}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        estimatedItemSize={120}
        refreshing={ordersQuery.isRefetching}
        ItemSeparatorComponent={() => <View className="h-4 w-full" />}
        automaticallyAdjustKeyboardInsets
        ListEmptyComponent={
          <View className="mt-32 flex-1 items-center">
            <CircleAlert size={24} />
            <Text className="mt-2 text-center text-xl">No orders match{'\n'}the search</Text>
          </View>
        }
        contentContainerClassName="pb-2"
        ListFooterComponent={
          ordersQuery.isFetchingNextPage ? (
            <View className="mt-4 gap-4">
              <View className="flex-row">
                {Array.from({ length: numColumns }).map((_, index) => (
                  <OrderPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
              </View>
              <View className="flex-row">
                {Array.from({ length: numColumns }).map((_, index) => (
                  <OrderPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
              </View>
              <View className="flex-row">
                {Array.from({ length: numColumns }).map((_, index) => (
                  <OrderPlaceholder key={index} index={index} numColumns={numColumns} />
                ))}
              </View>
            </View>
          ) : null
        }
        onRefresh={() => {
          ordersQuery.refetch();
        }}
        onEndReached={() => {
          if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
            ordersQuery.fetchNextPage();
          }
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    </Layout>
  );
}
