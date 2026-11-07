import { KeyboardAvoidingView, ScrollView, View, Text, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../providers/theme';

export function AuthScreen({ title, subtitle, children, back }: { title?: string; subtitle?: string; children: React.ReactNode; back?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={['#002F2B', '#0B3D2E', colors.bg]} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
          {back !== false ? (
            <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome' as never))} style={{ marginTop: 12, marginLeft: -8, padding: 8, alignSelf: 'flex-start' }}>
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
          ) : null}
          {title ? <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6 }}>{title}</Text> : null}
          {subtitle ? <Text style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 }}>{subtitle}</Text> : null}
          <View style={{ marginTop: title || subtitle ? 24 : 60, flex: 1 }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
