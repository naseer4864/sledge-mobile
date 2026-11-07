import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, TriangleAlert } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { usePairs, quoteTrade, createOrder, type TradeQuote, type TradeOrder } from '../../src/services/trades';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, EmptyState } from '../../src/components/states';

type Step = 'form' | 'review' | 'done';

export default function Trade() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const pairs = usePairs();
  const assets = useAssets();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [pairId, setPairId] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [order, setOrder] = useState<TradeOrder | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [err, setErr] = useState('');
  const [idem] = useState(() => Crypto.randomUUID());

  const pair = pairs.data?.find((p) => p.pairId === pairId);
  const base = pair ? assets.data?.find((a) => a.assetId === pair.baseAssetId) : undefined;
  const fiat = assets.data?.find((a) => a.type === 'fiat');
  const inAsset = side === 'buy' ? fiat : base;
  const outAsset = side === 'buy' ? base : fiat;
  const fmt = (a: string, asset?: { decimals: number } | null) => (asset ? formatAtomic(a, asset.decimals) : a);

  const [expired, setExpired] = useState(false);

  const doQuote = useMutation({
    mutationFn: () => quoteTrade(side, pairId, amount),
    onSuccess: (q) => { setQuote(q); setExpired(q.expiresAt ? new Date(q.expiresAt).getTime() < Date.now() : false); setStep('review'); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Quote failed'),
  });
  const submit = useMutation({
    mutationFn: () => createOrder(quote!.quoteId, idem),
    onSuccess: (o) => { setOrder(o); setStep('done'); qc.invalidateQueries({ queryKey: ['trading-orders'] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Order failed'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Buy & sell</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {step === 'form' && (
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['buy', 'sell'] as const).map((s) => (
                  <Pressable key={s} onPress={() => { setSide(s); setQuote(null); }} accessibilityState={{ selected: side === s }}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: side === s ? '#00B894' : colors.surface, borderWidth: 1, borderColor: side === s ? '#00B894' : colors.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: side === s ? '#fff' : colors.text, textTransform: 'capitalize' }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pair</Text>
              {pairs.isLoading ? <LoadingState /> : (pairs.data ?? []).length === 0 ? <EmptyState title="No pairs" description="No trading pairs are enabled." /> : (
                <View style={{ gap: 8 }}>
                  {(pairs.data ?? []).map((p) => {
                    const active = pairId === p.pairId;
                    const sym = assets.data?.find((a) => a.assetId === p.baseAssetId)?.symbol ?? p.baseAssetId.toUpperCase();
                    return (
                      <Pressable key={p.pairId} onPress={() => { setPairId(p.pairId); setQuote(null); }} accessibilityState={{ selected: active }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, borderColor: active ? '#00B894' : colors.border, backgroundColor: active ? '#00B8940D' : colors.surface, padding: 14 }}>
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#101B2D', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{sym.slice(0, 4)}</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{sym}/{p.quoteAssetId.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <Input label={`Amount (${inAsset?.symbol ?? 'NGN'})`} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Get quote" size="lg" loading={doQuote.isPending} disabled={!pairId || !amount || doQuote.isPending} onPress={() => { setErr(''); doQuote.mutate(); }} />
            </View>
          )}
          {step === 'review' && quote && (
            <View style={{ gap: 14 }}>
              <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
                {[
                  ['Side', side.toUpperCase()], ['Pair', pairId.toUpperCase()],
                  [`You ${side === 'buy' ? 'pay' : 'send'}`, `${fmt(quote.inputAtomic, inAsset)} ${inAsset?.symbol ?? ''}`],
                  ...(quote.executablePrice ? [['Rate', quote.executablePrice]] : []),
                  ...(quote.spreadBps ? [['Spread vs reference', `${(Number(quote.spreadBps) / 100).toFixed(2)}%`]] : []),
                  ...(quote.coinFeeAtomic ? [['Sledge fee', fmt(quote.coinFeeAtomic, outAsset)]] : []),
                  ...(quote.providerFeeAtomic && quote.providerFeeAtomic !== '0' ? [['Provider fee', fmt(quote.providerFeeAtomic, outAsset)]] : []),
                  [`You ${side === 'buy' ? 'receive' : 'get'}`, `${fmt(quote.netOutputAtomic ?? quote.expectedOutputAtomic, outAsset)} ${outAsset?.symbol ?? ''}`],
                  ...(quote.expiresAt ? [['Expires', new Date(quote.expiresAt).toLocaleTimeString()]] : []),
                ].map(([k, v]) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' }}>{v}</Text>
                  </View>
                ))}
              </View>
              {expired ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F04438', backgroundColor: '#F044380D', padding: 12 }}>
                  <Text style={{ fontSize: 12, color: '#B42318' }}>This quote has expired — get a fresh one.</Text>
                </View>
              ) : (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 12, flexDirection: 'row', gap: 8 }}>
                  <TriangleAlert size={16} color="#F79009" />
                  <Text style={{ flex: 1, fontSize: 12, color: '#B45309' }}>Verify the amounts — crypto orders execute at the quoted rate.</Text>
                </View>
              )}
              {quote.simulated ? <Text style={{ fontSize: 11, color: colors.textMuted }}>Simulated execution — development provider.</Text> : null}
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Confirm order" size="lg" loading={submit.isPending} disabled={expired || submit.isPending} onPress={() => { setErr(''); submit.mutate(); }} />
              <Button label="Back" variant="outline" size="lg" onPress={() => setStep('form')} />
            </View>
          )}
          {step === 'done' && order && (
            <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <CheckCircle2 size={48} color="#12B76A" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Order {order.status === 'completed' ? 'completed' : 'submitted'}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Status: {order.status}</Text>
              <Button label="View orders" size="lg" onPress={() => router.replace('/trade/history' as never)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
