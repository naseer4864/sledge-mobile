import { View, Text, type ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('rounded-lg border border-border bg-surface p-4 shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('mb-3 gap-1', className)} {...props} />;
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-base font-semibold text-text', className)}>{children}</Text>;
}
export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-sm text-text-muted', className)}>{children}</Text>;
}
export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('gap-2', className)} {...props} />;
}
export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('mt-3 flex-row items-center', className)} {...props} />;
}
