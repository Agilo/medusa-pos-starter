import { X } from '@/components/icons/x';
import { Text } from '@/components/ui/Text';
import { toastConfig } from '@/config/toast';
import { clx } from '@/utils/clx';
import { useKeyboard } from '@react-native-community/hooks';
import React from 'react';
import { GestureResponderEvent, Modal, ModalProps, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withDecay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { scheduleOnRN } from 'react-native-worklets';

export interface BottomSheetProps extends Pick<ModalProps, 'visible' | 'onRequestClose'> {
  title?: string;
  showCloseButton?: boolean;
  dismissOnOverlayPress?: boolean;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  onClose?: () => void;
  onOverlayPress?: () => void;
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

  const translateY = useSharedValue(300);
  const overlayOpacity = useSharedValue(0);

  const handleClose = React.useCallback(() => {
    onClose?.();
  }, [onClose]);

  const animateIn = React.useCallback(() => {
    translateY.value = withTiming(0, { duration: 300 });
    overlayOpacity.value = withTiming(1, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateOut = React.useCallback(
    (callback?: () => void) => {
      translateY.value = withTiming(300, { duration: 250 });
      overlayOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished && callback) {
          scheduleOnRN(callback);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        const fadeOpacity = Math.max(0.3, 1 - event.translationY / 200);
        overlayOpacity.value = fadeOpacity;
      }
    })
    .onFinalize((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;

      if (shouldClose) {
        if (Math.abs(event.velocityY) > 500) {
          translateY.value = withDecay({
            velocity: event.velocityY,
            clamp: [0, 300],
          });
          overlayOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) {
              scheduleOnRN(handleClose);
            }
          });
        } else {
          translateY.value = withTiming(300, { duration: 250 });
          overlayOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) {
              scheduleOnRN(handleClose);
            }
          });
        }
      } else {
        translateY.value = withSpring(0, { stiffness: 100, damping: 8 });
        overlayOpacity.value = withSpring(1, { stiffness: 100, damping: 8 });
      }
    });

  const overlayTapGesture = Gesture.Tap().onEnd(() => {
    if (dismissOnOverlayPress) {
      if (onOverlayPress) {
        return onOverlayPress();
      }
      translateY.value = withTiming(300, { duration: 250 });
      overlayOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          scheduleOnRN(handleClose);
        }
      });
    }
  });

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Trigger animation when modal becomes visible
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          className={clx('flex-1 items-center justify-end bg-black/50', className)}
          style={[
            {
              paddingLeft: safeAreaInsets.left,
              paddingRight: safeAreaInsets.right,
            },
            overlayStyle,
          ]}
        >
          <GestureDetector gesture={overlayTapGesture}>
            <View className="absolute inset-0" />
          </GestureDetector>

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
            style={[
              {
                maxHeight: windowDimensions.height - safeAreaInsets.bottom - safeAreaInsets.top - 16,
              },
              sheetStyle,
            ]}
          >
            <View
              className={clx('w-full shrink grow-0 overflow-hidden rounded-t-2xl bg-white', containerClassName)}
              style={{
                paddingBottom: keyboard.keyboardShown ? keyboard.keyboardHeight : 0,
              }}
            >
              <GestureDetector gesture={panGesture}>
                <View className="w-full shrink-0 grow-0 items-center py-2">
                  <View className="h-1 w-10 rounded-full bg-gray-200" />
                </View>
              </GestureDetector>

              {(title || showCloseButton) && (
                <View
                  className={clx('shrink-0 grow-0 flex-row items-center justify-between gap-2 p-4', headerClassName)}
                >
                  <View className="flex-1">{title && <Text>{title}</Text>}</View>
                  {showCloseButton && (
                    <TouchableOpacity onPress={handleCloseIconPress} accessibilityLabel="Close dialog">
                      <X size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {!title && !showCloseButton && (
                <GestureDetector gesture={panGesture}>
                  <View className="h-8 shrink-0 grow-0" />
                </GestureDetector>
              )}

              <View className={clx('shrink grow-0 px-4', contentClassName)}>
                {typeof children === 'function' ? children({ animateOut }) : children}
              </View>
            </View>
            <Toast config={toastConfig} />
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};
