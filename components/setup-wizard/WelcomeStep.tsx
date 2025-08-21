import { Button } from '@/components/ui/Button';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import React from 'react';
import { View } from 'react-native';

interface WelcomeStepProps {
  onComplete: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
  return (
    <Layout className="pb-6">
      <Text className="mb-6 text-4xl">Welcome</Text>
      <Text className="mb-2 text-2xl">You&apos;re all set to start selling</Text>
      <Text className="mb-6 text-gray-600">
        Your Point of Sale system is now configured and ready to use. You can start managing your sales, products, and
        customers right away.
      </Text>

      <Text className="mb-4 text-gray-600">Here are some things you can do next:</Text>
      <Text className="mb-2 text-gray-600">• Browse products and add them to cart</Text>
      <Text className="mb-2 text-gray-600">• Process customer orders</Text>
      <Text className="mb-2 text-gray-600">• Scan barcodes for quick adding to cart</Text>
      <Text className="mb-6 text-gray-600">• Track sales and inventory</Text>

      <View className="flex-1" />

      <Button onPress={onComplete}>Get Started</Button>
    </Layout>
  );
};
