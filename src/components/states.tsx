import { View, Text, ActivityIndicator } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './ui/button';
import { useTheme } from '../providers/theme';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <ActivityIndicator size="small" color="#00B887" />
      <Text style={{ marginTop: 10, fontSize: 13, color: colors.textMuted }}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28 }}>
      {icon ? (
        <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: '#C9F5E8', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#003D32', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 }}>
          {icon}
        </View>
      ) : null}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
      {description ? <Text style={{ marginTop: 5, textAlign: 'center', fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 }}>
      <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: '#FFF0EF', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#A8332E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 }}>
        <AlertCircle size={26} color="#F04438" strokeWidth={2.4} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
      {description ? <Text style={{ marginTop: 5, textAlign: 'center', fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>{description}</Text> : null}
      {onRetry ? <Button label="Try again" variant="outline" size="sm" style={{ marginTop: 14, paddingHorizontal: 22 }} onPress={onRetry} /> : null}
    </View>
  );
}
