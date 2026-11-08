import { TopFade } from '../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowUpRight, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useWithdrawals } from '../../src/services/withdrawals';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

import { WITHDRAWAL_STATUS } from '../../src/lib/withdrawal-status';
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';

export default function WithdrawHistory() {
  const { colors } = useTheme();
  const d = useWithdrawals();
  const a = useAssets();
  const map = new Map((a.data ?? []).map((x) => [x.assetId, x]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Withdrawals" subtitle="Outbound crypto activity" />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderRadius: 23, backgroundColor: '#004C3F', padding: 19, marginBottom: 20, overflow: 'hidden', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -26, top: -34, width: 132, height: 132, borderRadius: 66, backgroundColor: 'rgba(201,245,232,0.08)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.12)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(201,245,232,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)' }}>
              <ArrowUpRight size={21} color="#C9F5E8" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'rgba(244,250,247,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>TRANSFER ACTIVITY</Text>
              <Text style={{ color: '#F4FAF7', fontSize: 20, fontWeight: '800', marginTop: 3 }}>Your withdrawals</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(244,250,247,0.72)', fontSize: 12, lineHeight: 18, marginTop: 14 }}>
            Track processing, network confirmations, and completed transfers.
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Recent activity</Text>
        <View style={{ gap: 10 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load withdrawals." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((w) => {
              const asset = map.get(w.assetId);
              const s = WITHDRAWAL_STATUS[w.status] ?? { label: w.status, color: colors.textMuted };
              return (
                <Pressable key={w.withdrawalId} onPress={() => router.push(`/withdraw/${w.withdrawalId}` as never)}
                  style={{ borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 15, flexDirection: 'row', alignItems: 'center', ...elevation.surface }}>
                  <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <ArrowUpRight size={20} color="#004C3F" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{asset?.symbol ?? w.assetId}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 7 }}>· {w.networkId}</Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: s.color, marginTop: 5 }}>{s.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
                      {asset ? formatAtomic(w.totalReservedAtomic, asset.decimals) : w.totalReservedAtomic}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>{asset?.symbol ?? ''}</Text>
                  </View>
                  <ChevronRight size={17} color={colors.textMuted} style={{ marginLeft: 4 }} />
                </Pressable>
              );
            }) : <EmptyState title="No withdrawals" description="Your outbound transfers will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
