import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { RefreshCw, ArrowUpRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/providers/theme';
import { useWithdrawal } from '../../src/services/withdrawals';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, ErrorState } from '../../src/components/states';
import { WITHDRAWAL_STATUS } from '../../src/lib/withdrawal-status';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';

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
      <TopFade />
      <ScreenHeader title="Withdrawal" subtitle={`${asset?.symbol ?? d.assetId} · ${d.networkId}`} right={<Pressable accessibilityLabel="Refresh status" onPress={() => w.refetch()} hitSlop={8}><RefreshCw size={18} color="#FFFFFF" /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 16, overflow: 'hidden', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -24, top: -34, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(201,245,232,0.07)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.13)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(201,245,232,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={21} color="#C9F5E8" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>WITHDRAWAL STATUS</Text>
              <Text style={{ color: '#F4FAF7', fontSize: 19, fontWeight: '800', marginTop: 3 }}>{s.label}</Text>
            </View>
            <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(201,245,232,0.15)' }}>
              <Text style={{ color: '#C9F5E8', fontSize: 10, fontWeight: '800' }}>LIVE STATUS</Text>
            </View>
          </View>
          {s.note ? <Text style={{ marginTop: 14, fontSize: 12, lineHeight: 18, color: 'rgba(244,250,247,0.76)' }}>{s.note}</Text> : null}
        </LinearGradient>
        <View style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', ...elevation.surface }}>
          <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceMuted }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}>Total debit</Text>
            <Text style={{ color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 5, fontVariant: ['tabular-nums'] }}>
              {asset ? formatAtomic(d.totalReservedAtomic, asset.decimals) : d.totalReservedAtomic}
              <Text style={{ color: '#004C3F', fontSize: 14 }}> {asset?.symbol ?? ''}</Text>
            </Text>
          </View>
          <View style={{ padding: 18 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 14 }}>Transfer details</Text>
            <View style={{ gap: 14 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{k}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'right', flexShrink: 1 }} selectable={k === 'Tx hash'}>{v}</Text>
              </View>
            ))}
            </View>
          </View>
        </View>
        {d.replayed ? (
          <View style={{ marginTop: 13, padding: 13, borderRadius: 15, backgroundColor: '#C9F5E8', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#004C3F', fontSize: 12, lineHeight: 18 }}>This was a repeated request. No duplicate withdrawal was created.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
