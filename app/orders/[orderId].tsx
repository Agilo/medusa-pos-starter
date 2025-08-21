import { DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL } from '@/api/hooks/draft-orders';
import { useOrder } from '@/api/hooks/orders';
import { InfoBanner } from '@/components/InfoBanner';
import { LoadingBanner } from '@/components/LoadingBanner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@/components/ui/OrderStatus';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { AdminOrder, AdminOrderLineItem } from '@medusajs/types';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';

const CustomerInformation: React.FC<{
  order: AdminOrder;
}> = ({ order }) => {
  const customerEmail = order.customer?.email;
  const customerName = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ');
  const customerPhone = order.customer?.phone;
  const customerAddress = order.shipping_address
    ? [
        order.shipping_address.address_1,
        order.shipping_address.address_2,
        [order.shipping_address.postal_code, order.shipping_address.city].filter(Boolean).join(' '),
        order.shipping_address.province,
        order.shipping_address.country?.display_name,
      ]
        .filter(Boolean)
        .join(', ')
    : undefined;
  const isPosDefaultCustomer = !customerEmail || customerEmail === DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL;

  if (isPosDefaultCustomer) {
    return (
      <View className="mb-4 gap-4">
        <Text className="text-xl">Customer</Text>
        <View>
          <Text className="text-sm text-gray-300">
            No customer information available. This order was created on POS without a customer.
          </Text>
        </View>
      </View>
    );
  }

  const info = [
    { label: 'Full Name', value: customerName },
    { label: 'Mail', value: customerEmail },
    { label: 'Address', value: customerAddress },
    { label: 'Phone', value: customerPhone },
  ].filter((item) => item.value && item.value.trim().length > 0);

  return (
    <View className="mb-4 gap-4">
      <Text className="text-xl">Customer</Text>
      {info.map((item, index) => (
        <View key={item.label}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="max-w-32 text-sm text-gray-300">{item.label}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-right text-sm">{item.value}</Text>
            </View>
          </View>
          {index < info.length - 1 && <View className="mt-2 h-hairline w-full bg-gray-200" />}
        </View>
      ))}
    </View>
  );
};

