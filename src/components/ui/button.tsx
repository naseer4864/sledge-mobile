import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

const BG: Record<Variant, string> = { default: '#00B887', secondary: '#C9F5E8', outline: 'transparent', ghost: 'transparent', destructive: '#D7473D' };
const FG: Record<Variant, string> = { default: '#FFFFFF', secondary: '#14231F', outline: '#14231F', ghost: '#14231F', destructive: '#FFFFFF' };
const GRADIENT: Partial<Record<Variant, readonly [string, string]>> = {
  default: ['#00D6A0', '#00B887'],
  destructive: ['#F06458', '#C93632'],
};

export function Button({ label, loading, disabled, variant = 'default', size = 'default', children, style, ...props }: ButtonProps) {
  const s = SIZES[size];
  const gradient = GRADIENT[variant];
  return (
    <Pressable
      disabled={disabled || loading}
      android_ripple={{ color: '#FFFFFF30' }}
      style={[{
        height: s.h, paddingHorizontal: size === 'icon' ? 0 : s.px, width: size === 'icon' ? s.h : undefined,
        borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: BG[variant],
        borderWidth: variant === 'outline' ? 1.5 : 1,
        borderColor: variant === 'outline' ? '#D5E1DC' : (variant === 'default' || variant === 'destructive' ? '#FFFFFF35' : 'transparent'),
        opacity: disabled || loading ? 0.5 : 1,
        shadowColor: variant === 'default' ? '#003D32' : variant === 'destructive' ? '#A8332E' : '#003D32',
        shadowOffset: { width: 0, height: variant === 'default' || variant === 'destructive' ? 5 : 0 },
        shadowOpacity: variant === 'default' || variant === 'destructive' ? 0.2 : 0,
        shadowRadius: 9,
        elevation: variant === 'default' || variant === 'destructive' ? 3 : 0,
      }, style as never]}
      {...props}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {loading ? <ActivityIndicator size="small" color={FG[variant]} />
        : children ?? <Text style={{ fontSize: s.fontSize, fontWeight: '700', color: FG[variant], letterSpacing: 0.1 }}>{label}</Text>}
    </Pressable>
  );
}
