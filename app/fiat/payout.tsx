import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Clock3, Landmark } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useSavedAccounts, quoteBeneficiaryPayout, createBeneficiaryPayout, type BoundQuote, type FiatPayout, type SavedAccount } from '../../src/services/fiat';
import { formatAtomic } from '../../src/lib/money';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { ApiError } from '../../src/services/api';

type Step = 'details' | 'review' | 'done';
const fmt = (s: string) => formatAtomic(s, 2); // NGN is 2dp — backend emits atomic kobo strings

export default function PayoutForm() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const accounts = useSavedAccounts();
  const [step, setStep] = useState<Step>('details');
  const [amount, setAmount] = useState('');
  const [dest, setDest] = useState<SavedAccount | null>(null);
  const [quote, setQuote] = useState<BoundQuote | null>(null);
  const [result, setResult] = useState<FiatPayout | null>(null);
  const [err, setErr] = useState('');
  const [idem] = useState(() => Crypto.randomUUID()); // idempotent submission — retries reuse this key

  const eligible = (accounts.data ?? []).filter((a) => a.status === 'verified');
  const isQuoteExpired = () => !!quote && new Date(quote.expiresAt).getTime() <= Date.now(); // checked at press-time, not render

  const doQuote = useMutation({
    mutationFn: () => quoteBeneficiaryPayout(amount, dest!.customerBankAccountId),
    onSuccess: (q) => { setQuote(q); setStep('review'); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not get a quote'),
  });
  const submit = useMutation({
    // quoteId pins the payout to this beneficiary+amount — the backend rejects beneficiary mismatches
    mutationFn: () => createBeneficiaryPayout({ amount, customerBankAccountId: dest!.customerBankAccountId, quoteId: quote?.quoteId, idempotencyKey: idem }),
    onSuccess: (p) => { setResult(p); setStep('done'); qc.invalidateQueries({ queryKey: ['fiat-payouts'] }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Withdrawal failed'),
  });

  const pickDest = (a: SavedAccount) => { setDest(a); setQuote(null); }; // beneficiary change → fresh quote required

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Withdraw NGN</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {step === 'details' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>To bank account</Text>
                {accounts.isLoading ? <LoadingState /> : accounts.error ? <ErrorState description="Could not load bank accounts." onRetry={accounts.refetch} /> :
                  eligible.length === 0 ? (
                    <View style={{ gap: 12 }}>
                      <EmptyState title="No verified account" description="Add and verify a Nigerian bank account before withdrawing." icon={<Landmark size={26} color="#00B894" />} />
                      <Button label="Add a bank account" variant="outline" size="lg" onPress={() => router.push('/fiat/add-account' as never)} />
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {eligible.map((a) => {
                        const sel = dest?.customerBankAccountId === a.customerBankAccountId;
                        return (
                          <Pressable key={a.customerBankAccountId} accessibilityLabel={`Withdraw to ${a.bankName}`} onPress={() => pickDest(a)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? '#00B894' : colors.border, backgroundColor: sel ? '#00B8940D' : colors.surface, padding: 14 }}>
                            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                              <Landmark size={17} color="#00B894" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{a.bankName}{a.isDefault ? ' · Default' : ''}</Text>
                              <Text style={{ fontSize: 12, color: colors.textMuted }}>{a.accountName} · {a.accountNumberMasked}</Text>
                            </View>
                            {sel ? <CheckCircle2 size={18} color="#00B894" /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
              </View>
              {eligible.length > 0 ? (
                <>
                  <Input label="Amount (NGN)" placeholder="5000.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} accessibilityLabel="Amount" />
                  {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
                  <Button label="Get quote" size="lg" loading={doQuote.isPending}
                    disabled={!dest || !amount || doQuote.isPending}
                    onPress={() => { setErr(''); doQuote.mutate(); }} />
                </>
              ) : null}
            </View>
          )}
          {step === 'review' && quote && dest && (
            <View style={{ gap: 14 }}>
              <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
                {[['To', `${dest.accountName} · ${dest.accountNumberMasked}`], ['Bank', dest.bankName], ['Amount', `₦${fmt(quote.amountAtomic)}`], ['Fee', `₦${fmt(quote.feeAtomic)}`], ['Total debit', `₦${fmt(quote.totalReservedAtomic)}`]].map(([k, v]) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 }}>{v}</Text>
                  </View>
                ))}
              </View>
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Confirm withdrawal" size="lg" loading={submit.isPending}
                disabled={submit.isPending}
                onPress={() => {
                  if (isQuoteExpired()) { setErr('This quote expired — go back and request a fresh one.'); return; }
                  setErr(''); submit.mutate();
                }} />
              <Button label="Edit" variant="outline" size="lg" onPress={() => { setStep('details'); setQuote(null); }} />
            </View>
          )}
          {step === 'done' && result && (
            <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              {result.status === 'submission_unknown' || result.status === 'reconciliation_required'
                ? <Clock3 size={48} color="#F79009" /> : <CheckCircle2 size={48} color="#12B76A" />}
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Withdrawal requested</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 }}>
                {result.status === 'submission_unknown' || result.status === 'reconciliation_required'
                  ? 'The transfer is being checked with the bank — no action needed. Do not submit a duplicate withdrawal.'
                  : 'Your withdrawal was submitted. Track it under payouts.'}
              </Text>
              <Button label="View payouts" size="lg" onPress={() => router.replace('/fiat/payouts' as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
