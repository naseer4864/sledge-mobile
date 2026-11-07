import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useOrders, OPEN_ORDER_STATUSES } from '../../src/services/trades';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

const STATUS: Record<string, { label: string; color: string }> = {
  quoted: { label: 'Quoted', color: '#F79009' }, reserved: { label: 'Reserved', color: '#F79009' },
  submitting: { label: 'Submitting', color: '#F79009' }, submission_unknown: { label: 'Verifying', color: '#F79009' },
  accepted_by_provider: { label: 'Processing', color: '#F79009' }, partially_filled: { label: 'Partial', color: '#F79009' },
  filled: { label: 'Filled', color: '#12B76A' }, settling: { label: 'Settling', color: '#F79009' },
  pending_review: { label: 'In review', color: '#F79009' }, cancellation_pending: { label: 'Cancelling', color: '#F79009' },
  completed: { label: 'Completed', color: '#12B76A' }, rejected: { label: 'Rejected', color: '#F04438' },
  cancelled: { label: 'Cancelled', color: '#667085' }, failed: { label: 'Failed', color: '#F04438' },
};



export default function TradeHistory() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const d = useOrders();
  const a = useAssets();
  const visible = (d.data ?? []).filter((o) => (tab === 'open' ? OPEN_ORDER_STATUSES.has(o.status) : !OPEN_ORDER_STATUSES.has(o.status)));
  const fiat = a.data?.find((x) => x.type === 'fiat');
  const assetOf = (id: string) => a.data?.find((x) => x.assetId === id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Orders</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[['open', 'Open'], ['closed', 'History']].map(([k, l]) => (
            <Pressable key={k} onPress={() => setTab(k as 'open' | 'closed')} accessibilityState={{ selected: tab === k }}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: tab === k ? '#101B2D' : colors.surface, borderWidth: 1, borderColor: tab === k ? '#101B2D' : colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: tab === k ? '#fff' : colors.text }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 12, gap: 8 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load orders." onRetry={d.refetch} /> :
            visible.length ? visible.map((o) => {
              const [baseId] = o.pairId.split(':');
              const base = assetOf(baseId); const s = STATUS[o.status] ?? { label: o.status, color: colors.textMuted };
              const inA = o.side === 'buy' ? fiat : base; const outA = o.side === 'buy' ? base : fiat;
              return (
                <Pressable key={o.orderId} onPress={() => router.push(`/trade/${o.orderId}` as never)}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{o.side.toUpperCase()} {o.pairId.toUpperCase()}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {inA ? formatAtomic(o.inputAtomic, inA.decimals) : o.inputAtomic} {inA?.symbol ?? ''} → {outA ? formatAtomic(o.expectedOutputAtomic, outA.decimals) : o.expectedOutputAtomic} {outA?.symbol ?? ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                  </View>
                </Pressable>
              );
            }) : <EmptyState title="No orders" description="Buy and sell orders will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
