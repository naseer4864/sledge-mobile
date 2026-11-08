import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Copy, Landmark } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useBankingAccounts, provisionAccount } from '../../src/services/fiat';
import { Button } from '../../src/components/ui/button';
import { elevation } from '../../src/theme/elevation';
import { LoadingState, ErrorState } from '../../src/components/states';
import { ApiError } from '../../src/services/api';
import { ScreenHeader } from '../../src/components/screen-header';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function ReceiveNgn() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const a = useBankingAccounts();
  const [, setCopied] = useState('');
  const { show, modal } = useFeedback();

  const account = a.data?.find((x) => x.status === 'active') ?? a.data?.[0];
  const provision = useMutation({
    mutationFn: () => provisionAccount(Crypto.randomUUID()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banking-accounts'] });
      show({ kind: 'success', title: 'NGN account requested', message: 'Your account details will appear here once provisioning is complete.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Account not created', message: e instanceof ApiError ? e.message : 'Could not create an account. Please try again.' }),
  });

  const share = async (label: string, value: string) => { try { await Share.share({ message: value }); setCopied(label); setTimeout(() => setCopied(''), 1500); } catch {} };

  if (a.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade /><LoadingState /></SafeAreaView>;
  if (a.error) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade /><ErrorState description="Could not load account details." onRetry={a.refetch} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Receive NGN" subtitle="Your Nigerian bank transfer details" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {!account ? (
          <View style={{ alignItems: 'center', paddingTop: 32, gap: 14 }}>
            <Landmark size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center' }}>No virtual NGN account yet.{'\n'}Create one to receive bank transfers.</Text>
            <Button label="Create NGN account" size="lg" loading={provision.isPending} onPress={() => provision.mutate()} />
          </View>
        ) : (
          <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, ...elevation.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' }}>Your NGN account</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: account.status === 'active' ? '#12B76A' : '#F79009', textTransform: 'uppercase' }}>{account.status}</Text>
            </View>
            {[['Bank', account.bankName], ['Account number', account.accountNumber], ['Account name', account.accountName]].map(([k, v]) => v ? (
              <View key={k} style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{k}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }} selectable>{v}</Text>
                  <Pressable onPress={() => share(String(k), v!)} accessibilityLabel={`Copy ${k}`} style={{ padding: 6 }}><Copy size={16} color={colors.textMuted} /></Pressable>
                </View>
              </View>
            ) : null)}
            <Text style={{ marginTop: 16, fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
              Transfer NGN from any Nigerian bank to this account — it will be credited to your Sledge Wallet NGN balance once the payment clears.
            </Text>
            {account.simulated ? <Text style={{ marginTop: 8, fontSize: 11, color: '#F79009' }}>Simulated banking — development environment.</Text> : null}
          </View>
        )}
        <View style={{ marginTop: 16, gap: 8 }}>
          {([
            ['Deposits', '/fiat/deposits'], ['Withdraw NGN', '/fiat/payout'], ['Withdrawal history', '/fiat/payouts'], ['Bank accounts', '/fiat/accounts'],
          ] as [string, string][]).map(([label, href]) => (
            <Pressable key={href} accessibilityLabel={label} onPress={() => router.push(href as never)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}
