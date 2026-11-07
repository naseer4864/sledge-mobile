import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { createWallet } from '../../src/services/wallets';
import * as Crypto from 'expo-crypto';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';

export default function CreateWallet() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!z.string().min(1).max(80).safeParse(name.trim()).success) { setErr('Enter a wallet name'); return; }
    setErr(''); setBusy(true);
    try {
      await createWallet(name.trim(), Crypto.randomUUID()); // clientRequestId — idempotent on retry
      await qc.invalidateQueries({ queryKey: ['wallets'] });
      router.back();
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not create wallet'); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>New wallet</Text>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
          Create a custodial wallet. Provisioning is idempotent — retrying won&rsquo;t create a duplicate.
        </Text>
        <Input label="Wallet name" placeholder="e.g. Main" value={name} onChangeText={setName} error={err || undefined} autoFocus />
        <Button label="Create wallet" size="lg" loading={busy} disabled={busy} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}
