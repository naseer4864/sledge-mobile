import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TriangleAlert, CheckCircle2 } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useGiftProducts, createQuote, createPurchase, type GiftQuote, type GiftPurchase } from '../../src/services/giftcards';
import { formatAtomic } from '../../src/lib/money';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, EmptyState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

type Step = 'amount' | 'review' | 'done';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const p = useGiftProducts();
  const product = p.data?.find((x) => x.productId === id);
  const [amount, setAmount] = useState('');
  const [denom, setDenom] = useState('');
  const [quote, setQuote] = useState<GiftQuote | null>(null);
  const [purchase, setPurchase] = useState<GiftPurchase | null>(null);
  const [step, setStep] = useState<Step>('amount');
  const [err, setErr] = useState('');
  const [idemQuote] = useState(() => Crypto.randomUUID());
  const [idemPurchase] = useState(() => Crypto.randomUUID());

  const chosen = denom || amount;
  const [expired, setExpired] = useState(false);

  const doQuote = useMutation({
    mutationFn: () => createQuote(id!, chosen, idemQuote),
    onSuccess: (q) => { setQuote(q); setExpired(q.expiresAt ? new Date(q.expiresAt).getTime() < Date.now() : false); setStep('review'); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Quote failed'),
  });
  const buy = useMutation({
    mutationFn: () => createPurchase(quote!.quoteId, idemPurchase),
    onSuccess: (pu) => { setPurchase(pu); setStep('done'); qc.invalidateQueries({ queryKey: ['gift-purchases'] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Purchase failed'),
  });

  if (p.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (!product) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><EmptyState title="Not found" description="This product is unavailable." /></SafeAreaView>;

  const fmt = (s?: string) => (s ? `₦${formatAtomic(s, 2)}` : '—');
  const rows: [string, string][] = quote ? [
    ['Card value', fmt(quote.amountAtomic)],
    ...(quote.exchangeRate ? [['Rate', quote.exchangeRate] as [string, string]] : []),
    ...(quote.feeAtomic ? [['Fee', fmt(quote.feeAtomic)] as [string, string]] : []),
    ...(quote.paymentAtomic ? [['You pay', fmt(quote.paymentAtomic)] as [string, string]] : []),
    ...(quote.totalAtomic ? [['Total', fmt(quote.totalAtomic)] as [string, string]] : []),
    ...(quote.expiresAt ? [['Expires', new Date(quote.expiresAt).toLocaleTimeString()] as [string, string]] : []),
  ] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/gift-cards' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{product.brand ?? product.name ?? 'Gift card'}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {step === 'amount' && (
            <View style={{ gap: 14 }}>
              {product.description ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 19 }}>{product.description}</Text> : null}
              {product.denominations?.length ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</Text>
                  {product.denominations.map((d, i) => (
                    <Pressable key={i} onPress={() => { setDenom(d.amountAtomic ?? ''); setAmount(''); }} accessibilityState={{ selected: denom === d.amountAtomic }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1.5, borderColor: denom === d.amountAtomic ? '#00B894' : colors.border, backgroundColor: denom === d.amountAtomic ? '#00B8940D' : colors.surface, padding: 14 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{d.label ?? fmt(d.amountAtomic)}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{d.currency ?? product.currency ?? ''}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Input label={`Amount (${product.currency ?? 'NGN'})`} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              )}
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Get quote" size="lg" loading={doQuote.isPending} disabled={!chosen || doQuote.isPending} onPress={() => { setErr(''); doQuote.mutate(); }} />
            </View>
          )}
          {step === 'review' && quote && (
            <View style={{ gap: 14 }}>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
                {rows.map(([k, v]) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' }}>{v}</Text>
                  </View>
                ))}
              </View>
              {expired ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F04438', backgroundColor: '#F044380D', padding: 12 }}>
                  <Text style={{ fontSize: 12, color: '#B42318' }}>Quote expired — get a fresh one.</Text>
                </View>
              ) : (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 12, flexDirection: 'row', gap: 8 }}>
                  <TriangleAlert size={16} color="#F79009" />
                  <Text style={{ flex: 1, fontSize: 12, color: '#B45309' }}>Verify the amount — the card code is revealed only after the purchase completes.</Text>
                </View>
              )}
              {quote.simulated ? <Text style={{ fontSize: 11, color: colors.textMuted }}>Simulated execution — development provider.</Text> : null}
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Confirm purchase" size="lg" loading={buy.isPending} disabled={expired || buy.isPending} onPress={() => { setErr(''); buy.mutate(); }} />
              <Button label="Back" variant="outline" size="lg" onPress={() => setStep('amount')} />
            </View>
          )}
          {step === 'done' && purchase && (
            <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <CheckCircle2 size={48} color="#12B76A" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{purchase.status === 'completed' ? 'Purchase complete' : 'Purchase submitted'}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Status: {purchase.status.replace(/_/g, ' ')}</Text>
              <Button label="View purchase" size="lg" onPress={() => router.replace(`/gift-cards/purchase/${purchase.purchaseId}` as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
