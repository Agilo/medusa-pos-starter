import { Antenna } from '@/components/icons/antenna';
import { Button } from '@/components/ui/Button';
import { LayoutWithScroll } from '@/components/ui/Layout';
import { Prompt } from '@/components/ui/Prompt';
import { Text } from '@/components/ui/Text';
import { useAuthCtx } from '@/contexts/auth';
import { useClearSettings, useSettings } from '@/contexts/settings';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const auth = useAuthCtx();
  const settings = useSettings();
  const clearSettings = useClearSettings();

  const [isDialogVisible, setIsDialogVisible] = React.useState(false);

  return (
    <>
      <LayoutWithScroll>
        <Text className="mb-6 text-4xl">Settings</Text>
        <Text className="mb-4 text-2xl">Sales Channel</Text>
        <Button
          onPress={() => router.push('/settings/sales-channel')}
          variant="outline"
          icon={<Antenna size={16} />}
          iconPosition="left"
          className="mb-8 justify-end"
        >
          {settings.data?.sales_channel?.name || '—'}
        </Button>
        <Text className="mb-4 text-2xl">Region</Text>
        <Button
          onPress={() => router.push('/settings/region')}
          variant="outline"
          icon={<Antenna size={16} />}
          iconPosition="left"
          className="mb-8 justify-end"
        >
          {settings.data?.region?.name || '—'}
        </Button>
        <Text className="mb-4 text-2xl">Stock location</Text>
        <Button
          onPress={() => router.push('/settings/stock-location')}
          variant="outline"
          icon={<Antenna size={16} />}
          iconPosition="left"
          className="mb-8 justify-end"
        >
          {settings.data?.stock_location?.name || '—'}
        </Button>
        <Text className="mb-4 text-2xl">Reset</Text>
        <Button
          variant="outline"
          onPress={() => {
            clearSettings.mutate();
          }}
          className="mb-8"
        >
          Clear Settings
        </Button>
        <Text className="mb-4 text-2xl">Account</Text>
        <Button onPress={() => setIsDialogVisible(true)} className="mb-4">
          Log Out
        </Button>
        <Text className="text-gray-300">You will be signed out of your account.</Text>
      </LayoutWithScroll>

      <Prompt
        onSubmit={async () => {
          queryClient.clear();
          router.replace('/login');
          await auth.logout();
        }}
        onClose={() => setIsDialogVisible(false)}
        submitText="Logout"
        cancelText="Cancel"
        title="Are you sure you want to logout?"
        visible={isDialogVisible}
        showCloseButton={false}
        dismissOnOverlayPress={false}
      />
    </>
  );
}
