import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { AuthBackLink } from '../../src/components/auth/back-link';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { forgotPassword } from '../../src/services/auth';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function ForgotPassword() {
  const { show, modal } = useFeedback();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!z.string().email().safeParse(email).success) { setErr('Enter a valid email'); return; }
    setErr(''); setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
      show({ kind: 'success', title: 'Check your email', message: 'If the address is registered, a password reset link is on its way.' });
    }
    catch (e) { show({ kind: 'error', title: 'Could not send reset link', message: e instanceof ApiError ? e.message : 'Request failed. Please try again.' }); }
    finally { setBusy(false); }
  };

  return (
    <AuthScreen title="Reset your password" subtitle="Enter your email — we'll send a reset link if the account exists.">
      <View style={{ gap: 16 }}>
        {sent ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 15, color: '#12B76A', lineHeight: 22 }}>If that email is registered, a reset link is on its way. Check your inbox and spam folder.</Text>
            <Button label="Enter reset code" size="lg" onPress={() => router.push('/(auth)/reset-password' as never)} />
          </View>
        ) : (
          <>
            <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} error={err || undefined} />
            <Button label="Send reset link" size="lg" loading={busy} onPress={submit} />
          </>
        )}
        <AuthBackLink label="Back to sign in" onPress={() => router.replace('/(auth)/login' as never)} />
        {modal}
      </View>
    </AuthScreen>
  );
}
