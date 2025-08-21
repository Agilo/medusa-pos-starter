import { X } from '@/components/icons/x';
import { Text } from '@/components/ui/Text';
import { clx } from '@/utils/clx';
import { useKeyboard } from '@react-native-community/hooks';
import React from 'react';
import {
  Animated,
  GestureResponderEvent,
  Modal,
  ModalProps,
  PanResponder,
  PanResponderGestureState,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetProps extends Pick<ModalProps, 'visible' | 'onRequestClose'> {
  title?: string;
  showCloseButton?: boolean;
  dismissOnOverlayPress?: boolean;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  onClose?: () => void;
  onOverlayPress?: (event: PanResponderGestureState) => void;
  onCloseIconPress?: (event: GestureResponderEvent) => void;
  children: React.ReactNode | ((props: { animateOut: (callback?: () => void) => void }) => React.ReactNode);
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  title,
  children,
  showCloseButton = true,
  dismissOnOverlayPress = true,
  className,
  containerClassName,
  contentClassName,
  headerClassName,
  onClose,
  onOverlayPress,
  onCloseIconPress,
  ...modalProps
}) => {
  const safeAreaInsets = useSafeAreaInsets();
  const windowDimensions = useSafeAreaFrame();
  const keyboard = useKeyboard();

  const translateY = React.useRef(new Animated.Value(300)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const isDragging = React.useRef(false);
  const isAnimatingOut = React.useRef(false);
  const isAnimatingIn = React.useRef(false);

  const animateIn = React.useCallback(() => {
    if (isAnimatingIn.current) return;

    translateY.setValue(300);
    overlayOpacity.setValue(0);
    isAnimatingIn.current = true;

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimatingIn.current = false;
      });
    });
  }, [translateY, overlayOpacity]);

  const animateOut = React.useCallback(
    (callback?: () => void) => {
      if (isAnimatingOut.current) return;

      isAnimatingOut.current = true;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimatingOut.current = false;
        callback?.();
      });
    },
    [translateY, overlayOpacity],
  );

  const animateSpringBack = React.useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(overlayOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [translateY, overlayOpacity]);

  const handleOverlayPress = React.useCallback(
    (event: PanResponderGestureState) => {
      if (dismissOnOverlayPress) {
        if (onOverlayPress) {
          return onOverlayPress(event);
        }

        animateOut(() => onClose?.());
      }
    },
    [dismissOnOverlayPress, onOverlayPress, onClose, animateOut],
  );

  const createPanResponder = React.useCallback(
    (isOverlay = false) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          overlayOpacity.stopAnimation();
          isDragging.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            isDragging.current = true;
            translateY.setValue(gestureState.dy);

            const fadeOpacity = Math.max(0.3, 1 - gestureState.dy / 200);
            overlayOpacity.setValue(fadeOpacity);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!isDragging.current && isOverlay) {
            handleOverlayPress(gestureState);
            return;
          }

          const shouldClose = gestureState.dy > 100;

          if (shouldClose) {
            animateOut(() => onClose?.());
          } else {
            animateSpringBack();
          }
        },
      });
    },
    [translateY, overlayOpacity, handleOverlayPress, animateOut, onClose, animateSpringBack],
  );

  const panResponder = React.useRef(createPanResponder()).current;
  const overlayPanResponder = React.useRef(createPanResponder(true)).current;

  React.useEffect(() => {
    if (modalProps.visible) {
      animateIn();
    }
  }, [modalProps.visible, animateIn]);

  const onRequestClose = React.useCallback<Exclude<ModalProps['onRequestClose'], undefined>>(
    (event) => {
      if (modalProps.onRequestClose) {
        return modalProps.onRequestClose(event);
      }

      onClose?.();
    },
    [modalProps, onClose],
  );

  const handleCloseIconPress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (onCloseIconPress) {
        return onCloseIconPress(event);
      }

      animateOut(() => onClose?.());
    },
    [onClose, onCloseIconPress, animateOut],
  );

  return (
    <Modal
      transparent={true}
      statusBarTranslucent
      animationType="none"
      visible={modalProps.visible}
      onRequestClose={onRequestClose}
    >
      <Animated.View
        className={clx('flex-1 items-center justify-end bg-black/50', className)}
        style={{
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
          opacity: overlayOpacity,
        }}
      >
        <View className="absolute inset-0" {...overlayPanResponder.panHandlers} />

        <View
          className="w-full flex-1"
          style={{
            paddingTop: safeAreaInsets.top,
          }}
          pointerEvents="none"
        >
          <View className="h-4 w-full" />
        </View>

        <Animated.View
          className="w-full shrink grow-0"
          style={{
            maxHeight: windowDimensions.height - safeAreaInsets.bottom - safeAreaInsets.top - 16,
            transform: [{ translateY }],
          }}
        >
          <View
            className={clx('w-full shrink grow-0 overflow-hidden rounded-t-2xl bg-white', containerClassName)}
            style={{
              paddingBottom: keyboard.keyboardShown ? keyboard.keyboardHeight : 0,
            }}
          >
            <View className="w-full shrink-0 grow-0 items-center py-2" {...panResponder.panHandlers}>
              <View className="h-1 w-10 rounded-full bg-gray-200" />
            </View>
            {(title || showCloseButton) && (
              <View className={clx('shrink-0 grow-0 flex-row items-center justify-between gap-2 p-4', headerClassName)}>
                <View className="flex-1">{title && <Text>{title}</Text>}</View>
                {showCloseButton && (
                  <TouchableOpacity onPress={handleCloseIconPress} accessibilityLabel="Close dialog">
                    <X size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!title && !showCloseButton && <View {...panResponder.panHandlers} className="h-8 shrink-0 grow-0" />}

            <View className={clx('shrink grow-0 px-4', contentClassName)}>
              {typeof children === 'function' ? children({ animateOut }) : children}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
