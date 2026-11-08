import { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { createWallet } from '../../src/services/wallets';
import * as Crypto from 'expo-crypto';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { TopFade } from '../../src/components/top-fade';
import { z } from 'zod';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function CreateWallet() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { show, modal } = useFeedback();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!z.string().min(1).max(80).safeParse(name.trim()).success) { setErr('Enter a wallet name'); return; }
    setErr(''); setBusy(true);
    try {
      await createWallet(name.trim(), Crypto.randomUUID()); // clientRequestId — idempotent on retry
      await qc.invalidateQueries({ queryKey: ['wallets'] });
      show({ kind: 'success', title: 'Wallet created', message: 'Your new wallet is ready to use.', onDismiss: () => router.back() });
    } catch (e) { show({ kind: 'error', title: 'Could not create wallet', message: e instanceof ApiError ? e.message : 'Please try again.' }); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Create a wallet" subtitle="A secure place for your assets" />
      <View style={{ marginHorizontal: 20, marginTop: 8, padding: 20, gap: 16, borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, ...elevation.surface }}>
        <View style={{ width: 50, height: 50, borderRadius: 18, backgroundColor: '#C9F5E8', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#003D32' }}>₦</Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
          Create a custodial wallet. Provisioning is idempotent — retrying won&apos;t create a duplicate.
        </Text>
        <Input label="Wallet name" placeholder="e.g. Main" value={name} onChangeText={setName} error={err || undefined} autoFocus />
        <Button label="Create wallet" size="lg" loading={busy} disabled={busy} onPress={submit} />
      </View>
      {modal}
    </SafeAreaView>
  );
}
