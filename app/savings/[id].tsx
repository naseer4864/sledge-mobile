import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { plan, planTxns, fundPlan, withdrawPlan, redeemPlan } from '../../src/services/savings';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { ApiError } from '../../src/services/api';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';
import { useFeedback } from '../../src/components/ui/feedback-modal';

const fmt = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : '—');

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { show, modal } = useFeedback();
  const p = useQuery({ queryKey: ['savings-plan', id], queryFn: () => plan(id!), enabled: !!id });
  const tx = useQuery({ queryKey: ['savings-txns', id], queryFn: () => planTxns(id!), enabled: !!id });
  const a = useAssets();
  const [amount, setAmount] = useState('');
  const [idem] = useState(() => Crypto.randomUUID());
  const d = p.data;
  const asset = d ? a.data?.find((x) => x.assetId === d.assetId) : undefined;
  const fa = (s?: string) => (s != null && asset ? formatAtomic(s, asset.decimals) : s ?? '—');

  const act = useMutation({
    mutationFn: (kind: 'fund' | 'withdraw' | 'redeem') =>
      kind === 'fund' ? fundPlan(id!, amount, idem) : kind === 'withdraw' ? withdrawPlan(id!, amount, idem) : redeemPlan(id!, amount, idem),
    onSuccess: (_result, kind) => {
      qc.invalidateQueries({ queryKey: ['savings-plan', id] }); qc.invalidateQueries({ queryKey: ['savings-plans'] }); qc.invalidateQueries({ queryKey: ['savings-txns', id] }); qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      setAmount('');
      const title = kind === 'fund' ? 'Funds added' : kind === 'withdraw' ? 'Withdrawal requested' : 'Funds redeemed';
      show({ kind: 'success', title, message: 'Your savings activity has been updated.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Savings action failed', message: e instanceof ApiError ? e.message : 'Could not complete this action. Please try again.' }),
  });

  if (p.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (p.error || !d) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Plan not found." onRetry={p.refetch} /></SafeAreaView>;

  const rows: [string, string][] = [
    ['Type', d.productType.replace('_', ' ')], ['Asset', asset?.symbol ?? d.assetId], ['Status', d.status],
    ['Principal', fa(d.principalAtomic)], ...(d.availableAtomic != null ? [['Available', fa(d.availableAtomic)] as [string, string]] : []),
    ...(d.lockedAtomic != null ? [['Locked', fa(d.lockedAtomic)] as [string, string]] : []),
    ['Started', fmt(d.startedAt)], ...(d.maturityAt ? [['Matures', fmt(d.maturityAt)] as [string, string]] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title={d.productType.replace('_', ' ')} subtitle={`${asset?.symbol ?? d.assetId} savings plan`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, gap: 12, ...elevation.surface }}>
          {rows.map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', textTransform: 'capitalize' }}>{v}</Text>
            </View>
          ))}
        </View>
        {d.simulated ? <Text style={{ marginTop: 8, fontSize: 11, color: colors.textMuted }}>Simulated savings — no yield is earned.</Text> : null}
        {d.status === 'active' || d.status === 'funded' ? (
          <View style={{ marginTop: 14 }}>
            <Input label={`Amount (${asset?.symbol ?? ''})`} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <Button label="Add funds" size="lg" style={{ marginTop: 10 }} loading={act.isPending} disabled={!amount || act.isPending} onPress={() => act.mutate('fund')} />
            {d.productType === 'flexible' ? <Button label="Withdraw" variant="outline" size="lg" style={{ marginTop: 8 }} disabled={!amount || act.isPending} onPress={() => act.mutate('withdraw')} /> : null}
          </View>
        ) : null}
        {d.status === 'matured' ? (
          <Button label="Redeem funds" size="lg" style={{ marginTop: 14 }} loading={act.isPending} disabled={act.isPending} onPress={() => act.mutate('redeem')} />
        ) : null}
        {d.productType === 'fixed_term' && (d.status === 'active' || d.status === 'locked') ? (
          <View style={{ marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 12 }}>
            <Text style={{ fontSize: 12, color: '#B45309', lineHeight: 17 }}>
              Early withdrawal is not available in the app yet — the backend does not expose the break terms, so the exact consequence cannot be shown before confirming. Contact support to break a fixed plan.
            </Text>
          </View>
        ) : null}
        {tx.data?.length ? (
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Activity</Text>
            {tx.data.map((t, i) => (
              <View key={t.transactionId ?? i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>{t.type ?? 'event'}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{t.amountAtomic ? fa(t.amountAtomic) : fmt(t.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}
