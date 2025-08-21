import { Tabs } from 'expo-router';

import { useCurrentDraftOrder } from '@/api/hooks/draft-orders';
import { HapticTab } from '@/components/HapticTab';
import { ClipboardList } from '@/components/icons/clipboard-list';
import { ScanBarcode } from '@/components/icons/scan-barcode';
import { Settings } from '@/components/icons/settings';
import { ShoppingCart } from '@/components/icons/shopping-cart';
import { Store } from '@/components/icons/store';

export const unstable_settings = {
  initialRouteName: 'products',
};

export default function TabLayout() {
  const draftOrder = useCurrentDraftOrder();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#282828',
        tabBarInactiveTintColor: '#B5B5B5',
        headerShown: false,
        tabBarButton: HapticTab,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Store size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ClipboardList size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <ScanBarcode size={20} color={color} />,
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge:
            draftOrder.data && draftOrder.data.draft_order.items.length > 0
              ? draftOrder.data.draft_order.items.length
              : undefined,
          tabBarBadgeStyle: {
            maxWidth: 17.6,
            maxHeight: 17.6,
            fontSize: 9,
            aspectRatio: 1,
            backgroundColor: '#282828',
            fontWeight: '700',
          },
          tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
