import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { AuthBackLink } from '../../src/components/auth/back-link';
import { useSession } from '../../src/providers/session';

// Backend gap: customer login returns { mfaRequired, mfaTicket } but no /auth/mfa/verify
// endpoint exists yet. This screen documents the state honestly rather than faking a verify call.
export default function Mfa() {
  const { state } = useSession();
  return (
    <AuthScreen title="Additional verification required" subtitle="Your account requires multi-factor authentication to continue.">
      <View style={{ gap: 16 }}>
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F7900914', padding: 16 }}>
          <Text style={{ fontSize: 14, lineHeight: 21, color: '#B45309' }}>
            MFA completion is not yet enabled for this app — the backend has no customer verify endpoint yet. Please use the Sledge web app or contact support to complete sign-in.
          </Text>
        </View>
        {state.kind === 'mfa' && (
          <Text style={{ fontSize: 12, color: '#758780' }}>A pending authentication session exists — signing out will clear it.</Text>
        )}
        <AuthBackLink label="Back to sign in" onPress={() => router.replace('/(auth)/login' as never)} />
      </View>
    </AuthScreen>
  );
}
