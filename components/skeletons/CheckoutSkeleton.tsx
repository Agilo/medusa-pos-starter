import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { View } from 'react-native';

export const CheckoutSkeleton = () => (
  <Layout className="pb-2.5">
    <Text className="text-4xl mb-6">Checkout</Text>

    {/* Order Items */}
    <View className="flex-1 overflow-hidden">
      <Text className="text-2xl">Cart Items</Text>
      {[1, 2].map((index) => (
        <View key={index} className="flex-row gap-4 bg-white py-6">
          <View className="h-[5.25rem] w-[5.25rem] rounded-xl bg-gray-200" />
          <View className="flex-col gap-2 flex-1">
            <View className="w-3/4 h-5 rounded-md bg-gray-200" />
            <View className="w-1/2 h-4 rounded-md bg-gray-200" />
          </View>
          <View className="w-16 h-5 rounded-md bg-gray-200 ml-auto" />
        </View>
      ))}
      <View className="mt-4">
        <Text className="text-2xl mb-6">Information</Text>

        <View className="flex-row mb-4">
          <Text className="text-gray-300 w-24">Full Name</Text>
          <View className="w-1/3 h-5 rounded-md bg-gray-200" />
        </View>
        <View className="flex-row mb-4">
          <Text className="text-gray-300 w-24">Mail</Text>
          <View className="w-1/3 h-5 rounded-md bg-gray-200" />
        </View>
        <View className="flex-row mb-4">
          <Text className="text-gray-300 w-24">Address</Text>
          <View className="w-1/2 h-5 rounded-md bg-gray-200" />
        </View>
        <View className="flex-row mb-10">
          <Text className="text-gray-300 w-24">Phone</Text>
          <View className="w-1/3 h-5 rounded-md bg-gray-200" />
        </View>
      </View>
    </View>

    <View className="mt-6">
      {/* Order Summary */}
      <View className="w-32 h-6 rounded-md bg-gray-200 mb-4" />

      <View className="flex-row mb-2 justify-between">
        <View className="w-16 h-4 rounded-md bg-gray-200" />
        <View className="w-20 h-4 rounded-md bg-gray-200" />
      </View>
      <View className="flex-row mb-2 justify-between">
        <View className="w-16 h-4 rounded-md bg-gray-200" />
        <View className="w-20 h-4 rounded-md bg-gray-200" />
      </View>
      <View className="flex-row justify-between">
        <View className="w-20 h-4 rounded-md bg-gray-200" />
        <View className="w-24 h-4 rounded-md bg-gray-200" />
      </View>

      <View className="h-hairline bg-gray-200 my-4" />

      <View className="flex-row justify-between mb-6">
        <View className="w-16 h-7 rounded-md bg-gray-200" />
        <View className="w-24 h-7 rounded-md bg-gray-200" />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <View className="flex-1 h-12 rounded-md bg-gray-200" />
        <View className="flex-1 h-12 rounded-md bg-gray-200" />
      </View>
    </View>
  </Layout>
);
