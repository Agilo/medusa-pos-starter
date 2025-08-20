import { clx } from '@/utils/clx';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type PaymentSelectionProps = {
  value?: string;
  onChange?: (method: string) => void;
  methods?: { id: string; label: string; description: string; icon: React.ReactNode }[];
  className?: string;
};

export const PaymentSelection: React.FC<PaymentSelectionProps> = ({ value, onChange, methods, className }) => {
  const [selected, setSelected] = useState(value || '');

  const handleSelect = (method: string) => {
    setSelected(method);
    onChange?.(method);
  };

  return (
    <View className={clx('gap-y-3', className)}>
      {methods?.map((m) => (
        <PaymentItem
          key={m.id}
          label={m.label}
          description={m.description}
          icon={m.icon}
          isSelected={selected === m.id}
          onPress={() => handleSelect(m.id)}
        />
      ))}
    </View>
  );
};

type PaymentItemProps = {
  label: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
};

export const PaymentItem: React.FC<PaymentItemProps> = ({ label, description, icon, isSelected, onPress }) => (
  <View>
    <TouchableOpacity
      className={clx(
        'flex-row items-center justify-between gap-4 rounded-lg border px-4 py-3',
        isSelected ? 'border-black' : 'border-gray-200',
      )}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={clx(
            'size-4 rounded-full border',
            isSelected ? 'border-[0.3125rem] border-black' : 'border-gray-200',
          )}
        />
        <Text className="text-base text-black">{label}</Text>
      </View>
      {icon}
    </TouchableOpacity>
    {description && <Text className="mt-1 text-xs text-gray-400">{description}</Text>}
  </View>
);
