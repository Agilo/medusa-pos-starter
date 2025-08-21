import { useCustomers } from '@/api/hooks/customers';
import {
  DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL,
  useAddPromotion,
  useCancelDraftOrder,
  useCurrentDraftOrder,
  useDraftOrderPromotions,
  useRemovePromotion,
  useUpdateDraftOrderCustomer,
  useUpdateDraftOrderItem,
} from '@/api/hooks/draft-orders';
import { Form } from '@/components/form/Form';
import { FormButton } from '@/components/form/FormButton';
import { TextField } from '@/components/form/TextField';
import { ChevronDown } from '@/components/icons/chevron-down';
import { ShoppingCart } from '@/components/icons/shopping-cart';
import { Tag } from '@/components/icons/tag';
import { Trash2 } from '@/components/icons/trash-2';
import { UserRoundPlus } from '@/components/icons/user-round-plus';
import { X } from '@/components/icons/x';
import { InfoBanner } from '@/components/InfoBanner';
import { CartSkeleton } from '@/components/skeletons/CartSkeleton';
import { SwipeableListItem } from '@/components/SwipeableListItem';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Layout } from '@/components/ui/Layout';
import { Prompt } from '@/components/ui/Prompt';
import { QuantityPicker } from '@/components/ui/QuantityPicker';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { AdminDraftOrder, AdminOrderLineItem, AdminPromotion } from '@medusajs/types';
import type { FlashListProps, FlashList as FlashListType } from '@shopify/flash-list';
import { AnimatedFlashList as FlashList, ListRenderItem } from '@shopify/flash-list';
import { useIsMutating } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { Image, Pressable, TouchableOpacity, View } from 'react-native';
import Animated, { SequencedTransition, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import * as z from 'zod/v4';

interface TPromotionItem extends AdminPromotion {
  __type__: 'promotion';
  discount_amount: number;
}

const addPromotionFormSchema = z.object({
  promotionCode: z.string().min(1, 'Promotion code is required'),
});

const ItemCell: FlashListProps<AdminOrderLineItem>['CellRendererComponent'] = (props) => {
  return <Animated.View {...props} layout={SequencedTransition} exiting={SlideOutLeft} />;
};

const DraftOrderItem: React.FC<{ item: AdminOrderLineItem; onRemove?: (item: AdminOrderLineItem) => void }> = ({
  item,
  onRemove,
}) => {
  const settings = useSettings();
  const draftOrder = useCurrentDraftOrder();
  const updateDraftOrderItem = useUpdateDraftOrderItem();
  const thumbnail = item.thumbnail || item.product?.thumbnail || item.product?.images?.[0]?.url;

  return (
    <SwipeableListItem
      rightClassName="bg-white"
      rightWidth={80}
      rightContent={(reset) => (
        <View className="h-full w-full flex-1 items-center justify-center p-2">
          <Pressable
            className="h-full w-full flex-1 items-center justify-center rounded-xl bg-error-500"
            onPress={() => {
              reset();
              onRemove?.(item);
            }}
          >
            <Trash2 size={24} color="white" />
          </Pressable>
        </View>
      )}
    >
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
          <QuantityPicker
            quantity={item.quantity}
            max={item.variant?.inventory_quantity}
            onQuantityChange={(quantity) =>
              updateDraftOrderItem.mutate({
                id: item.id,
                update: {
                  quantity,
                },
              })
            }
            className="self-start"
          />
        </View>
        <Text className="ml-auto">
          {item.unit_price.toLocaleString('en-US', {
            style: 'currency',
            currency: draftOrder.data?.draft_order.region?.currency_code || settings.data?.region?.currency_code,
            currencyDisplay: 'narrowSymbol',
          })}
        </Text>
      </View>
    </SwipeableListItem>
  );
};

const PromotionItem: React.FC<{
  item: TPromotionItem;
  onRemove?: (item: TPromotionItem) => Promise<void>;
  currencyCode: string | undefined;
}> = ({ item, onRemove, currencyCode }) => {
  const isAutomatic = item.is_automatic === true;

  const getPromotionTypeLabel = (type?: string) => {
    switch (type) {
      case 'standard':
        return 'Standard';
      case 'buyget':
        return 'Buy X Get Y';
      default:
        return 'Promotion';
    }
  };

  return (
    <SwipeableListItem
      rightClassName="bg-white"
      rightWidth={isAutomatic ? undefined : 80}
      rightContent={
        isAutomatic
          ? undefined
          : (reset) => (
              <View className="h-full w-full flex-1 items-center justify-center p-2">
                <Pressable
                  className="h-full w-full flex-1 items-center justify-center rounded-xl bg-error-500"
                  onPress={async () => {
                    await onRemove?.(item);
                    reset();
                  }}
                >
                  <Trash2 size={24} color="white" />
                </Pressable>
              </View>
            )
      }
    >
      <View className="flex-row gap-4 bg-white py-6">
        <View className="flex h-[5.25rem] w-[5.25rem] items-center justify-center overflow-hidden rounded-xl bg-green-100">
          <View className="flex items-center justify-center">
            <Tag size={32} color="#10B981" />
          </View>
        </View>
        <View className="flex-1 flex-col gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="font-medium">{item.code || 'Promotion'}</Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <View className="flex-row gap-1">
              <Text className="text-sm text-gray-400">Type:</Text>
              <Text className="text-sm">{getPromotionTypeLabel(item.type)}</Text>
            </View>
            <View className="flex-row gap-1">
              <Text className="text-sm text-gray-400">Method:</Text>
              <Text className="text-sm">{isAutomatic ? 'Automatic' : 'Code'}</Text>
            </View>
            {item.campaign && (
              <View className="flex-row gap-1">
                <Text className="text-sm text-gray-400">Campaign:</Text>
                <Text className="text-sm">{item.campaign.name}</Text>
              </View>
            )}
          </View>
        </View>
        <Text className="ml-auto">
          {(item.discount_amount * -1).toLocaleString('en-US', {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'narrowSymbol',
          })}
        </Text>
      </View>
    </SwipeableListItem>
  );
};

const CustomerBadge: React.FC<{ customer: AdminDraftOrder['customer'] }> = ({ customer }) => {
  const updateDraftOrder = useUpdateDraftOrderCustomer();
  const defaultCustomer = useCustomers({ email: DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL }, 1);

  if (!customer || customer.email === DRAFT_ORDER_DEFAULT_CUSTOMER_EMAIL) {
    return (
      <Button
        onPress={() => router.push('/customer-lookup')}
        variant="outline"
        icon={<UserRoundPlus size={20} />}
        className="mb-6 justify-between"
      >
        Add Customer
      </Button>
    );
  }

  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ');

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: '/customer-lookup',
          params: {
            customerId: customer.id,
          },
        });
      }}
      className="mb-6 flex-row items-center justify-between border-b border-gray-200 pb-6"
    >
      {customerName.length > 0 ? (
        <View>
          <Text className="text-lg">{customerName}</Text>
          <Text className="text-sm text-gray-300">{customer.email}</Text>
        </View>
      ) : (
        <View>
          <Text className="text-sm text-gray-300">Customer</Text>
          <Text className="text-lg">{customer.email}</Text>
        </View>
      )}

      <View className="flex-row">
        <View className="p-2">
          <ChevronDown size={24} />
        </View>
        <TouchableOpacity
          onPress={() => updateDraftOrder.mutate(defaultCustomer.data?.pages[0].customers?.[0])}
          className="p-2"
        >
          <X size={24} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface PromotionBadgeProps {
  onAddPromotion: (code: string) => void;
  isAddingPromotion: boolean;
}

