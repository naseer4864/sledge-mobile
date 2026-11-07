import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { PasswordInput } from '../../src/components/auth/password-input';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { api, ApiError } from '../../src/services/api';
import { z } from 'zod';

const schema = z.object({ token: z.string().min(10, 'Enter the reset token'), newPassword: z.string().min(8, 'At least 8 characters').max(128) });

export default function ResetPassword() {
  const [form, setForm] = useState({ token: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message]))); return; }
    if (form.newPassword !== form.confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    setErrors({}); setBusy(true);
    try { await api('/api/v1/auth/password/reset', { method: 'POST', body: { token: form.token, newPassword: form.newPassword }, skipAuth: true }); setDone(true); }
    catch (e) { setErrors({ token: e instanceof ApiError ? e.message : 'Reset failed' }); }
    finally { setBusy(false); }
  };

  return (
    <AuthScreen title="Set a new password" subtitle="Paste the token from your reset email and choose a new password.">
      <View style={{ gap: 16 }}>
        {done ? (
          <>
            <Text style={{ fontSize: 15, color: '#12B76A' }}>Password updated — sign in with your new password.</Text>
            <Button label="Sign in" size="lg" onPress={() => router.replace('/(auth)/login')} />
          </>
        ) : (
          <>
            <Input label="Reset token" placeholder="From reset email" value={form.token} onChangeText={(t) => setForm({ ...form, token: t })} autoCapitalize="none" error={errors.token} />
            <PasswordInput label="New password" placeholder="At least 8 characters" value={form.newPassword} onChangeText={(p) => setForm({ ...form, newPassword: p })} error={errors.newPassword} />
            <PasswordInput label="Confirm password" placeholder="Repeat password" value={form.confirm} onChangeText={(c) => setForm({ ...form, confirm: c })} error={errors.confirm} />
            <Button label="Reset password" size="lg" loading={busy} onPress={submit} />
          </>
        )}
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}>
          <Text style={{ textAlign: 'center', color: '#00B894', fontSize: 14 }}>Back</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
