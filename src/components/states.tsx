import { View, Text, ActivityIndicator } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './ui/button';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <ActivityIndicator size="small" color="#00B894" />
      <Text style={{ marginTop: 10, fontSize: 13, color: '#667085' }}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 }}>
      {icon ? (
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#00B89412', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          {icon}
        </View>
      ) : null}
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#172033' }}>{title}</Text>
      {description ? <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12.5, color: '#667085', lineHeight: 18 }}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0443812', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <AlertCircle size={26} color="#F04438" strokeWidth={2.4} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#172033' }}>{title}</Text>
      {description ? <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12.5, color: '#667085', lineHeight: 18 }}>{description}</Text> : null}
      {onRetry ? <Button label="Try again" variant="outline" size="sm" style={{ marginTop: 14, paddingHorizontal: 22 }} onPress={onRetry} /> : null}
    </View>
  );
}
