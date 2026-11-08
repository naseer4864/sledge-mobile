import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useFiatDeposits } from '../../src/services/fiat';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { ScreenHeader } from '../../src/components/screen-header';

const STATUS: Record<string, { label: string; color: string }> = {
  detected: { label: 'Detected', color: '#F79009' }, verifying: { label: 'Verifying', color: '#F79009' },
  verified: { label: 'Verified', color: '#12B76A' }, credited: { label: 'Credited', color: '#12B76A' },
  under_review: { label: 'Under review', color: '#F79009' }, reversed: { label: 'Reversed', color: '#F04438' },
  failed: { label: 'Failed', color: '#F04438' }, reconciliation_required: { label: 'Reconciling', color: '#F79009' },
};

export default function FiatDeposits() {
  const { colors } = useTheme();
  const d = useFiatDeposits();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="NGN deposits" subtitle="Incoming bank transfers" />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 16, gap: 8 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load deposits." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((dep) => {
              const s = STATUS[dep.status] ?? { label: dep.status, color: colors.textMuted };
              return (
                <Pressable key={dep.fiatDepositId} accessibilityLabel={`Deposit ${formatAtomic(dep.amountAtomic, 2)} NGN`} onPress={() => router.push(`/fiat/deposit/${dep.fiatDepositId}` as never)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 16, ...elevation.surface }}>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>₦{formatAtomic(dep.amountAtomic, 2)}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{dep.detectedAt ? new Date(dep.detectedAt).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                </Pressable>
              );
            }) : <EmptyState title="No deposits" description="NGN bank transfers will appear here." />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
