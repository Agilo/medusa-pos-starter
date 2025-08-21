import { Check } from '@/components/icons/check';
import { ChevronDown } from '@/components/icons/chevron-down';
import { X } from '@/components/icons/x';
import { Text } from '@/components/ui/Text';
import { clx } from '@/utils/clx';
import React, { useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './ui/BottomSheet';

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  options: MultiSelectOption[];
  className?: string;
  buttonClassName?: string;
  errorClassName?: string;
  searchable?: boolean;
  variant?: 'primary' | 'secondary';
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  value = [],
  onChange,
  placeholder = 'Select options',
  options,
  className = '',
  buttonClassName = '',
  errorClassName = '',
  searchable = false,
  variant = 'primary',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOptions = options.filter((option) => value.includes(option.value));

  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v: string) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: string) => {
    const newValue = value.filter((v: string) => v !== optionValue);
    onChange(newValue);
  };

  const defaultRenderOption = (option: MultiSelectOption, isSelected: boolean) => (
    <TouchableOpacity
      key={option.value}
      className={clx('flex-row items-center justify-between bg-white p-4')}
      onPress={() => toggleOption(option.value)}
    >
      <Text
        className={clx({
          'text-active-500': isSelected,
        })}
      >
        {option.label}
      </Text>
      {isSelected && <Check size={16} color="#4E78E5" />}
    </TouchableOpacity>
  );

  return (
    <View className={clx('w-full', className)}>
      <View className="relative">
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          className={clx(
            'h-13.5 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-5 text-lg leading-6',
            {
              [buttonClassName]: buttonClassName,
              'bg-black': selectedOptions.length > 0 && variant === 'secondary',
              'justify-center rounded-full py-3': variant === 'secondary',
            },
          )}
        >
          <View>
            {selectedOptions.length > 0 && variant === 'primary' ? (
              <View className="flex flex-row flex-wrap gap-1">
                {selectedOptions.map((option) => (
                  <View key={option.value} className="mb-1 mr-1 flex-row items-center rounded-lg bg-gray-100 px-2 py-1">
                    <Text className="text-sm text-gray-700">{option.label}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        removeOption(option.value);
                      }}
                      className="ml-1"
                    >
                      <X size={12} className="text-gray-600" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : selectedOptions.length > 0 && variant === 'secondary' ? (
              <View className="flex-row items-center gap-3">
                <Text className="text-lg leading-5 text-white">{placeholder}</Text>
                <View className="aspect-square min-w-[1.0188rem] items-center justify-center rounded-full bg-white px-1">
                  <Text className="top-1/2 -translate-y-1/2 transform text-xs font-bold">{selectedOptions.length}</Text>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Text
                  className={clx('text-lg', {
                    'text-gray-300': !selectedOptions.length && variant === 'primary',
                  })}
                >
                  {placeholder}
                </Text>
                {variant === 'secondary' && <ChevronDown size={24} className="mt-1" />}
              </View>
            )}
          </View>
        </TouchableOpacity>
        {variant === 'primary' && (
          <ChevronDown size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
        )}
      </View>

      <BottomSheet visible={isVisible} onClose={() => setIsVisible(false)} showCloseButton={false}>
        {searchable && (
          <View className="border-b border-gray-200 p-4">
            <TextInput
              className="rounded-lg border border-gray-200 px-4 py-3"
              placeholder="Search options..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => item.value}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = value.includes(item.value);
            return defaultRenderOption(item, isSelected);
          }}
          contentContainerClassName="pb-safe-offset-4"
          ItemSeparatorComponent={() => <View className="h-hairline bg-gray-200" />}
          ListEmptyComponent={
            <View className="items-center p-8">
              <Text className="text-gray-500">
                {searchable && searchQuery ? 'No options found' : 'No options available'}
              </Text>
            </View>
          }
          keyboardDismissMode="on-drag"
        />
      </BottomSheet>
    </View>
  );
};
