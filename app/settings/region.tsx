import { RegionList } from '@/components/RegionList';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/components/ui/Layout';
import { Text } from '@/components/ui/Text';
import { useSettings, useUpdateSettings } from '@/contexts/settings';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function RegionScreen() {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const [selectedRegion, setSelectedRegion] = React.useState(settings.data?.region?.id || '');

  return (
    <Layout className="pb-6">
      <Text className="mb-6 text-4xl">Setting Up</Text>
      <Text className="mb-2 text-2xl">Choose a region</Text>
      <Text className="mb-6 text-gray-300">
        Select a region that defines your market area, currency, and tax settings.
      </Text>

      <RegionList selectedRegionId={selectedRegion} onRegionSelect={setSelectedRegion} />

      <View className="mt-6 gap-4">
        <Button variant="outline" onPress={() => router.push('/settings/create-region')}>
          Create New Region
        </Button>

        <Button
          disabled={!selectedRegion}
          isPending={updateSettings.isPending}
          onPress={() => {
            if (!selectedRegion) {
              return;
            }

            updateSettings.mutate(
              {
                region_id: selectedRegion,
              },
              {
                onSuccess: () => {
                  router.back();
                },
              },
            );
          }}
        >
          Submit
        </Button>

        <Button variant="outline" onPress={() => router.back()}>
          Cancel
        </Button>
      </View>
    </Layout>
  );
}
