import { TopFade } from '../../src/components/top-fade';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogOut, ShieldCheck, ChevronRight, Bell, LifeBuoy, MessagesSquare, Smartphone } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useSession } from '../../src/providers/session';


export default function Account() {
  const { colors } = useTheme();
  const { state, logout } = useSession();
  const user = state.kind === 'authenticated' ? state.user : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Account</Text>

        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{(user.firstName ?? user.email)[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sledge customer'}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{user.email}</Text>
            </View>
          </View>
        )}

        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Security</Text>
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} accessibilityLabel="Change password" onPress={() => router.push('/(auth)/forgot-password' as never)}>
              <ShieldCheck size={18} color={colors.textMuted} />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>Reset password</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Help</Text>
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            {([
              ['Identity verification', '/kyc', ShieldCheck], ['Notifications', '/notifications', Bell], ['Push settings', '/push-settings', Smartphone], ['Support tickets', '/support', LifeBuoy], ['Live chat', '/chat', MessagesSquare],
            ] as const).map(([label, href, Icon]) => (
              <Pressable key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} accessibilityLabel={label} onPress={() => router.push(href as never)}>
                <Icon size={18} color={colors.textMuted} />
                <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{label}</Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable accessibilityLabel="Sign out" onPress={logout}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F04438', backgroundColor: '#F0443812' }}>
          <LogOut size={16} color="#F04438" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#F04438' }}>Sign out</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted }}>Sledge · development build</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
