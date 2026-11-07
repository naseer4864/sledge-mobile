import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useWithdrawal } from '../../src/services/withdrawals';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, ErrorState } from '../../src/components/states';
import { WITHDRAWAL_STATUS } from '../../src/lib/withdrawal-status';

const mask = (a?: string | null) => (a ? (a.length > 20 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a) : '—');
const fmtTime = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function WithdrawalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const w = useWithdrawal(id);
  const a = useAssets();
  const asset = a.data?.find((x) => x.assetId === w.data?.assetId);

  if (w.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (w.error || !w.data) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Withdrawal not found." onRetry={w.refetch} /></SafeAreaView>;

  const d = w.data;
  const s = WITHDRAWAL_STATUS[d.status] ?? { label: d.status, color: colors.textMuted, note: '' };
  const rows: [string, string][] = [
    ['Asset', `${asset?.symbol ?? d.assetId} · ${d.networkId}`],
    ['Amount', `${asset ? formatAtomic(d.amountAtomic, asset.decimals) : d.amountAtomic}`],
    ['Fee', `${asset ? formatAtomic(d.feeAtomic, asset.decimals) : d.feeAtomic}`],
    ['Total debit', `${asset ? formatAtomic(d.totalReservedAtomic, asset.decimals) : d.totalReservedAtomic}`],
    ['Tx hash', mask(d.blockchainTransactionHash)],
    ['Requested', fmtTime(d.requestedAt)],
    ['Broadcast', fmtTime(d.broadcastAt)],
    ['Confirmed', fmtTime(d.confirmedAt)],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, flex: 1 }}>Withdrawal</Text>
        <Pressable accessibilityLabel="Refresh status" onPress={() => w.refetch()} hitSlop={8}><RefreshCw size={18} color={colors.textMuted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
          {s.note ? <Text style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>{s.note}</Text> : null}
          <View style={{ marginTop: 14, gap: 10 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 }} selectable={k === 'Tx hash'}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        {d.replayed ? <Text style={{ marginTop: 10, fontSize: 12, color: colors.textMuted }}>Idempotent request — no duplicate was created.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
