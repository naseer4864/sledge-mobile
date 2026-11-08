import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Gift, Check, ShieldAlert, Clock3, ArrowUpRight, WalletCards } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/providers/theme';
import { useSellBrands, useSellQuote, useSellSubmit, useSellSubmissions, useSellSettlements, settlementFor, useSellSettledEffect, type SellBrand, type SellSubmission } from '../../src/services/giftcards';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ConfirmSheet } from '../../src/components/ui/confirm-sheet';
import { useFeedback } from '../../src/components/ui/feedback-modal';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';

const fmt = (n: string | number) => (Number(n) / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
const STATUS: Record<string, string> = { awaiting_verification: 'Verifying your card…', processing: 'Verification in progress', accepted: 'Gift card verified', rejected: 'Card rejected', case_open: 'Under review', cancelled: 'Cancelled' };
const SETTLEMENT: Record<string, string> = { pending: 'Awaiting NGN settlement', processing: 'Settling to your wallet…', completed: 'Settled to wallet', failed: 'Settlement failed', submission_unknown: 'Settlement outcome unknown', reconciliation_required: 'Settlement under review', cancelled: 'Settlement cancelled' };

export default function SellGiftCard() {
  const { colors } = useTheme();
  const brands = useSellBrands();
  const sales = useSellSubmissions();
  const settlements = useSellSettlements();
  useSellSettledEffect((settlements.data ?? []).some((s) => s.status === 'completed'));
  const quote = useSellQuote();
  const submit = useSellSubmit();
  const [brand, setBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [q, setQ] = useState<ReturnType<typeof useSellQuote>['data'] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { show, modal } = useFeedback();

  const getQuote = async () => {
    if (!brand || !amount) return;
    try {
      const r = await quote.mutateAsync({ brand, amountAtomic: amount, country: 'US', cardCurrency: 'USD', idempotencyKey: `sell-q-${Date.now()}` });
      setQ(r);
    } catch (e) { show({ kind: 'error', title: 'Quote failed', message: (e as Error).message }); }
  };
  const doSubmit = async () => {
    setConfirming(false);
    if (!q || !code) return;
    try {
      await submit.mutateAsync({ quoteId: q.quoteId, code, pin: pin || null, idempotencyKey: `sell-${q.quoteId}` });
      setCode(''); setPin(''); setQ(null); setBrand(''); setAmount('');
      show({ kind: 'success', title: 'Card submitted', message: 'Your gift card has been sent for verification — we will credit your NGN wallet once it is accepted.' });
    } catch (e) { show({ kind: 'error', title: 'Submission failed', message: (e as Error).message }); }
  };

  const card = { borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...elevation.surface } as const;

  if (brands.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  const sellable = brands.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopFade />
      <ScreenHeader title="Sell gift card" subtitle="Get an NGN payout after verification" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 17, overflow: 'hidden', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -26, top: -36, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(201,245,232,0.07)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.14)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 43, height: 43, borderRadius: 15, backgroundColor: 'rgba(201,245,232,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)' }}>
              <WalletCards size={21} color="#C9F5E8" />
            </View>
            <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginLeft: 11 }}>SELL GIFT CARDS</Text>
          </View>
          <Text style={{ color: '#F4FAF7', fontSize: 19, fontWeight: '800', marginTop: 15 }}>Turn your card into NGN</Text>
          <Text style={{ color: 'rgba(244,250,247,0.75)', fontSize: 12, lineHeight: 18, marginTop: 5 }}>
            Choose an eligible brand, get a payout quote, then submit the card for verification.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <ShieldAlert size={14} color="#C9F5E8" />
            <Text style={{ color: '#C9F5E8', fontSize: 10, fontWeight: '700', marginLeft: 6 }}>Never share card details outside this secure flow</Text>
          </View>
          <ArrowUpRight size={23} color="rgba(201,245,232,0.7)" style={{ position: 'absolute', right: 17, bottom: 17 }} />
        </LinearGradient>

        {brands.error ? (
          <View style={card}><ErrorState description="Could not load sellable gift cards." onRetry={brands.refetch} /></View>
        ) : sellable.length === 0 ? (
          <View style={card}><EmptyState title="No sellable cards" description="No gift cards are currently eligible for sale." /></View>
        ) : (
          <View style={{ gap: 14 }}>
            {/* Step 1 — brand */}
            <View style={[{ padding: 17, gap: 11 }, card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={{ width: 27, height: 27, borderRadius: 10, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}>
                  <Text style={{ color: '#004C3F', fontSize: 12, fontWeight: '900' }}>1</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Choose your card</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Select an eligible brand</Text>
                </View>
              </View>
              {sellable.map((b: SellBrand) => {
                const active = brand === b.brand;
                return (
                  <Pressable key={b.brand} onPress={() => { setBrand(b.brand); setQ(null); }} accessibilityState={{ selected: active }}
                    style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: active ? '#00B887' : colors.border, backgroundColor: active ? '#C9F5E8' : colors.surfaceMuted, padding: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: active ? '#00B887' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 11, ...elevation.surface }}>
                      <Gift size={18} color={active ? '#FFFFFF' : '#004C3F'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'capitalize' }}>{b.brand}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{b.cardType} · {b.cardCurrency} · {b.country}</Text>
                    </View>
                    <View style={{ width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: active ? '#00B887' : colors.border, backgroundColor: active ? '#00B887' : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                      {active ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 2 — amount + quote */}
            <View style={[{ padding: 17, gap: 13 }, card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 27, height: 27, borderRadius: 10, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}>
                  <Text style={{ color: '#004C3F', fontSize: 12, fontWeight: '900' }}>2</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Enter the face value</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Amount printed on your card, in kobo</Text>
                </View>
              </View>
              <Input label="Card face value (kobo)" placeholder="e.g. 50000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <Button label="Get payout quote" size="lg" loading={quote.isPending} disabled={quote.isPending || !brand || !amount} onPress={getQuote} />
            </View>

            {/* Payout + card details */}
            {q && (
              <View style={[{ padding: 16, gap: 13 }, card]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 27, height: 27, borderRadius: 10, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}>
                    <Text style={{ color: '#004C3F', fontSize: 12, fontWeight: '900' }}>3</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Review and submit</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Your quoted payout</Text>
                  </View>
                </View>
                <LinearGradient colors={['#004C3F', '#003D32']} style={{ borderRadius: 19, padding: 17 }}>
                  <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>ESTIMATED NGN PAYOUT</Text>
                  <Text style={{ fontSize: 27, fontWeight: '800', color: '#F4FAF7', letterSpacing: -0.5, marginTop: 6 }}>{fmt(q.totalPayoutAtomic)}</Text>
                  {q.feeAtomic ? <Text style={{ fontSize: 11, color: '#C9F5E8', marginTop: 4 }}>Fee: {fmt(q.feeAtomic)}</Text> : null}
                </LinearGradient>
                <Input label="Card code" value={code} onChangeText={setCode} placeholder="ABCD-1234-EFGH" secureTextEntry autoCapitalize="characters" />
                <Input label="PIN (if required)" value={pin} onChangeText={setPin} placeholder="PIN" secureTextEntry keyboardType="numeric" />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, backgroundColor: '#C9F5E8', padding: 12 }}>
                  <ShieldAlert size={14} color={colors.textMuted} />
                  <Text style={{ flex: 1, fontSize: 11, color: '#004C3F', lineHeight: 16, marginLeft: 8 }}>Credentials are encrypted in transit and are not stored on this device.</Text>
                </View>
                <Button label="Submit card" size="lg" disabled={submit.isPending || !code} loading={submit.isPending} onPress={() => setConfirming(true)} />
              </View>
            )}
          </View>
        )}

        {/* My sales */}
        {(sales.data ?? []).length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>My sales</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>Verification and wallet settlement progress</Text>
            </View>
            <View style={card}>
              {(sales.data ?? []).map((s: SellSubmission, i: number) => {
                const st = settlementFor(settlements.data, s.submissionId);
                return (
                  <View key={s.submissionId}>
                    {i > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }} /> : null}
                    <View style={{ padding: 15 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'capitalize' }}>{s.brand ?? 'Card'}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{s.faceValueAtomic ? fmt(s.faceValueAtomic) : ''}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
                        <Clock3 size={13} color={colors.textMuted} />
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>{STATUS[s.status] ?? s.status}</Text>
                      </View>
                      {st ? (
                        <View style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>{SETTLEMENT[st.status] ?? st.status}</Text>
                          {st.status === 'completed' ? <Text style={{ fontSize: 13, color: '#12B76A', fontWeight: '600', marginTop: 2 }}>{fmt(st.amountAtomic)} credited{st.completedAt ? ` · ${new Date(st.completedAt).toLocaleDateString()}` : ''}</Text> : null}
                        </View>
                      ) : s.status === 'accepted' ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Awaiting NGN settlement</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
      <ConfirmSheet
        visible={confirming}
        title="Submit card?"
        message="Your card details will be sent for verification. This cannot be undone."
        confirmLabel="Submit"
        onConfirm={doSubmit}
        onCancel={() => setConfirming(false)}
      />
      {modal}
    </SafeAreaView>
  );
}
