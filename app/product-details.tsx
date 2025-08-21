import { useAddToDraftOrder } from '@/api/hooks/draft-orders';
import { useProduct } from '@/api/hooks/products';
import { ProductDetailsSkeleton } from '@/components/skeletons/ProductDetailsSkeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { QuantityPicker } from '@/components/ui/QuantityPicker';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/contexts/settings';
import { AdminProductImage } from '@medusajs/types';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Dimensions, Image, ScrollView, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, { CarouselRenderItem, ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';

const windowWidth = Dimensions.get('window').width;

const ProductImagesCarousel: React.FC<{ images: AdminProductImage[] }> = ({ images }) => {
  const targetRef = React.useRef<View>(null);
  const carouselRef = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const scrollOffsetValue = useSharedValue<number>(0);
  const [width, setWidth] = React.useState<number>(windowWidth);

  // Calculate height based on width with 4:3 aspect ratio
  const height = Math.round(width * 0.75);

  React.useLayoutEffect(() => {
    targetRef.current?.measure((x, y, width) => {
      setWidth(width);
    });
  }, []);

  const renderItem = React.useCallback<CarouselRenderItem<AdminProductImage>>(({ item }) => {
    return <Image source={{ uri: item.url }} className="h-full w-full object-cover" />;
  }, []);

  const onPressPagination = React.useCallback(
    (index: number) => {
      carouselRef.current?.scrollTo({
        count: index - progress.value,
        animated: true,
      });
    },
    [progress],
  );

  return (
    <View ref={targetRef}>
      <Carousel
        ref={carouselRef}
        loop={true}
        width={width}
        height={height}
        snapEnabled={true}
        pagingEnabled={true}
        autoPlayInterval={2000}
        data={images}
        defaultScrollOffsetValue={scrollOffsetValue}
        style={{ width: '100%' }}
        onConfigurePanGesture={(gestureChain) => {
          gestureChain.activeOffsetY([-5, 5]);
        }}
        renderItem={renderItem}
        onProgressChange={progress}
      />

      <Pagination.Basic
        progress={progress}
        data={images.map((item) => item.url)}
        dotStyle={{
          width: (width - 32) / images.length,
          height: 1.5,
          backgroundColor: '#B5B5B5',
        }}
        activeDotStyle={{
          overflow: 'hidden',
          backgroundColor: '#1B1B1B',
        }}
        containerStyle={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
        }}
        horizontal
        onPress={onPressPagination}
      />
    </View>
  );
};

const ProductDetails: React.FC<{ animateOut: (callback?: () => void) => void }> = ({ animateOut }) => {
  const settings = useSettings();
  const [quantity, setQuantity] = React.useState(1);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, string>>({});

  const params = useLocalSearchParams<{
    productId: string;
    productName: string;
  }>();
  const { productId, productName } = params;
  const productQuery = useProduct(productId);
  const addToDraftOrder = useAddToDraftOrder({
    onError: (error) => {
      console.error('Error adding items to draft order:', error);
    },
  });

  React.useEffect(() => {
    if (productQuery.data) {
      const firstVariant = productQuery.data.product.variants?.[0];

      if (firstVariant) {
        const initialOptions =
          firstVariant.options?.reduce(
            (acc, option) => {
              if (option.value && option.option_id) {
                acc[option.option_id] = option.value;
              }
              return acc;
            },
            {} as Record<string, string>,
          ) ?? {};

        setSelectedOptions(initialOptions);
      }
    }
  }, [productQuery.data]);

  if (productQuery.isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (productQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">Error loading product details</Text>
      </View>
    );
  }

  if (!productQuery.data) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">Product not found</Text>
      </View>
    );
  }

  const selectedVariant = productQuery.data?.product.variants?.find((variant) => {
    return Object.entries(selectedOptions).every(([optionId, value]) =>
      variant.options?.some((option) => option.option_id === optionId && option.value === value),
    );
  });

  const currencyCode = settings.data?.region?.currency_code || 'eur';
  const price = selectedVariant?.prices?.find((price) => price.currency_code === currencyCode);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-safe-offset-6">
      <View className="mb-6 overflow-hidden rounded-xl bg-gray-100">
        {productQuery.data.product.images && productQuery.data.product.images.length ? (
          <ProductImagesCarousel images={productQuery.data.product.images} />
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-300">
            <Text className="text-gray-500">No Image</Text>
          </View>
        )}
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl">{productName}</Text>
        {price && (
          <View className="flex-row">
            {/* TODO: show discounted price */}
            {/* <Text className="text-[#888] line-through mt-1.5">€50</Text> */}
            <View className="items-end">
              <Text className="text-xl">
                {price.amount.toLocaleString(undefined, {
                  style: 'currency',
                  currency: price.currency_code,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Text>
              {/* TODO: show taxes if needed */}
              {/* <Text className="text-xs text-gray-400 font-light">
                  Taxes: €0.99
                </Text> */}
            </View>
          </View>
        )}
      </View>

      <Text className="mb-6 text-sm text-gray-400">{productQuery.data.product.description}</Text>

      {productQuery.data.product.options && (
        <View className="mb-4 gap-6">
          {productQuery.data.product.options.map((option) => (
            <OptionPicker
              key={option.id}
              label={option.title}
              values={(option.values ?? []).map((value) => ({
                id: value.id,
                value: value.value,
                className: productQuery.data.product.variants?.some((variant) => {
                  const newSelectedOptions = {
                    ...selectedOptions,
                    [option.id]: value.value,
                  };

                  return Object.entries(newSelectedOptions).every(([optionId, optionValue]) =>
                    variant.options?.some(
                      (variantOption) => variantOption.option_id === optionId && variantOption.value === optionValue,
                    ),
                  );
                })
                  ? undefined
                  : 'opacity-50',
              }))}
              onValueChange={(value) => {
                setSelectedOptions((prev) => ({
                  ...prev,
                  [option.id]: value.value,
                }));
              }}
              selectedValue={selectedOptions[option.id]}
            />
          ))}
        </View>
      )}

      {/* TODO: add support for fashion starter colors */}
      {/* <ColorPicker
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          colors={[
            { name: 'Black', value: '#000000' },
            { name: 'White', value: '#FFFFFF' },
            { name: 'Navy', value: '#1E3A8A' },
            { name: 'Gray', value: '#6B7280' },
            { name: 'Red', value: '#DC2626' },
          ]}
          className="mb-6"
        />

        <SizePicker
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          sizes={['XS', 'S', 'M', 'L', 'XL']}
          className="mb-4"
        /> */}

      <View className="flex-row items-center gap-4">
        <QuantityPicker quantity={quantity} onQuantityChange={setQuantity} min={1} variant="ghost" />

        <Button
          className="flex-1"
          disabled={!selectedVariant}
          isPending={addToDraftOrder.isPending}
          onPress={() => {
            if (!selectedVariant) {
              return;
            }

            addToDraftOrder.mutate(
              {
                items: [
                  {
                    quantity,
                    variant_id: selectedVariant.id,
                  },
                ],
              },
              {
                onSuccess: () => {
                  animateOut();
                  router.dismissTo('/(tabs)/cart');
                },
              },
            );
          }}
        >
          Add to cart
        </Button>
      </View>
    </ScrollView>
  );
};

export default function ProductDetailsScreen() {
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
    return <ProductDetails animateOut={animateOut} />;
  }, []);

  return (
    <BottomSheet visible={visible} onClose={() => router.back()} showCloseButton={false} dismissOnOverlayPress>
      {renderContent}
    </BottomSheet>
  );
}
