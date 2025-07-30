import {
  DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL,
  useCompleteDraftOrder,
  useCurrentDraftOrder,
  useDraftOrderOrOrder,
} from '@/api/hooks/draft-orders';
import { ShoppingCart } from '@/components/icons/shopping-cart';
import { InfoBanner } from '@/components/InfoBanner';
import { CheckoutSkeleton } from '@/components/skeletons/CheckoutSkeleton';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { AdminOrderLineItem } from '@medusajs/types';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import React from 'react';
import { Image, View } from 'react-native';

const DraftOrderItem: React.FC<{ item: AdminOrderLineItem }> = ({ item }) => {
  const settings = useSettings();
  const draftOrder = useCurrentDraftOrder();
  const thumbnail = item.thumbnail || item.product?.thumbnail || item.product?.images?.[0]?.url;

  return (
    <View className="flex-row gap-4 bg-white py-6">
      <View className="h-[5.25rem] w-[5.25rem] rounded-xl bg-gray-200 overflow-hidden">
        {thumbnail && <Image source={{ uri: thumbnail }} className="w-full h-full object-cover" />}
      </View>
      <View className="flex-col gap-2 flex-1">
        <Text>{item.product_title}</Text>
        {item.variant && item.variant.options && item.variant.options.length > 0 && (
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            {item.variant.options.map((option) => (
              <View className="flex-row gap-1" key={option.id}>
                <Text className="text-gray-400 text-sm">{option.option?.title || option.option_id}:</Text>
                <Text className="text-sm">{option.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text className="ml-auto">
        {item.unit_price.toLocaleString('en-US', {
          style: 'currency',
          currency: draftOrder.data?.draft_order.region?.currency_code || settings.data?.region?.currency_code,
          currencyDisplay: 'narrowSymbol',
        })}
      </Text>
    </View>
  );
};

export default function CheckoutScreen() {
  const pathName = usePathname();
  const { draftOrderId } = useLocalSearchParams<{ draftOrderId: string }>();
  const settings = useSettings();
  const draftOrder = useDraftOrderOrOrder(draftOrderId);
  const completeOrder = useCompleteDraftOrder(draftOrderId);

  const renderItem = React.useCallback<ListRenderItem<AdminOrderLineItem>>(
    ({ item }) => <DraftOrderItem item={item} />,
    [],
  );

  const items = draftOrder.data?.items || [];

  if (draftOrder.isLoading || settings.isLoading) {
    return <CheckoutSkeleton />;
  }

  if (draftOrder.isError || settings.isError) {
    return (
      <Layout>
        <Text className="text-4xl">Checkout</Text>
        <View className="flex-1 items-center gap-2 justify-center">
          <InfoBanner variant="ghost" colorScheme="error" className="w-40">
            Failed to load cart
          </InfoBanner>
          <Button
            onPress={() => {
              draftOrder.refetch();
              settings.refetch();
            }}
            isPending={draftOrder.isRefetching || settings.isRefetching}
            variant="outline"
          >
            Try Again
          </Button>
        </View>
      </Layout>
    );
  }

  if (!draftOrder.data?.items.length) {
    return (
      <Layout className="pb-2.5">
        <Text className="text-4xl">Checkout</Text>
        <View className="flex-1 items-center gap-1 justify-center">
          <ShoppingCart size={24} />
          <Text className="text-xl">Your cart is empty</Text>
          <Text className="text-gray-300 text-center">
            It seems you have no items in your cart.{'\n'}Please add items to your cart before{'\n'}proceeding to
            checkout.
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onPress={() => router.back()}>
            Back to Cart
          </Button>
          <Button className="flex-1" disabled>
            Complete Order
          </Button>
        </View>
      </Layout>
    );
  }

  const isDraftOrder = draftOrder.data.status === 'draft';
  const customerEmail = draftOrder.data.customer?.email;
  const customerName = [draftOrder.data.customer?.first_name, draftOrder.data.customer?.last_name]
    .filter(Boolean)
    .join(' ');
  const customerPhone = draftOrder.data.customer?.phone;
  const isPosDefaultCustomer = !customerEmail || customerEmail === DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL;

  return (
    <>
      <Layout className="pb-2.5">
        <Text className="text-4xl mb-6">Checkout</Text>

        <FlashList
          data={items}
          renderItem={renderItem}
          estimatedItemSize={132}
          ItemSeparatorComponent={() => <View className="h-hairline bg-gray-200" />}
          ListHeaderComponent={() => <Text className="text-2xl">Cart Items</Text>}
          ListFooterComponent={() =>
            !isPosDefaultCustomer ? (
              <View className="mt-4 mb-10">
                <Text className="text-2xl mb-6">Information</Text>

                {customerName && (
                  <View className="flex-row mb-4">
                    <Text className="text-gray-300 w-24">Full Name</Text>
                    <Text className="flex-wrap flex-1">{customerName}</Text>
                  </View>
                )}
                <View className="flex-row mb-4">
                  <Text className="text-gray-300 w-24">E-Mail</Text>
                  <Text className="flex-wrap flex-1">{customerEmail}</Text>
                </View>
                {customerPhone && (
                  <View className="flex-row">
                    <Text className="text-gray-300 w-24">Phone</Text>
                    <Text className="flex-wrap flex-1">{customerPhone}</Text>
                  </View>
                )}
              </View>
            ) : null
          }
        />

        <View className="py-4 gap-y-2 border-y mb-6 border-gray-200">
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Taxes</Text>
            <Text className="text-gray-400 text-sm">
              {draftOrder.data.tax_total?.toLocaleString('en-US', {
                style: 'currency',
                currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Subtotal</Text>
            <Text className="text-gray-400 text-sm">
              {draftOrder.data.subtotal?.toLocaleString('en-US', {
                style: 'currency',
                currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
          {typeof draftOrder.data.discount_total === 'number' && draftOrder.data.discount_total > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-sm">Discount</Text>
              <Text className="text-gray-400 text-sm">
                {(draftOrder.data.discount_total * -1)?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between mb-6">
          <Text className="text-lg">Total</Text>
          <Text className="text-lg">
            {draftOrder.data.total?.toLocaleString('en-US', {
              style: 'currency',
              currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
              currencyDisplay: 'narrowSymbol',
            })}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.back()}
            disabled={!isDraftOrder || completeOrder.isPending}
          >
            Back to Cart
          </Button>
          <Button
            className="flex-1"
            onPress={() => completeOrder.mutate()}
            disabled={!isDraftOrder}
            isPending={completeOrder.isPending}
          >
            Complete Order
          </Button>
        </View>
      </Layout>

      <Dialog
        visible={!isDraftOrder && pathName === `/checkout/${draftOrderId}`}
        showCloseButton={false}
        dismissOnOverlayPress={false}
        onRequestClose={(event) => {
          event.preventDefault();
        }}
        onOverlayPress={(event) => {
          event.preventDefault();
        }}
        onCloseIconPress={(event) => {
          event.preventDefault();
        }}
        title="Order confirmed!"
        animationType="fade"
        contentClassName="flex-shrink"
      >
        <InfoBanner colorScheme="success" className="mb-4">
          The order has been placed successfully. You can track the order status on Orders screen.
        </InfoBanner>

        <Button
          className="mb-2"
          onPress={() => {
            router.replace('/orders');
            router.push(`/orders/${draftOrderId}`);
          }}
        >
          View Order
        </Button>
        <Button
          variant="outline"
          onPress={() => {
            router.replace('/products');
          }}
        >
          Back to shop
        </Button>
      </Dialog>
    </>
  );
}
