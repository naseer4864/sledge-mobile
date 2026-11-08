import { Pressable, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export function AuthBackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      android_ripple={{ color: '#00B88718' }}
      style={{
        minHeight: 46,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#DCE9E4',
        backgroundColor: '#F5FAF8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <ArrowLeft size={16} color="#008F6B" strokeWidth={2.4} style={{ marginRight: 8 }} />
      <Text style={{ color: '#006B50', fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
