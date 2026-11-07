import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSellBrands, useSellQuote, useSellSubmit, useSellSubmissions, useSellSettlements, settlementFor, useSellSettledEffect, type SellBrand, type SellSubmission } from '../../src/services/giftcards';

const fmt = (n: string | number) => (Number(n) / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
const STATUS: Record<string, string> = { awaiting_verification: 'Verifying your card…', processing: 'Verification in progress', accepted: 'Gift card verified', rejected: 'Card rejected', case_open: 'Under review', cancelled: 'Cancelled' };
const SETTLEMENT: Record<string, string> = { pending: 'Awaiting NGN settlement', processing: 'Settling to your wallet…', completed: 'Settled to wallet', failed: 'Settlement failed', submission_unknown: 'Settlement outcome unknown', reconciliation_required: 'Settlement under review', cancelled: 'Settlement cancelled' };

export default function SellGiftCard() {
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

  const getQuote = async () => {
    if (!brand || !amount) return;
    const r = await quote.mutateAsync({ brand, amountAtomic: amount, country: 'US', cardCurrency: 'USD', idempotencyKey: `sell-q-${Date.now()}` });
    setQ(r);
  };
  const doSubmit = async () => {
    if (!q || !code) return;
    Alert.alert('Submit card?', 'Your card details will be sent for verification. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          await submit.mutateAsync({ quoteId: q.quoteId, code, pin: pin || null, idempotencyKey: `sell-${q.quoteId}` });
          setCode(''); setPin(''); setQ(null); setBrand(''); setAmount('');
        } catch (e) { Alert.alert('Submission failed', (e as Error).message); }
      }},
    ]);
  };

  if (brands.isLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;
  const sellable = brands.data ?? [];

  return (
    <ScrollView className="flex-1 bg-bg p-4">
      <Stack.Screen options={{ title: 'Sell Gift Card' }} />
      {sellable.length === 0 ? (
        <View className="mt-8 items-center"><Text className="text-text-muted">No gift cards are currently eligible for sale.</Text></View>
      ) : (
        <>
          <Text className="text-lg font-semibold mb-2">1. Choose your card</Text>
          {sellable.map((b: SellBrand) => (
            <TouchableOpacity key={b.brand} onPress={() => { setBrand(b.brand); setQ(null); }}
              className={`rounded-xl border p-4 mb-2 ${brand === b.brand ? 'border-primary bg-accent/5' : 'border-border bg-surface'}`}>
              <Text className="font-medium capitalize">{b.brand}</Text>
              <Text className="text-xs text-text-muted">{b.cardCurrency} · {b.country}</Text>
            </TouchableOpacity>
          ))}
          <Text className="text-lg font-semibold mt-4 mb-2">2. Face value (kobo)</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="50000" className="rounded-xl border border-border bg-surface p-4" />
          <TouchableOpacity onPress={getQuote} disabled={quote.isPending || !brand || !amount} className="mt-3 rounded-xl bg-accent p-4 items-center">
            {quote.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-accent-foreground font-medium">Get payout quote</Text>}
          </TouchableOpacity>
          {q && (
            <View className="mt-4 rounded-xl border border-border bg-surface p-4">
              <Text className="text-lg font-semibold">Your payout</Text>
              <Text className="text-2xl font-bold mt-1">{fmt(q.totalPayoutAtomic)}</Text>
              {q.feeAtomic ? <Text className="text-xs text-text-muted mt-1">Verification fee: {fmt(q.feeAtomic)}</Text> : null}
              <Text className="text-xs text-text-muted mt-2">3. Card code</Text>
              <TextInput value={code} onChangeText={setCode} placeholder="ABCD-1234-EFGH" secureTextEntry className="rounded-xl border border-border bg-surface p-4 mt-1" autoCapitalize="characters" />
              <TextInput value={pin} onChangeText={setPin} placeholder="PIN (if required)" secureTextEntry keyboardType="numeric" className="rounded-xl border border-border bg-surface p-4 mt-2" />
              <Text className="text-xs text-text-muted mt-2">Credentials are encrypted in transit — never stored on this device.</Text>
              <TouchableOpacity onPress={doSubmit} disabled={submit.isPending || !code} className="mt-3 rounded-xl bg-accent p-4 items-center">
                {submit.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-accent-foreground font-semibold">Submit card</Text>}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      {(sales.data ?? []).length > 0 && (
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-2">My sales</Text>
          {(sales.data ?? []).map((s: SellSubmission) => (
            <View key={s.submissionId} className="rounded-xl border border-border bg-surface p-4 mb-2">
              <View className="flex-row justify-between"><Text className="font-medium capitalize">{s.brand ?? 'Card'}</Text><Text className="text-text-muted">{s.faceValueAtomic ? fmt(s.faceValueAtomic) : ''}</Text></View>
              <Text className="text-sm mt-1">{STATUS[s.status] ?? s.status}</Text>
              {(() => {
                const st = settlementFor(settlements.data, s.submissionId);
                if (!st) return s.status === 'accepted' ? <Text className="text-xs text-text-muted mt-1">Awaiting NGN settlement</Text> : null;
                return (
                  <View className="mt-1">
                    <Text className="text-xs text-text-muted">{SETTLEMENT[st.status] ?? st.status}</Text>
                    {st.status === 'completed' ? <Text className="text-sm text-accent font-medium mt-0.5">{fmt(st.amountAtomic)} credited{st.completedAt ? ` · ${new Date(st.completedAt).toLocaleDateString()}` : ''}</Text> : null}
                  </View>
                );
              })()}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
