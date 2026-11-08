import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  LogOut, ShieldCheck, ChevronRight, Bell, LifeBuoy, MessagesSquare,
  Smartphone, BadgeCheck, KeyRound,
} from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useSession } from '../../src/providers/session';
import { useKyc } from '../../src/services/kyc';
import { ConfirmSheet } from '../../src/components/ui/confirm-sheet';
import { useFeedback } from '../../src/components/ui/feedback-modal';
import { Button } from '../../src/components/ui/button';
import { elevation } from '../../src/theme/elevation';

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function Row({ icon: Icon, label, detail, onPress, tint }: {
  icon: IconCmp; label: string; detail?: string; onPress: () => void; tint: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityLabel={label} onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${tint}14`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Icon size={17} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{label}</Text>
        {detail ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{detail}</Text> : null}
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>{title}</Text>
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, overflow: 'hidden', ...elevation.surface }}>{children}</View>
    </View>
  );
}

export default function Account() {
  const { colors } = useTheme();
  const { state, logout } = useSession();
  const user = state.kind === 'authenticated' ? state.user : null;
  const kyc = useKyc();
  const verified = kyc.data?.status === 'approved';
  const [signOutSheet, setSignOutSheet] = useState(false);
  const { show, modal } = useFeedback();

  const confirmSignOut = async () => {
    setSignOutSheet(false);
    try { await logout(); }
    catch { show({ kind: 'error', title: 'Sign out failed', message: 'Something went wrong — please try again.' }); }
  };

  const divider = <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 60 }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Account</Text>

        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 16, ...elevation.surface }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{(user.firstName ?? user.email)[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sledge customer'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 1 }}>{user.email}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: verified ? '#12B76A14' : '#F7900914' }}>
              <BadgeCheck size={13} color={verified ? '#12B76A' : '#F79009'} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: verified ? '#12B76A' : '#F79009' }}>{verified ? 'Verified' : 'Unverified'}</Text>
            </View>
          </View>
        )}

        <Section title="Security">
          <Row icon={KeyRound} tint="#758780" label="Reset password" detail="Change your sign-in password"
            onPress={() => router.push('/(auth)/forgot-password' as never)} />
          {divider}
          <Row icon={ShieldCheck} tint="#00B887" label="Identity verification" detail={verified ? 'Verified' : 'Complete your KYC'}
            onPress={() => router.push('/kyc' as never)} />
        </Section>

        <Section title="Preferences">
          <Row icon={Bell} tint="#F79009" label="Notifications" detail="In-app alerts and updates"
            onPress={() => router.push('/notifications' as never)} />
          {divider}
          <Row icon={Smartphone} tint="#758780" label="Push settings" detail="Device push notifications"
            onPress={() => router.push('/push-settings' as never)} />
        </Section>

        <Section title="Support">
          <Row icon={LifeBuoy} tint="#00B887" label="Support tickets" detail="Track your requests"
            onPress={() => router.push('/support' as never)} />
          {divider}
          <Row icon={MessagesSquare} tint="#758780" label="Live chat" detail="Talk to our team"
            onPress={() => router.push('/chat' as never)} />
        </Section>

        <Button accessibilityLabel="Sign out" variant="destructive" size="lg" onPress={() => setSignOutSheet(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogOut size={16} color="#fff" />
            <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#fff' }}>Sign out</Text>
          </View>
        </Button>
        <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted }}>Sledge · development build</Text>
      </ScrollView>
      <ConfirmSheet
        visible={signOutSheet}
        title="Sign out?"
        message="You will need to sign in again to access your account."
        confirmLabel="Sign out"
        destructive
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutSheet(false)}
      />
      {modal}
    </SafeAreaView>
  );
}
