import { Antenna } from '@/components/icons/antenna';
import { Button } from '@/components/ui/Button';
import { LayoutWithScroll } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useAuthCtx } from '@/contexts/auth';
import { useClearSettings, useSettings } from '@/contexts/settings';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const auth = useAuthCtx();
  const settings = useSettings();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const clearSettings = useClearSettings();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          queryClient.clear();
          router.replace('/login');
          await auth.logout();
        },
      },
    ]);
  };

  return (
    <LayoutWithScroll contentContainerClassName="pb-0">
      <View style={{ paddingBottom: bottomTabBarHeight + 10 }}>
        <Text className="text-4xl mb-6">Settings</Text>

        <Text className="text-2xl mb-4">Sales Channel</Text>

        <Button
          onPress={() => router.push('/setup-wizard')}
          variant="outline"
          icon={<Antenna size={16} />}
          iconPosition="left"
          className="mb-8 justify-end"
        >
          {settings.data?.sales_channel?.name || '—'}
        </Button>

        <Text className="text-2xl mb-4">Stock location</Text>

        <Button
          onPress={() => router.push('/setup-wizard')}
          variant="outline"
          icon={<Antenna size={16} />}
          iconPosition="left"
          className="mb-8 justify-end"
        >
          {settings.data?.stock_location?.name || '—'}
        </Button>

        <Button
          onPress={() => {
            clearSettings.mutate();
          }}
          className="mb-8"
        >
          Clear Settings
        </Button>

        <Text className="text-2xl mb-4">Account</Text>

        <Button onPress={handleLogout} className="mb-4">
          Log Out
        </Button>

        <Text className="text-gray-300">You will be signed out of your account.</Text>
      </View>
    </LayoutWithScroll>
  );
}
