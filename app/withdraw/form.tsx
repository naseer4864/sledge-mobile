import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TriangleAlert, CheckCircle2 } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useAssets } from '../../src/services/wallets';
import * as Crypto from 'expo-crypto';
import { quoteWithdrawal, createWithdrawal, type Withdrawal, type WithdrawalQuote } from '../../src/services/withdrawals';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';

type Step = 'details' | 'review' | 'done';
const mask = (a: string) => (a.length > 20 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a);

export default function WithdrawForm() {
  const { walletId, assetId, symbol, networkId, networkName, decimals } = useLocalSearchParams<Record<string, string>>();
  const dec = Number(decimals ?? '8');
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('details');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [result, setResult] = useState<Withdrawal | null>(null);
  const [err, setErr] = useState('');
  const [idem] = useState(() => Crypto.randomUUID());
  const asset = useAssets().data?.find((x) => x.assetId === assetId);

  const doQuote = useMutation({
    mutationFn: () => quoteWithdrawal({ walletId: walletId!, assetId: assetId!, networkId: networkId!, amount }),
    onSuccess: (q) => { setQuote(q); setStep('review'); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Quote failed'),
  });
  const submit = useMutation({
    mutationFn: () => createWithdrawal({ walletId: walletId!, assetId: assetId!, networkId: networkId!, amount, destinationAddress: address.trim(), destinationMemo: memo.trim() || undefined, idempotencyKey: idem }),
    onSuccess: (w) => { setResult(w); setStep('done'); qc.invalidateQueries({ queryKey: ['withdrawals'] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Withdrawal failed'),
  });

  const fmt = (s: string) => (asset ? formatAtomicLocal(s, dec) : s);
  function formatAtomicLocal(atomic: string, d: number) {
    const neg = atomic.startsWith('-'); const abs = neg ? atomic.slice(1) : atomic; const pad = abs.padStart(d + 1, '0');
    return `${neg ? '-' : ''}${pad.slice(0, -d)}.${pad.slice(-d)}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Send {symbol}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {step === 'details' && (
            <View style={{ gap: 16 }}>
              <Input label="Destination address" placeholder={`${networkName} address`} autoCapitalize="none" autoCorrect={false} value={address} onChangeText={setAddress} />
              <Input label="Memo / tag (optional)" placeholder="If required by the network" autoCapitalize="none" value={memo} onChangeText={setMemo} />
              <Input label={`Amount (${asset?.decimals ?? dec} decimals)`} placeholder="0.00000000" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Get quote" size="lg" loading={doQuote.isPending}
                disabled={!address.trim() || !amount || doQuote.isPending}
                onPress={() => { setErr(''); doQuote.mutate(); }} />
            </View>
          )}
          {step === 'review' && quote && (
            <View style={{ gap: 14 }}>
              <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
                {[['Asset', `${symbol} · ${networkName}`], ['To', mask(address)], ...(memo ? [['Memo', memo]] : []),
                  ['Amount', `${fmt(quote.amountAtomic)} ${symbol}`], ['Fee', `${fmt(quote.feeAtomic)} ${symbol}`], ['Total debit', `${fmt(quote.totalReservedAtomic)} ${symbol}`]].map(([k, v]) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} selectable={k === 'To'}>{v}</Text>
                  </View>
                ))}
              </View>
              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 12, flexDirection: 'row', gap: 8 }}>
                <TriangleAlert size={16} color="#F79009" />
                <Text style={{ flex: 1, fontSize: 12, color: '#B45309' }}>Withdrawals are irreversible — verify the address and network.</Text>
              </View>
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Confirm withdrawal" size="lg" loading={submit.isPending} disabled={submit.isPending}
                onPress={() => { setErr(''); submit.mutate(); }} />
              <Button label="Edit" variant="outline" size="lg" onPress={() => setStep('details')} />
            </View>
          )}
          {step === 'done' && result && (
            <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <CheckCircle2 size={48} color="#12B76A" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Withdrawal {result.status === 'pending_review' ? 'submitted for review' : 'requested'}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>Status: {result.status}</Text>
              <Button label="View history" size="lg" onPress={() => router.replace('/withdraw/history' as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
