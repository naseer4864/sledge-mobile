import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/ui/button';
import { useTheme } from '../../src/providers/theme';

export default function Welcome() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={['#002F2B', '#0B3D2E', colors.bg]} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }} />
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>S</Text>
        </View>
        <Text style={{ marginTop: 32, fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, lineHeight: 44 }}>
          Your money.{'\n'}More ways{'\n'}to move.
        </Text>
        <Text style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 24 }}>
          Crypto trading, fiat banking, savings and gift cards — one connected experience, built for Nigeria first.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: 40, gap: 14 }}>
        <Button label="Get started" size="lg" onPress={() => router.push('/(auth)/register')} />
        <Button label="I already have an account" variant="outline" size="lg" onPress={() => router.push('/(auth)/login')} />
        <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: colors.textMuted }}>
          SLEDGE is in development — access may be limited.
        </Text>
      </View>
    </SafeAreaView>
  );
}