const PromotionBadge: React.FC<PromotionBadgeProps> = ({ onAddPromotion, isAddingPromotion }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <>
      <Button
        onPress={() => setIsDialogOpen(true)}
        variant="outline"
        icon={<Tag size={16} />}
        className="mb-4 justify-between"
      >
        Add Promotion
      </Button>

      <Dialog visible={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Add Promotion Code">
        <Form
          schema={addPromotionFormSchema}
          onSubmit={(data, form) => {
            onAddPromotion(data.promotionCode);
            form.reset();
            setIsDialogOpen(false);
          }}
          className="gap-4"
        >
          <TextField
            placeholder="Enter promotion code"
            name="promotionCode"
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="characters"
            enterKeyHint="send"
            autoFocus
          />
          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <FormButton className="flex-1" isPending={isAddingPromotion}>
              Apply
            </FormButton>
          </View>
        </Form>
      </Dialog>
    </>
  );
};

const CartSummaryHeader: React.FC<
  PromotionBadgeProps & {
    isLoading?: boolean;
    taxTotal: number;
    subtotal: number;
    discountTotal: number;
    currencyCode?: string;
  }
> = ({ onAddPromotion, isAddingPromotion, isLoading, taxTotal, subtotal, discountTotal, currencyCode }) => {
  return (
    <View className="pb-4 pt-6">
      <PromotionBadge onAddPromotion={onAddPromotion} isAddingPromotion={isAddingPromotion} />
      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-400">Taxes</Text>
          {isLoading ? (
            <View className="h-[17px] w-1/4 rounded-md bg-gray-200" />
          ) : (
            <Text className="text-sm text-gray-400">
              {taxTotal.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-400">Subtotal</Text>
          {isLoading ? (
            <View className="h-[17px] w-1/4 rounded-md bg-gray-200" />
          ) : (
            <Text className="text-sm text-gray-400">
              {subtotal.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          )}
        </View>
        {discountTotal > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Discount</Text>
            {isLoading ? (
              <View className="h-[17px] w-1/4 rounded-md bg-gray-200" />
            ) : (
              <Text className="text-sm text-gray-400">
                {(discountTotal * -1)?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default function CartScreen() {
  const settings = useSettings();
  const windowDimensions = useSafeAreaFrame();
  const draftOrder = useCurrentDraftOrder();
  const draftOrderPromotionCodes = React.useMemo(() => {
    const allCodes =
      draftOrder.data?.draft_order.items
        .flatMap((item) => item.adjustments?.map((adj) => adj.code))
        .filter((code) => typeof code === 'string') ?? [];
    return Array.from(new Set(allCodes));
  }, [draftOrder.data]);
  const addedPromotions = useDraftOrderPromotions(draftOrderPromotionCodes);
  const addPromotion = useAddPromotion();
  const removePromotion = useRemovePromotion();
  const cancelDraftOrder = useCancelDraftOrder();
  const updateDraftOrderItem = useUpdateDraftOrderItem();
  const isUpdatingDraftOrder = useIsMutating({ mutationKey: ['draft-order'], exact: false });
  const itemsListRef = React.useRef<FlashListType<AdminOrderLineItem>>(null);

  const [isDialogVisible, setIsDialogVisible] = React.useState(false);

  const onItemRemove = React.useCallback(
    (item: AdminOrderLineItem) => {
      updateDraftOrderItem.mutate({ id: item.id, update: { quantity: 0 } });
      itemsListRef.current?.prepareForLayoutAnimationRender();
    },
    [updateDraftOrderItem],
  );

  const onPromotionRemove = React.useCallback(
    async (promotion: AdminPromotion) => {
      if (promotion.code) {
        await removePromotion.mutateAsync(promotion.code).catch(() => {});
        itemsListRef.current?.prepareForLayoutAnimationRender();
      }
    },
    [removePromotion],
  );

  const renderItem = React.useCallback<
    ListRenderItem<(AdminOrderLineItem & { __type__: 'draft_order_item' }) | TPromotionItem>
  >(
    ({ item }) =>
      item.__type__ === 'draft_order_item' ? (
        <DraftOrderItem item={item} onRemove={onItemRemove} />
      ) : (
        <PromotionItem
          item={item}
          onRemove={onPromotionRemove}
          currencyCode={draftOrder.data?.draft_order.region?.currency_code || settings.data?.region?.currency_code}
        />
      ),
    [
      draftOrder.data?.draft_order.region?.currency_code,
      onItemRemove,
      onPromotionRemove,
      settings.data?.region?.currency_code,
    ],
  );

  if (draftOrder.isLoading || settings.isLoading) {
    return <CartSkeleton />;
  }

  if (draftOrder.isError || settings.isError) {
    return (
      <Layout className="pb-6">
        <Text className="text-4xl">Cart</Text>
        <View className="flex-1 items-center  justify-center gap-2">
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

  if (!draftOrder.data?.draft_order || !draftOrder.data?.draft_order.items.length) {
    return (
      <Layout className="pb-6">
        <Text className="text-4xl">Cart</Text>
        <View className="flex-1 items-center justify-center gap-1">
          <ShoppingCart size={24} />
          <Text className="text-xl">Your cart is empty</Text>
          <Text className="text-gray-300">Add products to begin</Text>
        </View>
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => {
              cancelDraftOrder.mutate();
            }}
            isPending={cancelDraftOrder.isPending}
            disabled={!draftOrder.data?.draft_order}
          >
            Cancel Cart
          </Button>
          <Button className="flex-1" disabled>
            Checkout
          </Button>
        </View>
      </Layout>
    );
  }

  const items = [
    ...draftOrder.data.draft_order.items.map((item) => ({
      ...item,
      __type__: 'draft_order_item' as const,
    })),
    ...(addedPromotions.data?.promotions ?? []).map(
      (promotion) =>
        ({
          ...promotion,
          __type__: 'promotion' as const,
          discount_amount:
            draftOrder.data?.draft_order.items
              .flatMap((item) => item.adjustments?.filter((adj) => adj.promotion_id === promotion.id))
              .reduce((acc, adj) => acc + (adj?.amount || 0), 0) || 0,
        }) satisfies TPromotionItem,
    ),
  ];

  return (
    <>
      <Layout className="pb-6">
        <Text className="mb-6 text-4xl">Cart</Text>
        <CustomerBadge customer={draftOrder.data.draft_order.customer} />
        <FlashList
          ref={itemsListRef}
          data={items}
          keyExtractor={(item) => item.id}
          estimatedItemSize={132}
          renderItem={renderItem}
          getItemType={(item) => item.__type__}
          ItemSeparatorComponent={() => <View className="h-hairline bg-gray-200" />}
          CellRendererComponent={ItemCell}
          disableAutoLayout
          ListFooterComponent={() =>
            draftOrder.data && (windowDimensions.width < 768 || windowDimensions.height < 900) ? (
              <CartSummaryHeader
                onAddPromotion={(code) => addPromotion.mutate(code)}
                isAddingPromotion={addPromotion.isPending}
                isLoading={draftOrder.isFetching || isUpdatingDraftOrder > 0}
                taxTotal={draftOrder.data.draft_order.tax_total}
                subtotal={draftOrder.data.draft_order.subtotal}
                discountTotal={draftOrder.data.draft_order.discount_total}
                currencyCode={
                  draftOrder.data?.draft_order.region?.currency_code || settings.data?.region?.currency_code
                }
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
        <View>
          {windowDimensions.width >= 768 && windowDimensions.height >= 900 && (
            <CartSummaryHeader
              onAddPromotion={(code) => addPromotion.mutate(code)}
              isAddingPromotion={addPromotion.isPending}
              isLoading={draftOrder.isFetching || isUpdatingDraftOrder > 0}
              taxTotal={draftOrder.data.draft_order.tax_total}
              subtotal={draftOrder.data.draft_order.subtotal}
              discountTotal={draftOrder.data.draft_order.discount_total}
              currencyCode={draftOrder.data?.draft_order.region?.currency_code || settings.data?.region?.currency_code}
            />
          )}
          <View className="mb-4 h-hairline bg-gray-200" />
          <View className="mb-6 flex-row justify-between">
            <Text className="text-lg">Total</Text>
            {draftOrder.isFetching || isUpdatingDraftOrder > 0 ? (
              <View className="h-7 w-1/4 rounded-md bg-gray-200" />
            ) : (
              <Text className="text-lg">
                {draftOrder.data.draft_order.total?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: draftOrder.data.draft_order.region?.currency_code || settings.data?.region?.currency_code,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
            )}
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => setIsDialogVisible(true)}
              isPending={cancelDraftOrder.isPending}
              disabled={draftOrder.isFetching || isUpdatingDraftOrder > 0}
            >
              Cancel Cart
            </Button>
            <Button
              className="flex-1"
              disabled={
                draftOrder.data.draft_order.items.length === 0 || draftOrder.isFetching || isUpdatingDraftOrder > 0
              }
              onPress={() => {
                if (!draftOrder.data?.draft_order.id) {
                  return;
                }
                router.push(`/checkout/${draftOrder.data.draft_order.id}`);
              }}
            >
              Checkout
            </Button>
          </View>
        </View>
      </Layout>

      <Prompt
        onSubmit={() => cancelDraftOrder.mutate()}
        onClose={() => setIsDialogVisible(false)}
        title="Are you sure you want to cancel the cart?"
        visible={isDialogVisible}
        showCloseButton={false}
        dismissOnOverlayPress={false}
      />
    </>
  );
}
