import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { submitProfile, submitOnboarding } from '../../src/services/onboarding';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';

const schema = z.object({
  legalFirstName: z.string().min(1, 'Required').max(80),
  legalLastName: z.string().min(1, 'Required').max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  countryOfResidence: z.string().length(2, 'ISO country code, e.g. NG'),
});

export default function Onboarding() {
  const [form, setForm] = useState({ legalFirstName: '', legalLastName: '', dateOfBirth: '', countryOfResidence: 'NG' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message]))); return; }
    setErrors({}); setBusy(true);
    try {
      await submitProfile({ ...form, countryOfResidence: form.countryOfResidence.toUpperCase() });
      await submitOnboarding();
      router.replace('/(tabs)');
    }
    catch (e) { setErrors({ legalFirstName: e instanceof ApiError ? e.message : 'Could not save profile' }); }
    finally { setBusy(false); }
  };

  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v });
  return (
    <AuthScreen title="Complete your profile" subtitle="A few details to finish setting up your account.">
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Legal first name" value={form.legalFirstName} onChangeText={set('legalFirstName')} error={errors.legalFirstName} /></View>
          <View style={{ flex: 1 }}><Input label="Legal last name" value={form.legalLastName} onChangeText={set('legalLastName')} error={errors.legalLastName} /></View>
        </View>
        <Input label="Date of birth" placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} error={errors.dateOfBirth} />
        <Input label="Country of residence" placeholder="NG" autoCapitalize="characters" maxLength={2} value={form.countryOfResidence} onChangeText={set('countryOfResidence')} error={errors.countryOfResidence} />
        <Text style={{ fontSize: 12, color: '#667085' }}>Your details are used for identity verification and regulatory requirements.</Text>
        <Button label="Continue" size="lg" loading={busy} onPress={submit} />
      </View>
    </AuthScreen>
  );
}
