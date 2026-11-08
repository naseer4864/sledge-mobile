import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { TriangleAlert, CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useAssets } from '../../src/services/wallets';
import * as Crypto from 'expo-crypto';
import { quoteWithdrawal, createWithdrawal, type Withdrawal, type WithdrawalQuote } from '../../src/services/withdrawals';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { WITHDRAWAL_STATUS } from '../../src/lib/withdrawal-status';
import { useFeedback } from '../../src/components/ui/feedback-modal';

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
  const { show, modal } = useFeedback();
  const asset = useAssets().data?.find((x) => x.assetId === assetId);
  const resultStatus = result ? WITHDRAWAL_STATUS[result.status] : undefined;

  const doQuote = useMutation({
    mutationFn: () => quoteWithdrawal({ walletId: walletId!, assetId: assetId!, networkId: networkId!, amount }),
    onSuccess: (q) => { setQuote(q); setStep('review'); },
    onError: (e) => show({ kind: 'error', title: 'Quote unavailable', message: e instanceof ApiError ? e.message : 'Could not get a withdrawal quote. Please try again.' }),
  });
  const submit = useMutation({
    mutationFn: () => createWithdrawal({ walletId: walletId!, assetId: assetId!, networkId: networkId!, amount, destinationAddress: address.trim(), destinationMemo: memo.trim() || undefined, idempotencyKey: idem }),
    onSuccess: (w) => {
      setResult(w); setStep('done');
      qc.invalidateQueries({ queryKey: ['withdrawals'] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      show({ kind: 'success', title: 'Withdrawal request received', message: w.status === 'pending_review' ? 'Your request is waiting for review. Track its status in withdrawal history.' : 'Your request was submitted. Track its status in withdrawal history.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Withdrawal not submitted', message: e instanceof ApiError ? e.message : 'Could not submit the withdrawal. Please try again.' }),
  });

  const fmt = (s: string) => (asset ? formatAtomicLocal(s, dec) : s);
  const panel = { borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...elevation.surface } as const;
  const activeStep = step === 'details' ? 0 : step === 'review' ? 1 : 2;
  function formatAtomicLocal(atomic: string, d: number) {
    const neg = atomic.startsWith('-'); const abs = neg ? atomic.slice(1) : atomic; const pad = abs.padStart(d + 1, '0');
    return `${neg ? '-' : ''}${pad.slice(0, -d)}.${pad.slice(-d)}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader title={`Send ${symbol}`} subtitle={networkName ? `${networkName} network` : 'Crypto withdrawal'} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 56 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[{ marginTop: 6, marginBottom: 16, padding: 16 }, panel]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {['Details', 'Review', 'Finish'].map((label, index) => (
                <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: index <= activeStep ? '#00B887' : colors.surfaceMuted }}>
                    {index < activeStep ? <CheckCircle2 size={15} color="#FFFFFF" /> : <Text style={{ color: index === activeStep ? '#FFFFFF' : colors.textMuted, fontSize: 11, fontWeight: '800' }}>{index + 1}</Text>}
                  </View>
                  <Text style={{ color: index === activeStep ? colors.text : colors.textMuted, fontSize: 11, fontWeight: index === activeStep ? '800' : '600', marginLeft: 7 }}>{label}</Text>
                  {index < 2 ? <View style={{ flex: 1, height: 1, backgroundColor: index < activeStep ? '#00B887' : colors.border, marginHorizontal: 8 }} /> : null}
                </View>
              ))}
            </View>
          </View>
          {step === 'details' && (
            <View style={{ gap: 14 }}>
              <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 20, overflow: 'hidden', ...elevation.raised }}>
                <View style={{ position: 'absolute', right: -16, top: -26, width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: 'rgba(201,245,232,0.16)', backgroundColor: 'rgba(201,245,232,0.06)' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,245,232,0.15)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.2)' }}>
                    <ArrowUpRight size={22} color="#C9F5E8" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>CRYPTO WITHDRAWAL</Text>
                    <Text style={{ color: '#F4FAF7', fontSize: 18, fontWeight: '800', marginTop: 3 }}>{symbol} <Text style={{ color: '#C9F5E8', fontSize: 13 }}>· {networkName || networkId}</Text></Text>
                  </View>
                </View>
                <Text style={{ color: 'rgba(244,250,247,0.72)', fontSize: 12, lineHeight: 18, marginTop: 17 }}>
                  Send to an external wallet. Make sure the destination supports this network.
                </Text>
              </LinearGradient>

              <View style={[{ padding: 17, gap: 16 }, panel]}>
                <View>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Transfer details</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Enter the receiving wallet and amount.</Text>
                </View>
                <Input label="Destination address" placeholder={`${networkName || 'Wallet'} address`} autoCapitalize="none" autoCorrect={false} value={address} onChangeText={setAddress} />
                <Input label="Memo / tag (optional)" placeholder="Only if required by the network" autoCapitalize="none" value={memo} onChangeText={setMemo} />
                <Input label={`Amount (${asset?.decimals ?? dec} decimals)`} placeholder="0.00000000" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              </View>

              <View style={{ borderRadius: 17, backgroundColor: '#C9F5E8', borderWidth: 1, borderColor: '#A8E9D5', padding: 14, flexDirection: 'row', alignItems: 'flex-start' }}>
                <ShieldCheck size={18} color="#004C3F" />
                <Text style={{ flex: 1, color: '#004C3F', fontSize: 12, lineHeight: 18, marginLeft: 10 }}>
                  Check the address and network carefully. Blockchain transfers cannot be reversed.
                </Text>
              </View>
              {err ? (
                <View style={{ borderRadius: 14, backgroundColor: '#FEF3F2', borderColor: '#FECDCA', borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <TriangleAlert size={17} color="#D7473D" />
                  <Text style={{ flex: 1, color: '#B42318', fontSize: 12, lineHeight: 18, marginLeft: 8 }}>{err}</Text>
                </View>
              ) : null}
              <Button label="Review withdrawal" size="lg" loading={doQuote.isPending}
                disabled={!address.trim() || !amount || doQuote.isPending}
                onPress={() => { setErr(''); doQuote.mutate(); }} />
            </View>
          )}
          {step === 'review' && quote && (
            <View style={{ gap: 14 }}>
              <View style={[{ overflow: 'hidden' }, panel]}>
                <LinearGradient colors={['#004C3F', '#003D32']} style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(244,250,247,0.72)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>YOU ARE SENDING</Text>
                  <Text style={{ color: '#F4FAF7', fontSize: 29, fontWeight: '800', marginTop: 8, fontVariant: ['tabular-nums'] }}>{fmt(quote.amountAtomic)}</Text>
                  <Text style={{ color: '#C9F5E8', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{symbol} · {networkName || networkId}</Text>
                </LinearGradient>
                <View style={{ padding: 18, gap: 13 }}>
                  <View style={{ paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>Destination</Text>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 6 }} selectable>{mask(address)}</Text>
                    {memo ? <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Memo / tag: {memo}</Text> : null}
                  </View>
                  {[['Amount', `${fmt(quote.amountAtomic)} ${symbol}`], ['Network fee', `${fmt(quote.feeAtomic)} ${symbol}`]].map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{v}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>Total debit</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#004C3F' }}>{fmt(quote.totalReservedAtomic)} {symbol}</Text>
                  </View>
                </View>
              </View>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#FFF8EB', padding: 14, flexDirection: 'row', alignItems: 'flex-start' }}>
                <TriangleAlert size={16} color="#F79009" />
                <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: '#9A4D00', marginLeft: 9 }}>Withdrawals are irreversible. Confirm the destination address, network, and total before continuing.</Text>
              </View>
              {err ? <Text style={{ color: '#F04438', fontSize: 13, paddingHorizontal: 2 }}>{err}</Text> : null}
              <Button label="Confirm withdrawal" size="lg" loading={submit.isPending} disabled={submit.isPending}
                onPress={() => { setErr(''); submit.mutate(); }} />
              <Button label="Edit details" variant="outline" size="lg" onPress={() => setStep('details')} />
            </View>
          )}
          {step === 'done' && result && (
            <View style={{ gap: 16, paddingTop: 4 }}>
              <LinearGradient colors={['#004C3F', '#003D32']} style={{ alignItems: 'center', borderRadius: 26, paddingHorizontal: 24, paddingVertical: 30, ...elevation.raised }}>
                <View style={{ width: 70, height: 70, borderRadius: 24, backgroundColor: 'rgba(201,245,232,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,245,232,0.28)' }}>
                  <CheckCircle2 size={38} color="#C9F5E8" />
                </View>
                <Text style={{ fontSize: 21, fontWeight: '800', color: '#F4FAF7', textAlign: 'center', marginTop: 17 }}>Request received</Text>
                <Text style={{ fontSize: 13, color: 'rgba(244,250,247,0.75)', textAlign: 'center', lineHeight: 20, marginTop: 7 }}>
                  {result.status === 'pending_review' ? 'Your withdrawal is queued for review.' : 'Your withdrawal request has been submitted.'}
                </Text>
              </LinearGradient>
              <View style={[{ padding: 18, gap: 12 }, panel]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Amount</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{fmt(quote?.amountAtomic ?? result.amountAtomic)} {symbol}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Status</Text>
                  <Text style={{ color: resultStatus?.color ?? colors.textMuted, fontSize: 13, fontWeight: '800' }}>{resultStatus?.label ?? result.status.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 17 }}>You can track progress and transaction details in withdrawal history.</Text>
              </View>
              <Button label="View withdrawal history" size="lg" onPress={() => router.replace('/withdraw/history' as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}
