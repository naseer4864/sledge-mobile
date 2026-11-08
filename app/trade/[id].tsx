import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useOrder, CANCELLABLE_STATUSES, cancelOrder } from '../../src/services/trades';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { ApiError } from '../../src/services/api';
import { useFeedback } from '../../src/components/ui/feedback-modal';

const STATUS: Record<string, { label: string; color: string; note?: string }> = {
  quoted: { label: 'Quoted', color: '#F79009', note: 'Quote accepted, awaiting execution.' },
  reserved: { label: 'Reserved', color: '#F79009', note: 'Funds reserved for the order.' },
  submitting: { label: 'Submitting', color: '#F79009', note: 'Being sent to the execution provider.' },
  submission_unknown: { label: 'Verifying', color: '#F79009', note: 'Submission outcome uncertain — verifying safely.' },
  accepted_by_provider: { label: 'Processing', color: '#F79009', note: 'Accepted by the execution provider.' },
  partially_filled: { label: 'Partially filled', color: '#F79009', note: 'Part of the order executed — the rest is in progress.' },
  filled: { label: 'Filled', color: '#12B76A', note: 'Fully executed, awaiting settlement.' },
  settling: { label: 'Settling', color: '#F79009', note: 'Settling the trade.' },
  pending_review: { label: 'In review', color: '#F79009', note: 'Held for review — nothing has executed yet.' },
  cancellation_pending: { label: 'Cancelling', color: '#F79009', note: 'Cancellation in progress — not final yet.' },
  completed: { label: 'Completed', color: '#12B76A' },
  rejected: { label: 'Rejected', color: '#F04438', note: 'The order was declined.' },
  cancelled: { label: 'Cancelled', color: '#758780' },
  failed: { label: 'Failed', color: '#F04438', note: 'The order failed.' },
};
const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const o = useOrder(id);
  const a = useAssets();
  const d = o.data;
  const fiat = a.data?.find((x) => x.type === 'fiat');
  const base = d ? a.data?.find((x) => x.assetId === d.pairId.split(':')[0]) : undefined;
  const inA = d?.side === 'buy' ? fiat : base;
  const outA = d?.side === 'buy' ? base : fiat;

  if (o.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (o.error || !d) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Order not found." onRetry={o.refetch} /></SafeAreaView>;

  const s = STATUS[d.status] ?? { label: d.status, color: colors.textMuted };
  const executed = !!d.fillCount && d.fillCount > 0;
  const rows: [string, string][] = [
    ['Side', d.side.toUpperCase()], ['Pair', d.pairId.toUpperCase()],
    [`You ${d.side === 'buy' ? 'paid' : 'sent'}`, `${inA ? formatAtomic(d.inputAtomic, inA.decimals) : d.inputAtomic} ${inA?.symbol ?? ''}`],
    [`You ${d.side === 'buy' ? 'receive' : 'got'}`, `${outA ? formatAtomic(d.expectedOutputAtomic, outA.decimals) : d.expectedOutputAtomic} ${outA?.symbol ?? ''}`],
    ...(d.filledOutputAtomic && d.filledOutputAtomic !== '0'
      ? [['Filled', `${outA ? formatAtomic(d.filledOutputAtomic, outA.decimals) : d.filledOutputAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ...(executed && d.remainingOutputAtomic && d.remainingOutputAtomic !== '0'
      ? [['Remaining', `${outA ? formatAtomic(d.remainingOutputAtomic, outA.decimals) : d.remainingOutputAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ...(executed && d.avgPriceAtomic && d.avgPriceAtomic !== '0' ? [['Execution price', d.avgPriceAtomic] as [string, string]] : []),
    ...(executed && d.fillCount ? [['Fills', String(d.fillCount)] as [string, string]] : []),
    // settled fees only for confirmed fills — pending/partial orders never show them as final;
    // the full-order fee expectation is labeled unmistakably as estimated
    ...(executed && d.settledCoinFeeAtomic && d.settledCoinFeeAtomic !== '0' ? [['Sledge fee (settled)', `${outA ? formatAtomic(d.settledCoinFeeAtomic, outA.decimals) : d.settledCoinFeeAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ...(executed && d.settledProviderFeeAtomic && d.settledProviderFeeAtomic !== '0' ? [['Provider fee (settled)', `${outA ? formatAtomic(d.settledProviderFeeAtomic, outA.decimals) : d.settledProviderFeeAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ...(executed && d.settledTotalFeesAtomic && d.settledTotalFeesAtomic !== '0' ? [['Total fees (settled)', `${outA ? formatAtomic(d.settledTotalFeesAtomic, outA.decimals) : d.settledTotalFeesAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ...(!executed && d.expectedFeesAtomic && d.expectedFeesAtomic !== '0' ? [['Estimated fees (if fully filled)', `${outA ? formatAtomic(d.expectedFeesAtomic, outA.decimals) : d.expectedFeesAtomic} ${outA?.symbol ?? ''}`] as [string, string]] : []),
    ['Requested', fmt(d.requestedAt)], ['Completed', fmt(d.completedAt)],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Order details" subtitle={d.pairId.toUpperCase()} right={<Pressable accessibilityLabel="Refresh status" onPress={() => o.refetch()} hitSlop={8}><RefreshCw size={18} color="#FFFFFF" /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, ...elevation.surface }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
          {s.note ? <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>{s.note}</Text> : null}
          <View style={{ marginTop: 14, gap: 10 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        {[...CANCELLABLE_STATUSES].includes(d.status) ? <CancelOrder orderId={d.orderId} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CancelOrder({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const { show, modal } = useFeedback();
  const cancel = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trading-order', orderId] });
      show({ kind: 'success', title: 'Cancellation requested', message: 'The order is being cancelled. Check the order status for confirmation.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Order not cancelled', message: e instanceof ApiError ? e.message : 'Could not cancel this order. Please try again.' }),
  });
  return (
    <>
      <Pressable onPress={() => cancel.mutate()} disabled={cancel.isPending} accessibilityLabel="Cancel order"
        style={{ marginTop: 14, alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#F04438', opacity: cancel.isPending ? 0.6 : 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#F04438' }}>{cancel.isPending ? 'Cancelling…' : 'Cancel order'}</Text>
      </Pressable>
      {modal}
    </>
  );
}
