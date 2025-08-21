import { Button } from '@/components/ui/Button';
import { Dialog, DialogProps } from '@/components/ui/Dialog';
import { View } from 'react-native';

type PromptProps = { onSubmit: () => void; submitText?: string; cancelText?: string } & DialogProps;

export const Prompt: React.FC<PromptProps> = ({
  onSubmit,
  onClose,
  submitText = 'Yes',
  cancelText = 'No',
  ...props
}) => {
  return (
    <Dialog {...props} onClose={onClose} containerClassName="max-w-md">
      <View className="flex-row gap-2">
        <Button onPress={onSubmit} className="flex-1">
          {submitText}
        </Button>
        <Button variant="outline" onPress={onClose} className="flex-1">
          {cancelText}
        </Button>
      </View>
    </Dialog>
  );
};
