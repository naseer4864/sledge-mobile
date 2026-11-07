import { TopFade } from '../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/providers/theme';
import { useDeposits } from '../../src/services/deposits';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F79009' },
  confirming: { label: 'Confirming', color: '#F79009' },
  confirmed: { label: 'Confirmed', color: '#12B76A' },
  credited: { label: 'Credited', color: '#12B76A' },
  failed: { label: 'Failed', color: '#F04438' },
  reversed: { label: 'Reversed', color: '#F04438' },
};

export default function DepositHistory() {
  const { colors } = useTheme();
  const d = useDeposits();
  const a = useAssets();
  const map = new Map((a.data ?? []).map((x) => [x.assetId, x]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Deposit history</Text>
        <View style={{ marginTop: 16, gap: 8 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load deposits." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((dep) => {
              const asset = map.get(dep.assetId);
              const s = STATUS[dep.status] ?? { label: dep.status, color: colors.textMuted };
              return (
                <View key={dep.depositId} style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{asset?.symbol ?? dep.assetId}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{dep.networkId ?? ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>
                        {asset ? formatAtomic(dep.amount, asset.decimals) : dep.amount} {asset?.symbol ?? ''}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                    </View>
                  </View>
                  {dep.confirmations != null && dep.requiredConfirmations ? (
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{dep.confirmations}/{dep.requiredConfirmations} confirmations</Text>
                  ) : null}
                </View>
              );
            }) : <EmptyState title="No deposits yet" description="Your inbound crypto deposits will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
