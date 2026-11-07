import { forwardRef, useState } from 'react';
import { TextInput, Text, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../providers/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(({ label, error, trailing, ...props }, ref) => {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{label}</Text> : null}
      <View style={{
        flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 14,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1.5,
        borderColor: error ? '#F04438' : focused ? '#00B894' : colors.border,
        opacity: props.editable === false ? 0.5 : 1,
      }}>
        <TextInput
          ref={ref}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingHorizontal: 16, fontSize: 15, color: colors.text }}
          {...props}
        />
        {trailing ? <View style={{ paddingRight: 14 }}>{trailing}</View> : null}
      </View>
      {error ? <Text style={{ fontSize: 12, color: '#F04438' }}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';
