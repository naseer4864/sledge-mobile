import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps extends PressableProps {
  label?: string; loading?: boolean; variant?: Variant; size?: Size;
  children?: React.ReactNode; className?: string;
}

const SIZES: Record<Size, { h: number; px: number; fontSize: number }> = {
  sm: { h: 38, px: 14, fontSize: 13 }, default: { h: 46, px: 18, fontSize: 15 },
  lg: { h: 54, px: 22, fontSize: 16 }, icon: { h: 42, px: 0, fontSize: 15 },
};

const BG: Record<Variant, string> = { default: '#00B894', secondary: '#E4E9F0', outline: 'transparent', ghost: 'transparent', destructive: '#F04438' };
const FG: Record<Variant, string> = { default: '#fff', secondary: '#172033', outline: '#172033', ghost: '#172033', destructive: '#fff' };

export function Button({ label, loading, disabled, variant = 'default', size = 'default', children, style, ...props }: ButtonProps) {
  const s = SIZES[size];
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [{
        height: s.h, paddingHorizontal: size === 'icon' ? 0 : s.px, width: size === 'icon' ? s.h : undefined,
        borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: BG[variant],
        borderWidth: variant === 'outline' ? 1.5 : 0, borderColor: '#E4E9F0',
        opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1,
      }, style as never]}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={FG[variant]} />
        : children ?? <Text style={{ fontSize: s.fontSize, fontWeight: '700', color: FG[variant] }}>{label}</Text>}
    </Pressable>
  );
}
