import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useFiatPayouts } from '../../src/services/fiat';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { ScreenHeader } from '../../src/components/screen-header';

const STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: '#F79009' }, reserved: { label: 'Reserved', color: '#F79009' },
  submitting: { label: 'Submitting', color: '#F79009' }, submission_unknown: { label: 'Verifying', color: '#F79009' },
  settled: { label: 'Settled', color: '#12B76A' }, rejected: { label: 'Rejected', color: '#F04438' },
  failed: { label: 'Failed', color: '#F04438' }, cancelled: { label: 'Cancelled', color: '#758780' },
  reconciliation_required: { label: 'Reconciling', color: '#F79009' },
};

export default function FiatPayouts() {
  const { colors } = useTheme();
  const d = useFiatPayouts();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="NGN payouts" subtitle="Bank transfer activity" />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 16, gap: 8 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load payouts." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((p) => {
              const s = STATUS[p.status] ?? { label: p.status, color: colors.textMuted };
              return (
                <Pressable key={p.payoutId} accessibilityLabel={`Withdrawal ${formatAtomic(p.totalReservedAtomic, 2)} NGN`} onPress={() => router.push(`/fiat/payout/${p.payoutId}` as never)} style={{ borderRadius: 18, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 16, ...elevation.surface }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>₦{formatAtomic(p.totalReservedAtomic, 2)}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{p.bankName ?? p.bankCode} · {p.accountNumberMasked ?? p.accountNumber}</Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                  </View>
                </Pressable>
              );
            }) : <EmptyState title="No payouts" description="Your NGN withdrawals will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
