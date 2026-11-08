import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={cn('rounded-2xl border border-border bg-surface p-4 shadow-sm', className)}
    style={[{ borderRadius: 20, borderWidth: 1, borderColor: '#E1EBE7', backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#003D32', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 }, props.style]} />;
}
export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={cn('mb-3 gap-1', className)} style={[{ marginBottom: 12 }, props.style]} />;
}
export function CardTitle({ children, className, ...props }: TextProps & { children: React.ReactNode; className?: string }) {
  return <Text {...props} className={cn('text-base font-bold text-text', className)} style={[{ color: '#14231F', fontSize: 16, fontWeight: '700' }, props.style]}>{children}</Text>;
}
export function CardDescription({ children, className, ...props }: TextProps & { children: React.ReactNode; className?: string }) {
  return <Text {...props} className={cn('text-sm text-text-muted', className)} style={[{ color: '#758780', fontSize: 13 }, props.style]}>{children}</Text>;
}
export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={cn('gap-2', className)} />;
}
export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={cn('mt-3 flex-row items-center', className)} style={[{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }, props.style]} />;
}
