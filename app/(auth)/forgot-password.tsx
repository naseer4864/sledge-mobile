import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { forgotPassword } from '../../src/services/auth';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!z.string().email().safeParse(email).success) { setErr('Enter a valid email'); return; }
    setErr(''); setBusy(true);
    try { await forgotPassword(email); setSent(true); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Request failed'); }
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
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}>
          <Text style={{ textAlign: 'center', color: '#00B894', fontSize: 14 }}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
