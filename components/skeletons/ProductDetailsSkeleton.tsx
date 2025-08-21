import { QuantityPicker } from '@/components/ui/QuantityPicker';
import { Text } from '@/components/ui/Text';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

export const ProductDetailsSkeleton = () => (
  <>
    <View className="mb-4 aspect-[4/3] w-full rounded-xl bg-gray-200" />

    <View className="mb-2 flex-row items-center gap-14">
      <View className="h-5 flex-1 rounded-md bg-gray-200" />
      <View className="h-5 flex-1 rounded-md bg-gray-200" />
    </View>

    <View className="mb-2 h-5 rounded-md bg-gray-200" />
    <View className="mb-6 h-5 w-1/2 rounded-md bg-gray-200" />

    <View className="mb-2 h-5 w-1/2 rounded-md bg-gray-200" />
    <View className="mb-6 h-5 rounded-md bg-gray-200" />

    <View className="mb-2 h-5 w-1/2 rounded-md bg-gray-200" />
    <View className="mb-4 h-5 rounded-md bg-gray-200" />

    <View className="flex-row items-center gap-4">
      <QuantityPicker quantity={1} onQuantityChange={() => {}} variant="ghost" disabled />

      <TouchableOpacity disabled className="flex-1 rounded-xl bg-gray-200 p-5">
        <Text className="mx-auto text-xl leading-5 text-gray-300">Add to cart</Text>
      </TouchableOpacity>
    </View>
  </>
);
