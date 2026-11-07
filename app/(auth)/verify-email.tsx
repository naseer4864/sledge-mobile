import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { api, ApiError } from '../../src/services/api';
import { z } from 'zod';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const verify = async () => {
    if (!z.string().min(10).safeParse(token).success) { setErr('Enter the verification token from your email'); return; }
    setErr(''); setBusy(true);
    try { await api('/api/v1/auth/email/verify', { method: 'POST', body: { token }, skipAuth: true }); setMsg('Email verified — you can sign in.'); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Verification failed'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    if (!z.string().email().safeParse(email).success) { setErr('Enter your email to resend'); return; }
    setErr(''); setBusy(true);
    try { await api('/api/v1/auth/email/resend', { method: 'POST', body: { email }, skipAuth: true }); setMsg('Verification email resent — check your inbox.'); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Resend failed'); }
    finally { setBusy(false); }
  };

  return (
    <AuthScreen title="Verify your email" subtitle="Enter the code we sent, or request a new one.">
      <View style={{ gap: 16 }}>
        <Input label="Verification code" placeholder="Token from email" value={token} onChangeText={setToken} autoCapitalize="none" error={err && !msg ? err : undefined} />
        <Button label="Verify email" size="lg" loading={busy} onPress={verify} />
        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#E4E9F0', paddingTop: 16 }}>
          <Input label="Resend to" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Button label="Resend code" variant="outline" style={{ marginTop: 12 }} loading={busy} onPress={resend} />
        </View>
        {msg ? <Text style={{ color: '#12B76A', fontSize: 13 }}>{msg}</Text> : null}
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={{ textAlign: 'center', color: '#00B894', fontSize: 14 }}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
