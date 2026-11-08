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
    <View style={{ gap: 7 }}>
      {label ? <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, letterSpacing: 0.2 }}>{label}</Text> : null}
      <View style={{
        flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: 16,
        backgroundColor: focused ? colors.surface : colors.surfaceMuted,
        borderWidth: 1.5,
        borderColor: error ? '#D7473D' : focused ? '#00B887' : colors.border,
        shadowColor: focused ? '#00B887' : '#003D32',
        shadowOffset: { width: 0, height: focused ? 3 : 1 },
        shadowOpacity: focused ? 0.12 : 0.025,
        shadowRadius: focused ? 8 : 3,
        elevation: focused ? 2 : 0,
        opacity: props.editable === false ? 0.55 : 1,
      }}>
        <TextInput
          ref={ref}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: colors.text }}
          {...props}
        />
        {trailing ? <View style={{ paddingRight: 14 }}>{trailing}</View> : null}
      </View>
      {error ? <Text style={{ fontSize: 12, color: '#F04438' }}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';
