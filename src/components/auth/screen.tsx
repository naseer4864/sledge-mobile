import { KeyboardAvoidingView, ScrollView, View, Text, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../providers/theme';

/**
 * Shared auth scaffold — dark brand header with a compact, raised form panel.
 * The panel sizes to its content so short forms do not become giant blank cards.
 */
export function AuthScreen({ title, subtitle, children, back }: { title?: string; subtitle?: string; children: React.ReactNode; back?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={['#004C3F', '#003D32', '#071714', colors.bg]} locations={[0, 0.52, 0.78, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340 }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {back !== false ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              android_ripple={{ color: '#FFFFFF30', borderless: false }}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome' as never))}
              style={{
                width: 44,
                height: 44,
                marginTop: 10,
                marginBottom: 8,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'flex-start',
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.13)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.24)',
              }}
            >
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          ) : null}
          {title ? <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6 }}>{title}</Text> : null}
          {subtitle ? <Text style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 }}>{subtitle}</Text> : null}
          <View
            style={{
              marginTop: title || subtitle ? 28 : 60,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#FFFFFF',
              backgroundColor: colors.surface,
              padding: 20,
              shadowColor: '#082E26',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 22,
              elevation: 6,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
