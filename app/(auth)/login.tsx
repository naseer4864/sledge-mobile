import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../src/providers/session';
import { AuthScreen } from '../../src/components/auth/screen';
import { PasswordInput } from '../../src/components/auth/password-input';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError, API_BASE } from '../../src/services/api';
import { z } from 'zod';
import { useFeedback } from '../../src/components/ui/feedback-modal';

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });

export default function Login() {
  const { login } = useSession();
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const { show, modal } = useFeedback();
  const [form, setForm] = useState({ email: initialEmail ?? '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message]))); return; }
    setErrors({}); setBusy(true);
    try {
      await login(form.email, form.password);
      router.replace('/');
    }
    catch (e) {
      const errorCode = e instanceof ApiError
        ? (e.body as { error?: string } | undefined)?.error
        : undefined;
      if (errorCode === 'EmailNotVerified') {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: form.email } } as never);
      } else {
        show({ kind: 'error', title: 'Could not sign in', message: e instanceof ApiError ? e.message : `Sign-in failed (${API_BASE}): ${e instanceof Error ? e.message : String(e)}` });
      }
    }
    finally { setBusy(false); }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to your Sledge Wallet account.">
      <View style={{ gap: 20 }}>
        <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email"
          value={form.email} onChangeText={(email) => setForm({ ...form, email })} error={errors.email} />
        <View style={{ gap: 8 }}>
          <PasswordInput label="Password" placeholder="Your password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} error={errors.password} />
          <Pressable onPress={() => router.push('/(auth)/forgot-password')} accessibilityLabel="Forgot password" style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: '#00B887', fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
          </Pressable>
        </View>
        <Button label="Sign in" size="lg" loading={busy} disabled={busy} onPress={submit} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: 14, color: '#758780' }}>New to Sledge? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')} accessibilityLabel="Create account">
            <Text style={{ color: '#00B887', fontSize: 14, fontWeight: '600' }}>Create account</Text>
          </Pressable>
        </View>
        {modal}
      </View>
    </AuthScreen>
  );
}
