import { useState } from 'react';
import { Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input, type InputProps } from '../ui/input';
import { useTheme } from '../../providers/theme';

export function PasswordInput(props: InputProps) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable onPress={() => setVisible(!visible)} accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={8}>
          {visible ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
        </Pressable>
      }
    />
  );
}
