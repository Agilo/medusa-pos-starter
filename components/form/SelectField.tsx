import { Check } from '@/components/icons/check';
import { Text } from '@/components/ui/Text';
import { clx } from '@/utils/clx';
import React from 'react';
import { FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import { BaseSelectField, BaseSelectProps, SelectOption } from './BaseSelectField';

interface SelectFieldProps extends BaseSelectProps {
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
}

export function SelectField({
  name,
  placeholder = 'Select an option',
  options,
  className = '',
  buttonClassName = '',
  errorClassName = '',
  searchable = false,
  renderOption,
  floatingPlaceholder = false,
  variant = 'primary',
  onEndReached,
  isDisabled = false,
}: SelectFieldProps) {
  const handleSelect =
    (onChange: (value: any) => void, setIsVisible: (visible: boolean) => void) => (selectedValue: string) => {
      onChange(selectedValue);
      setIsVisible(false);
    };

  const defaultRenderOption = (option: SelectOption, isSelected: boolean, onSelect: (value: string) => void) => (
    <TouchableOpacity
      key={option.value}
      className={clx('flex-row items-center justify-between bg-white p-4')}
      onPress={() => onSelect(option.value)}
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

  const getSelectedOptions = (options: SelectOption[], value: any) => {
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption ? [selectedOption] : [];
  };

  const shouldShowFloating = (
    isVisible: boolean,
    selectedOptions: SelectOption[],
    floatingPlaceholder: boolean,
    variant: 'primary' | 'secondary',
  ) => {
    return floatingPlaceholder && (isVisible || selectedOptions.length > 0) && variant === 'primary';
  };

  const renderOptionsList = ({
    filteredOptions,
    value,
    onChange,
    setIsVisible,
    searchable,
    searchQuery,
    setSearchQuery,
    onEndReached,
  }: {
    filteredOptions: SelectOption[];
    value: any;
    onChange: (value: any) => void;
    setIsVisible: (visible: boolean) => void;
    searchable: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onEndReached?: () => void;
  }) => {
    const onSelect = handleSelect(onChange, setIsVisible);

    const renderItem = ({ item }: { item: SelectOption }) => {
      const isSelected = item.value === value;
      const renderedOption = renderOption
        ? renderOption(item, isSelected)
        : defaultRenderOption(item, isSelected, onSelect);
      return renderedOption as React.ReactElement;
    };

    return (
      <>
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
          renderItem={renderItem}
          keyboardShouldPersistTaps="always"
          ItemSeparatorComponent={() => <View className="h-hairline bg-gray-200" />}
          contentContainerClassName="pb-safe-offset-4"
          ListEmptyComponent={
            <View className="items-center p-8">
              <Text className="text-gray-500">
                {searchable && searchQuery ? 'No options found' : 'No options available'}
              </Text>
            </View>
          }
          onEndReached={onEndReached}
          keyboardDismissMode="on-drag"
        />
      </>
    );
  };

  return (
    <BaseSelectField
      name={name}
      placeholder={placeholder}
      options={options}
      className={className}
      buttonClassName={buttonClassName}
      errorClassName={errorClassName}
      searchable={searchable}
      floatingPlaceholder={floatingPlaceholder}
      variant={variant}
      onEndReached={onEndReached}
      isDisabled={isDisabled}
      getSelectedOptions={getSelectedOptions}
      shouldShowFloating={shouldShowFloating}
      renderOptionsList={renderOptionsList}
    >
      {({ selectedOptions, placeholder: pl, floatingPlaceholder: fp }) => {
        const selectedOption = selectedOptions[0];

        return (
          <Text
            className={clx({
              'text-gray-300': !selectedOption,
              'text-gray-200': isDisabled,
            })}
          >
            {selectedOption ? selectedOption.label : !fp ? pl : null}
          </Text>
        );
      }}
    </BaseSelectField>
  );
}

export default SelectField;
