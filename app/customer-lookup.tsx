import { useCreateCustomer, useCustomers } from '@/api/hooks/customers';
import { useUpdateDraftOrderCustomer } from '@/api/hooks/draft-orders';
import { Form } from '@/components/form/Form';
import { FormButton } from '@/components/form/FormButton';
import { TextField } from '@/components/form/TextField';
import { CircleAlert } from '@/components/icons/circle-alert';
import { InfoBanner } from '@/components/InfoBanner';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Text } from '@/components/ui/Text';
import { clx } from '@/utils/clx';
import { AdminCustomer } from '@medusajs/types';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { z } from 'zod/v4';

const customerFormSchema = z.object({
  email: z.email('Please enter a valid email address').min(3, 'Email is required'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

const AddNewCustomerButton: React.FC<{ onNewCustomer: (customer: AdminCustomer) => void }> = ({ onNewCustomer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const createCustomer = useCreateCustomer();

  return (
    <>
      <Button
        variant="outline"
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Add New Customer
      </Button>

      <Dialog
        visible={isOpen}
        title="Add New Customer"
        onClose={() => setIsOpen(false)}
        dismissOnOverlayPress={true}
        contentClassName="flex-shrink"
      >
        <Form
          schema={customerFormSchema}
          onSubmit={(data, form) => {
            createCustomer.mutate(data, {
              onSuccess: (res) => {
                onNewCustomer(res.customer);
                setIsOpen(false);
                form.reset();
              },
            });
          }}
        >
          <TextField
            name="email"
            placeholder="Email Address"
            autoComplete="off"
            autoCapitalize="none"
            inputMode="email"
          />
          <TextField name="first_name" placeholder="First Name" autoComplete="off" autoCapitalize="words" />
          <TextField name="last_name" placeholder="Last Name" autoComplete="off" autoCapitalize="words" />
          <TextField name="phone" placeholder="Phone Number" autoComplete="off" autoCapitalize="none" inputMode="tel" />
          <FormButton>Create Customer</FormButton>
        </Form>
      </Dialog>
    </>
  );
};

const isPlaceholderProduct = (
  product: AdminCustomer | { id: `placeholder_${string}` },
): product is { id: `placeholder_${string}` } => {
  return typeof product.id === 'string' && product.id.startsWith('placeholder_');
};

const CustomerListPlaceholder: React.FC = () => {
  return (
    <View className="flex-row items-center justify-between gap-4 px-4 py-3">
      <View className="h-[17px] w-1/3 rounded-md bg-gray-200" />
      <View className="h-[17px] w-1/3 rounded-md bg-gray-200" />
    </View>
  );
};

const CustomersList: React.FC<{
  q?: string;
  selectedCustomerId?: string;
  onCustomerSelect: (customer: AdminCustomer) => void;
}> = ({ q, selectedCustomerId, onCustomerSelect }) => {
  const customersQuery = useCustomers({
    q,
    order: 'email',
  });

  const renderCustomer = React.useCallback(
    ({ item }: { item: AdminCustomer | { id: `placeholder_${string}` } }) => {
      if (isPlaceholderProduct(item)) {
        return <CustomerListPlaceholder />;
      }

      const customerName = [item.first_name, item.last_name].filter(Boolean).join(' ');

      return (
        <TouchableOpacity
          className={clx('flex-row items-center justify-between gap-4 px-4 py-3', {
            'bg-black': selectedCustomerId === item.id,
          })}
          onPress={() => onCustomerSelect(item)}
        >
          {customerName.length > 0 && (
            <Text
              className={clx({
                'text-white': selectedCustomerId === item.id,
              })}
            >
              {customerName}
            </Text>
          )}
          <Text
            className={clx(
              customerName.length > 0
                ? {
                    'text-gray-300': true,
                    'text-gray-400': selectedCustomerId === item.id,
                  }
                : {
                    'text-white': selectedCustomerId === item.id,
                  },
            )}
          >
            {item.email}
          </Text>
        </TouchableOpacity>
      );
    },
    [onCustomerSelect, selectedCustomerId],
  );

  const data = React.useMemo(() => {
    if (customersQuery.isLoading) {
      return Array.from({ length: 8 }, (_, index) => ({
        id: `placeholder_${index + 1}` as const,
      }));
    }

    const customers = customersQuery.data?.pages.flatMap((page) => page.customers) || [];

    return customers.length > 0 ? customers : null;
  }, [customersQuery]);

  if (customersQuery.isError) {
    return <InfoBanner colorScheme="error">Error loading customers. Please try again.</InfoBanner>;
  }

  return (
    <FlatList
      data={data}
      renderItem={renderCustomer}
      keyExtractor={(item) => item.id}
      refreshing={customersQuery.isRefetching}
      ItemSeparatorComponent={() => <View className="mx-4 h-hairline bg-gray-200" />}
      className="overflow-hidden rounded-xl border border-gray-200"
      ListEmptyComponent={
        <View className="items-center justify-center gap-2 px-4 py-10">
          <CircleAlert size={24} />
          {typeof q === 'string' && q.length > 1 ? (
            <Text className="text-center">No customers match{'\n'}the search</Text>
          ) : (
            <Text className="text-center">No customers found</Text>
          )}
        </View>
      }
      ListFooterComponent={
        customersQuery.isFetchingNextPage ? (
          <View>
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
            <View className="mx-4 h-hairline bg-gray-200" />
            <CustomerListPlaceholder />
          </View>
        ) : null
      }
      onRefresh={() => {
        customersQuery.refetch();
      }}
      onEndReached={() => {
        if (customersQuery.hasNextPage && !customersQuery.isFetchingNextPage) {
          customersQuery.fetchNextPage();
        }
      }}
      keyboardDismissMode="on-drag"
    />
  );
};

export default function CustomerLookupScreen() {
  const params = useLocalSearchParams<{
    customerId?: string;
  }>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(params.customerId);
  const [selectedCustomer, setSelectedCustomer] = React.useState<AdminCustomer>();
  const updateDraftOrderCustomer = useUpdateDraftOrderCustomer();

  return (
    <Dialog
      visible={true}
      title="Customer Lookup"
      onClose={() => router.back()}
      dismissOnOverlayPress={true}
      contentClassName="flex-shrink"
    >
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search customers..."
        className="mb-4"
      />

      <CustomersList
        q={searchQuery ? searchQuery : undefined}
        selectedCustomerId={selectedCustomerId}
        onCustomerSelect={(customer) => {
          setSelectedCustomerId(customer.id);
          setSelectedCustomer(customer);
        }}
      />

      <Button
        className="mb-4 mt-4"
        disabled={!selectedCustomerId}
        onPress={() => {
          if (!selectedCustomerId) {
            return;
          }

          if (selectedCustomer) {
            updateDraftOrderCustomer.mutate(selectedCustomer);
          }

          router.back();
        }}
      >
        Select Customer
      </Button>
      <AddNewCustomerButton
        onNewCustomer={(customer) => {
          setSelectedCustomerId(customer.id);
          setSelectedCustomer(customer);
        }}
      />
    </Dialog>
  );
}
