import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../src/providers/session';
import { AuthScreen } from '../../src/components/auth/screen';
import { PasswordInput } from '../../src/components/auth/password-input';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';
import { useFeedback } from '../../src/components/ui/feedback-modal';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function Register() {
  const { register } = useSession();
  const { show, modal } = useFeedback();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message]))); return; }
    setErrors({}); setBusy(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      router.replace({ pathname: '/(auth)/verify-email', params: { email: form.email } } as never);
    }
    catch (e) { show({ kind: 'error', title: 'Could not create account', message: e instanceof ApiError ? e.message : 'Registration failed. Try again.' }); }
    finally { setBusy(false); }
  };

  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v });
  return (
    <AuthScreen title="Create your account" subtitle="One account for crypto, banking, savings and gift cards.">
      <View style={{ gap: 18 }}>
        <Input label="First name" value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} autoComplete="given-name" />
        <Input label="Last name" value={form.lastName} onChangeText={set('lastName')} error={errors.lastName} autoComplete="family-name" />
        <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={form.email} onChangeText={set('email')} error={errors.email} />
        <PasswordInput label="Password" placeholder="At least 8 characters" value={form.password} onChangeText={set('password')} error={errors.password} />
        <PasswordInput label="Confirm password" placeholder="Repeat password" value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} />
        <Button label="Create account" size="lg" loading={busy} disabled={busy} onPress={submit} style={{ marginTop: 8 }} />
        <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: 6 }}>
          <Text style={{ textAlign: 'center', color: '#00B887', fontSize: 14, fontWeight: '600' }}>Already have an account? Sign in</Text>
        </Pressable>
        {modal}
      </View>
    </AuthScreen>
  );
}
