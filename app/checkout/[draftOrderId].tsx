import {
  DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL,
  useCompleteDraftOrder,
  useCurrentDraftOrder,
  useDraftOrderOrOrder,
} from '@/api/hooks/draft-orders';
import { CreditCard } from '@/components/icons/credit-card';
import { ShoppingCart } from '@/components/icons/shopping-cart';
import { Wallet } from '@/components/icons/wallet';
import { InfoBanner } from '@/components/InfoBanner';
import { PaymentSelection } from '@/components/PaymentSelection';
import { CheckoutSkeleton } from '@/components/skeletons/CheckoutSkeleton';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { formatDate } from '@/utils/date';
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
      <View className="h-[5.25rem] w-[5.25rem] overflow-hidden rounded-xl bg-gray-200">
        {thumbnail && <Image source={{ uri: thumbnail }} className="h-full w-full object-cover" />}
      </View>
      <View className="flex-1 flex-col gap-2">
        <Text>{item.product_title}</Text>
        {item.variant && item.variant.options && item.variant.options.length > 0 && (
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            {item.variant.options.map((option) => (
              <View className="flex-row gap-1" key={option.id}>
                <Text className="text-sm text-gray-400">{option.option?.title || option.option_id}:</Text>
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

  const [step, setStep] = React.useState('details');

  const items = draftOrder.data?.items || [];

  if (draftOrder.isLoading || settings.isLoading) {
    return <CheckoutSkeleton />;
  }

  if (draftOrder.isError || settings.isError) {
    return (
      <Layout>
        <Text className="text-4xl">Checkout</Text>
        <View className="flex-1 items-center justify-center gap-2">
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
      <Layout>
        <Text className="text-4xl">Checkout</Text>
        <View className="flex-1 items-center justify-center gap-1">
          <ShoppingCart size={24} />
          <Text className="text-xl">Your cart is empty</Text>
          <Text className="text-center text-gray-300">
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

  const PAYMENT_METHODS = [
    {
      id: 'cash',
      label: 'Cash',
      description: 'Pay with cash on delivery',
      icon: <Wallet size={20} />,
    },
    {
      id: 'card',
      label: 'Credit card',
      description: 'Pay with your credit card',
      icon: <CreditCard size={20} />,
    },
  ];

  const renderStepDetails = () => {
    switch (step) {
      case 'details':
        return (
          <FlashList
            data={items}
            renderItem={renderItem}
            estimatedItemSize={132}
            ItemSeparatorComponent={() => <View className="h-hairline bg-gray-200" />}
            ListHeaderComponent={() => <Text className="text-2xl">Cart Items</Text>}
            ListFooterComponent={() =>
              !isPosDefaultCustomer ? (
                <View className="mb-10 mt-4">
                  <Text className="mb-6 text-2xl">Information</Text>

                  {customerName && (
                    <View className="mb-4 flex-row">
                      <Text className="w-24 text-gray-300">Full Name</Text>
                      <View className="flex-1">
                        <Text>{customerName}</Text>
                      </View>
                    </View>
                  )}
                  <View className="flex-row">
                    <Text className="w-24 text-gray-300">E-Mail</Text>
                    <View className="flex-1">
                      <Text>{customerEmail}</Text>
                    </View>
                  </View>
                  {customerPhone && (
                    <View className="mt-4 flex-row">
                      <Text className="w-24 text-gray-300">Phone</Text>
                      <View className="flex-1">
                        <Text>{customerPhone}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : null
            }
            keyboardDismissMode="on-drag"
          />
        );
      case 'payment':
        return (
          <>
            <Text className="mb-6 text-2xl">Payment</Text>
            <PaymentSelection methods={PAYMENT_METHODS} className="mb-auto" />
          </>
        );
      default:
        return null;
    }
  };

  const renderStepButtons = () => {
    switch (step) {
      case 'details':
        return (
          <View className="pb-safe flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => router.back()} disabled={!isDraftOrder}>
              Back to Cart
            </Button>
            <Button className="flex-1" onPress={() => setStep('payment')} disabled={!isDraftOrder}>
              Next: Payment
            </Button>
          </View>
        );
      case 'payment':
        return (
          <View className="pb-safe flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => setStep('details')}
              disabled={!isDraftOrder || completeOrder.isPending}
            >
              Back: Details
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
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Layout>
        <Text className="mb-6 text-4xl">Checkout</Text>
        {renderStepDetails()}
        <View className="mb-6 gap-y-2 border-y border-gray-200 py-4">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Taxes</Text>
            <Text className="text-sm text-gray-400">
              {draftOrder.data.tax_total?.toLocaleString('en-US', {
                style: 'currency',
                currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Subtotal</Text>
            <Text className="text-sm text-gray-400">
              {draftOrder.data.subtotal?.toLocaleString('en-US', {
                style: 'currency',
                currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </View>
          {typeof draftOrder.data.discount_total === 'number' && draftOrder.data.discount_total > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-400">Discount</Text>
              <Text className="text-sm text-gray-400">
                {(draftOrder.data.discount_total * -1)?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-6 flex-row justify-between">
          <Text className="text-lg">Total</Text>
          <Text className="text-lg">
            {draftOrder.data.total?.toLocaleString('en-US', {
              style: 'currency',
              currency: draftOrder.data.region?.currency_code || settings.data?.region?.currency_code,
              currencyDisplay: 'narrowSymbol',
            })}
          </Text>
        </View>
        {renderStepButtons()}
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
            router.push({
              pathname: '/orders/[orderId]',
              params: {
                orderId: draftOrderId,
                orderNumber: draftOrder.data.display_id,
                orderDate: formatDate(draftOrder.data.created_at),
              },
            });
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
