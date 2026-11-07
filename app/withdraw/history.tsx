import { TopFade } from '../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useWithdrawals } from '../../src/services/withdrawals';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

import { WITHDRAWAL_STATUS } from '../../src/lib/withdrawal-status';

export default function WithdrawHistory() {
  const { colors } = useTheme();
  const d = useWithdrawals();
  const a = useAssets();
  const map = new Map((a.data ?? []).map((x) => [x.assetId, x]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Withdrawals</Text>
        <View style={{ marginTop: 16, gap: 8 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load withdrawals." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((w) => {
              const asset = map.get(w.assetId);
              const s = WITHDRAWAL_STATUS[w.status] ?? { label: w.status, color: colors.textMuted };
              return (
                <Pressable key={w.withdrawalId} onPress={() => router.push(`/withdraw/${w.withdrawalId}` as never)}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{asset?.symbol ?? w.assetId}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{w.networkId}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>
                        {asset ? formatAtomic(w.totalReservedAtomic, asset.decimals) : w.totalReservedAtomic} {asset?.symbol ?? ''}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }) : <EmptyState title="No withdrawals" description="Your outbound transfers will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
