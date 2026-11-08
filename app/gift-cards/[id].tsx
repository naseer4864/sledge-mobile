import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { TriangleAlert, CheckCircle2, Gift, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';
import { useFeedback } from '../../src/components/ui/feedback-modal';

type Step = 'amount' | 'review' | 'done';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const p = useGiftProducts();
  const { show, modal } = useFeedback();
  const product = p.data?.find((x) => x.productId === id);
  const [amount, setAmount] = useState('');
  const [denom, setDenom] = useState('');
  const [quote, setQuote] = useState<GiftQuote | null>(null);
  const [purchase, setPurchase] = useState<GiftPurchase | null>(null);
  const [step, setStep] = useState<Step>('amount');
  const [idemQuote] = useState(() => Crypto.randomUUID());
  const [idemPurchase] = useState(() => Crypto.randomUUID());

  const chosen = denom || amount;
  const [expired, setExpired] = useState(false);
  const activeStep = step === 'amount' ? 0 : step === 'review' ? 1 : 2;

  const doQuote = useMutation({
    mutationFn: () => createQuote(id!, chosen, idemQuote),
    onSuccess: (q) => { setQuote(q); setExpired(q.expiresAt ? new Date(q.expiresAt).getTime() < Date.now() : false); setStep('review'); },
    onError: (e) => show({ kind: 'error', title: 'Quote unavailable', message: e instanceof ApiError ? e.message : 'Could not get a gift-card quote. Please try again.' }),
  });
  const buy = useMutation({
    mutationFn: () => createPurchase(quote!.quoteId, idemPurchase),
    onSuccess: (pu) => {
      setPurchase(pu); setStep('done');
      qc.invalidateQueries({ queryKey: ['gift-purchases'] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      show({ kind: 'success', title: pu.status === 'completed' ? 'Purchase complete' : 'Purchase submitted', message: pu.status === 'completed' ? 'Your purchase is complete. Open its details to reveal the card code.' : 'Your purchase is being processed. You can follow its status in purchase details.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Purchase not completed', message: e instanceof ApiError ? e.message : 'Could not complete the purchase. Please try again.' }),
  });

  if (p.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (!product) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><EmptyState title="Not found" description="This product is unavailable." /></SafeAreaView>;

  const fmt = (s?: string) => (s ? `₦${formatAtomic(s, 2)}` : '—');
  const card = { borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...elevation.surface } as const;
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
        <ScreenHeader title={product.brand ?? product.name ?? 'Gift card'} subtitle="Gift card purchase" onBack={() => (router.canGoBack() ? router.back() : router.replace('/gift-cards' as never))} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 7, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[{ marginBottom: 15, padding: 15 }, card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {['Value', 'Review', 'Complete'].map((label, index) => (
                <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: index <= activeStep ? '#00B887' : colors.surfaceMuted }}>
                    {index < activeStep ? <CheckCircle2 size={15} color="#FFFFFF" /> : <Text style={{ color: index === activeStep ? '#FFFFFF' : colors.textMuted, fontSize: 11, fontWeight: '800' }}>{index + 1}</Text>}
                  </View>
                  <Text style={{ color: index === activeStep ? colors.text : colors.textMuted, fontSize: 10, fontWeight: index === activeStep ? '800' : '600', marginLeft: 6 }}>{label}</Text>
                  {index < 2 ? <View style={{ flex: 1, height: 1, backgroundColor: index < activeStep ? '#00B887' : colors.border, marginHorizontal: 7 }} /> : null}
                </View>
              ))}
            </View>
          </View>
          {step === 'amount' && (
            <View style={{ gap: 14 }}>
              <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: 23, padding: 19, overflow: 'hidden', ...elevation.raised }}>
                <View style={{ position: 'absolute', right: -22, top: -32, width: 125, height: 125, borderRadius: 63, backgroundColor: 'rgba(201,245,232,0.06)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.15)' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(201,245,232,0.16)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
                    <Gift size={23} color="#C9F5E8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(244,250,247,0.68)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>GIFT CARD</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#F4FAF7', marginTop: 3 }} numberOfLines={1}>{product.brand ?? product.name ?? 'Gift card'}</Text>
                    <Text style={{ fontSize: 11, color: '#C9F5E8', marginTop: 3 }}>{product.country ? `${product.country} · ` : ''}{product.currency ?? ''}</Text>
                  </View>
                </View>
                {product.description ? <Text style={{ fontSize: 12, color: 'rgba(244,250,247,0.76)', lineHeight: 18, marginTop: 15 }}>{product.description}</Text> : null}
              </LinearGradient>
              <View style={[{ padding: 17, gap: 15 }, card]}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Choose your value</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>You can review the full price before confirming.</Text>
                </View>
                {product.denominations?.length ? (
                  <View style={{ gap: 9 }}>
                    {product.denominations.map((d, i) => (
                      <Pressable key={i} onPress={() => { setDenom(d.amountAtomic ?? ''); setAmount(''); }} accessibilityState={{ selected: denom === d.amountAtomic }}
                        style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1.5, borderColor: denom === d.amountAtomic ? '#00B887' : colors.border, backgroundColor: denom === d.amountAtomic ? '#C9F5E8' : colors.surfaceMuted, padding: 13 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: denom === d.amountAtomic ? '#00B887' : colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          <Gift size={15} color={denom === d.amountAtomic ? '#FFFFFF' : '#004C3F'} />
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: colors.text }}>{d.label ?? fmt(d.amountAtomic)}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>{d.currency ?? product.currency ?? ''}</Text>
                        {denom === d.amountAtomic ? <CheckCircle2 size={17} color="#00B887" style={{ marginLeft: 8 }} /> : null}
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Input label={`Amount (${product.currency ?? 'NGN'})`} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
                )}
              </View>
              <Button label="Get purchase quote" size="lg" loading={doQuote.isPending} disabled={!chosen || doQuote.isPending} onPress={() => doQuote.mutate()} />
            </View>
          )}
          {step === 'review' && quote && (
            <View style={{ gap: 14 }}>
              <View style={[{ overflow: 'hidden' }, card]}>
                <LinearGradient colors={['#004C3F', '#003D32']} style={{ padding: 19, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>PURCHASE SUMMARY</Text>
                  <Text style={{ color: '#F4FAF7', fontSize: 27, fontWeight: '800', marginTop: 7 }}>{fmt(quote.amountAtomic)}</Text>
                  <Text style={{ color: '#C9F5E8', fontSize: 12, fontWeight: '700', marginTop: 3 }}>{product.brand ?? product.name ?? 'Gift card'}</Text>
                </LinearGradient>
                <View style={{ padding: 18, gap: 13 }}>
                  {rows.map(([k, v], index) => (
                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: index === 0 ? 0 : 12 }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{k}</Text>
                      <Text style={{ fontSize: 12, fontWeight: k === 'Total' || k === 'You pay' ? '800' : '600', color: colors.text, textAlign: 'right' }}>{v}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {expired ? (
                <View style={{ borderRadius: 15, borderWidth: 1, borderColor: '#FECDCA', backgroundColor: '#FEF3F2', padding: 13, flexDirection: 'row', alignItems: 'center' }}>
                  <TriangleAlert size={17} color="#D7473D" />
                  <Text style={{ flex: 1, fontSize: 12, color: '#B42318', marginLeft: 9 }}>Quote expired — get a fresh one before continuing.</Text>
                </View>
              ) : (
                <View style={{ borderRadius: 15, borderWidth: 1, borderColor: '#F5D08A', backgroundColor: '#FFF8EB', padding: 13, flexDirection: 'row', alignItems: 'flex-start' }}>
                  <ShieldCheck size={17} color="#B45309" />
                  <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: '#9A4D00', marginLeft: 9 }}>Verify the amount. Your gift card code is revealed only after the purchase completes.</Text>
                </View>
              )}
              {quote.simulated ? <View style={{ borderRadius: 13, backgroundColor: colors.surfaceMuted, padding: 11 }}><Text style={{ fontSize: 11, color: colors.textMuted }}>Development quote — purchase execution is simulated.</Text></View> : null}
              <Button label="Confirm purchase" size="lg" loading={buy.isPending} disabled={expired || buy.isPending} onPress={() => buy.mutate()} />
              <Button label="Edit selection" variant="outline" size="lg" onPress={() => setStep('amount')} />
            </View>
          )}
          {step === 'done' && purchase && (
            <View style={{ gap: 15 }}>
              <LinearGradient colors={['#004C3F', '#003D32']} style={{ alignItems: 'center', borderRadius: 25, padding: 26, ...elevation.raised }}>
                <View style={{ width: 70, height: 70, borderRadius: 24, backgroundColor: 'rgba(201,245,232,0.16)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={39} color="#C9F5E8" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#F4FAF7', textAlign: 'center', marginTop: 16 }}>{purchase.status === 'completed' ? 'Purchase complete' : 'Purchase submitted'}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(244,250,247,0.75)', marginTop: 6, textAlign: 'center' }}>We’ll keep you updated as your card is processed.</Text>
              </LinearGradient>
              <View style={[{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, card]}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Current status</Text>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }}>{purchase.status.replace(/_/g, ' ')}</Text>
              </View>
              <Button label="View purchase details" size="lg" onPress={() => router.replace(`/gift-cards/purchase/${purchase.purchaseId}` as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}
