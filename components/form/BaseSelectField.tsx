import { ChevronDown } from '@/components/icons/chevron-down';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { clx } from '@/utils/clx';
import React, { useEffect } from 'react';
import { FieldError, useController, useFormContext } from 'react-hook-form';
import { TouchableOpacity, View } from 'react-native';
import Animated, { AnimatedStyle, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface SelectOption {
  label: string;
  value: string;
}

export interface BaseSelectProps {
  name: string;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  buttonClassName?: string;
  errorClassName?: string;
  searchable?: boolean;
  floatingPlaceholder?: boolean;
  variant?: 'primary' | 'secondary';
  onEndReached?: () => void;
  isDisabled?: boolean;
}

interface BaseSelectFieldProps extends BaseSelectProps {
  children: (props: {
    selectedOptions: SelectOption[];
    isVisible: boolean;
    setIsVisible: (visible: boolean) => void;
    error: FieldError | undefined;
    value: any;
    onChange: (value: any) => void;
    floatingPlaceholderStyle: AnimatedStyle;
    showFloating: boolean;
    placeholder: string;
    buttonClassName: string;
    floatingPlaceholder: boolean;
    variant: 'primary' | 'secondary';
  }) => React.ReactNode;
  renderOptionsList: (props: {
    filteredOptions: SelectOption[];
    value: any;
    onChange: (value: any) => void;
    setIsVisible: (visible: boolean) => void;
    searchable: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onEndReached?: () => void;
  }) => React.ReactNode;
  getSelectedOptions: (options: SelectOption[], value: any) => SelectOption[];
  shouldShowFloating: (
    isVisible: boolean,
    selectedOptions: SelectOption[],
    floatingPlaceholder: boolean,
    variant: 'primary' | 'secondary',
  ) => boolean;
}

export function BaseSelectField({
  name,
  placeholder = 'Select an option',
  options,
  className = '',
  buttonClassName = '',
  errorClassName = '',
  searchable = false,
  floatingPlaceholder = false,
  variant = 'primary',
  onEndReached,
  isDisabled = false,
  children,
  renderOptionsList,
  getSelectedOptions,
  shouldShowFloating,
}: BaseSelectFieldProps) {
  const { control } = useFormContext();
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const [isVisible, setIsVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedOptions = getSelectedOptions(options, value);
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const showFloating = shouldShowFloating(isVisible, selectedOptions, floatingPlaceholder, variant);
  const floatingPlaceholderTranslateY = useSharedValue(0);
  const floatingPlaceholderScale = useSharedValue(1);

  const floatingPlaceholderStyle = useAnimatedStyle(() => {
    return {
      transformOrigin: 'top left',
      transform: [
        {
          translateY: floatingPlaceholderTranslateY.value,
        },
        {
          scale: floatingPlaceholderScale.value,
        },
      ],
    };
  });

  useEffect(() => {
    if (showFloating) {
      floatingPlaceholderTranslateY.value = withTiming(8, { duration: 150 });
      floatingPlaceholderScale.value = withTiming(0.67, { duration: 150 });
    } else {
      floatingPlaceholderTranslateY.value = withTiming(15, { duration: 150 });
      floatingPlaceholderScale.value = withTiming(1, { duration: 150 });
    }
  }, [floatingPlaceholderScale, floatingPlaceholderTranslateY, showFloating]);

  const handleClose = () => {
    setIsVisible(false);
    setSearchQuery('');
  };

  return (
    <View className={clx('w-full', className)}>
      <View className="relative">
        {floatingPlaceholder && (
          <Animated.Text
            className={clx('absolute left-3 z-10 text-base text-gray-300', {
              'text-error-500': error,
              'text-gray-200': isDisabled && variant === 'primary',
            })}
            style={floatingPlaceholderStyle}
            pointerEvents="none"
          >
            {placeholder}
          </Animated.Text>
        )}

        <TouchableOpacity onPress={() => setIsVisible(true)} disabled={isDisabled}>
          <View
            className={clx(
              'flex-row items-center justify-between rounded-xl border border-gray-200 bg-white py-4 pl-3 pr-11',
              {
                'border-error-500': error,
                [buttonClassName]: buttonClassName,
                'pb-2 pt-6': floatingPlaceholder && variant === 'primary',
                'bg-black': selectedOptions.length > 0 && variant === 'secondary',
                'justify-center rounded-full py-3': variant === 'secondary',
                'border-gray-200': isDisabled && variant === 'primary',
                'bg-gray-100': isDisabled && variant === 'secondary',
              },
            )}
          >
            {children({
              selectedOptions,
              isVisible,
              setIsVisible,
              error,
              value,
              onChange,
              floatingPlaceholderStyle,
              showFloating,
              placeholder,
              buttonClassName,
              floatingPlaceholder,
              variant,
            })}
          </View>
        </TouchableOpacity>

        <ChevronDown
          size={24}
          className={clx('absolute right-4 top-1/2 -translate-y-1/2 text-gray-300', {
            'text-gray-200': isDisabled && variant === 'primary',
          })}
        />
      </View>

      {error && <Text className={clx('mt-1 text-sm text-error-500', errorClassName)}>{error.message}</Text>}

      <BottomSheet visible={isVisible} onClose={handleClose} showCloseButton={false}>
        {renderOptionsList({
          filteredOptions,
          value,
          onChange,
          setIsVisible,
          searchable,
          searchQuery,
          setSearchQuery,
          onEndReached,
        })}
      </BottomSheet>
    </View>
  );
}
