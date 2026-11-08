import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/ui/button';

export default function Welcome() {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#004C3F', '#003D32', '#071714']}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center' }}>
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
          <Button variant="outline" size="lg" onPress={() => router.push('/(auth)/login')}
            style={{ borderColor: 'rgba(255,255,255,0.35)' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>I already have an account</Text>
          </Button>
          <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            SLEDGE is in development — access may be limited.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