const OrderInformation: React.FC<{
  order: AdminOrder;
  currency: string;
}> = ({ order, currency }) => {
  const automaticTaxesOn = !!order.region?.automatic_taxes;
  const shippingTotal = automaticTaxesOn ? order.shipping_total : order.shipping_subtotal;

  return (
    <>
      <Text className="mb-4 text-xl">Order Details</Text>
      <View className="mb-6 gap-2">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Order Status</Text>
          </View>
          <OrderStatus order={order} />
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Payment Status</Text>
          </View>
          <PaymentStatus order={order} />
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Fulfillment Status</Text>
          </View>
          <FulfillmentStatus order={order} />
        </View>
      </View>
      <CustomerInformation order={order} />
      <Text className="mb-4 text-xl">Summary</Text>
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">{automaticTaxesOn ? 'Subtotal (incl. taxes)' : 'Subtotal'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-right text-sm">
              {order.item_total.toLocaleString('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
        </View>
        {shippingTotal > 0 && (
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-300">{automaticTaxesOn ? 'Shipping (incl. taxes)' : 'Shipping'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-right text-sm">
                {shippingTotal.toLocaleString('en-US', {
                  style: 'currency',
                  currency,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            </View>
          </View>
        )}
        {order.discount_total > 0 && (
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-300">Discount</Text>
            </View>
            <View className="flex-1">
              <Text className="text-right text-sm">
                {(order.discount_total * -1).toLocaleString('en-US', {
                  style: 'currency',
                  currency,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            </View>
          </View>
        )}
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Tax Total{automaticTaxesOn ? ' (included)' : ''}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-right text-sm">
              {order.tax_total.toLocaleString('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
        </View>
        <View className="h-hairline w-full bg-gray-200" />
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Paid Total</Text>
          </View>
          <View className="flex-1">
            <Text className="text-right text-sm">
              {order.payment_collections
                .reduce(
                  (acc, collection) => acc + (collection.captured_amount ?? 0) - (collection.refunded_amount ?? 0),
                  0,
                )
                .toLocaleString('en-US', {
                  style: 'currency',
                  currency,
                  currencyDisplay: 'narrowSymbol',
                })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Credit Lines Total</Text>
          </View>
          <View className="flex-1">
            <Text className="text-right text-sm">
              {(order.credit_lines ?? [])
                .reduce((acc, collection) => acc + ((collection.amount as unknown as number) ?? 0), 0)
                .toLocaleString('en-US', {
                  style: 'currency',
                  currency,
                  currencyDisplay: 'narrowSymbol',
                })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-300">Outstanding Amount</Text>
          </View>
          <View className="flex-1">
            <Text className="text-right text-sm">
              {(order.summary.pending_difference ?? 0).toLocaleString('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
        </View>
      </View>
      <View className="my-4 h-hairline w-full bg-gray-200" />
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-lg">Total</Text>
        </View>
        <View className="flex-1">
          <Text className="text-right text-lg">
            {order.total.toLocaleString('en-US', {
              style: 'currency',
              currency,
              currencyDisplay: 'narrowSymbol',
            })}
          </Text>
        </View>
      </View>
    </>
  );
};

const OrderDetails: React.FC<{ animateOut: (callback?: () => void) => void }> = ({ animateOut }) => {
  const { orderId, orderNumber, orderDate } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    orderDate: string;
  }>();

  const settings = useSettings();
  const orderQuery = useOrder(orderId);

  const currency =
    orderQuery.data?.order.currency_code ||
    orderQuery.data?.order.region?.currency_code ||
    settings.data?.region?.currency_code ||
    'EUR';

  const handleProductPress = React.useCallback(
    (product: AdminOrderLineItem) => {
      animateOut(() => {
        router.push({
          pathname: '/product-details',
          params: {
            productId: product.product_id,
            productName: product.product_title,
          },
        });
      });
    },
    [animateOut],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: AdminOrderLineItem }) => {
      const thumbnail = item.thumbnail || item.product?.thumbnail || item.product?.images?.[0]?.url;
      return (
        <TouchableOpacity className="flex-row gap-4" onPress={() => handleProductPress(item)}>
          <View className="aspect-square h-16 overflow-hidden rounded-lg bg-gray-300">
            {thumbnail && <Image source={{ uri: thumbnail }} className="h-full w-full object-cover" />}
          </View>
          <View>
            <Text>{item.title}</Text>
            <Text className="mt-auto text-sm text-gray-300">
              {item.variant?.options?.map((o) => o.value).join(', ')}
            </Text>
          </View>
          <View className="ml-auto">
            <Text>
              {item.total.toLocaleString('en-US', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
            <Text className="mt-auto text-right text-sm text-gray-300">
              Qty: {item.quantity.toLocaleString('en-US')}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [currency, handleProductPress],
  );

  return (
    <>
      <View className="mb-4 flex-row items-center justify-between gap-4">
        <Text className="text-2xl">Order #{orderNumber}</Text>
        <Text className="text-gray-300">{orderDate}</Text>
      </View>
      {orderQuery.isLoading || settings.isLoading ? (
        <LoadingBanner variant="ghost" className="my-11">
          Fetching order details...
        </LoadingBanner>
      ) : orderQuery.isError ? (
        <View className="py-11">
          <InfoBanner colorScheme="error">
            {orderQuery.error.message || 'An unknown error occurred while fetching the order details.'}
          </InfoBanner>
        </View>
      ) : settings.isError ? (
        <View className="py-11">
          <InfoBanner colorScheme="error">
            {settings.error.message || 'An unknown error occurred while fetching the settings.'}
          </InfoBanner>
        </View>
      ) : orderQuery.isSuccess && orderQuery.data ? (
        <FlatList
          data={orderQuery.data.order.items}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View className="my-6 h-hairline w-full bg-gray-200" />}
          className="shrink grow-0"
          contentContainerClassName="pt-4 grow-0 pb-safe-offset-6"
          ListFooterComponentClassName="mt-14"
          ListFooterComponent={<OrderInformation order={orderQuery.data.order} currency={currency} />}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      ) : (
        <View className="py-11">
          <InfoBanner colorScheme="error">An unknown error occurred while fetching the order details.</InfoBanner>
        </View>
      )}
    </>
  );
};

export default function OrderDetailsScreen() {
  const [visible, setVisible] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);

      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }, []),
  );

  const renderContent = React.useCallback(({ animateOut }: { animateOut: (callback?: () => void) => void }) => {
    return <OrderDetails animateOut={animateOut} />;
  }, []);

  return (
    <BottomSheet visible={visible} onClose={() => router.back()} showCloseButton={false} dismissOnOverlayPress>
      {renderContent}
    </BottomSheet>
  );
}
