import { TopFade } from '../../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/providers/theme';
import { useFiatDeposit } from '../../../src/services/fiat';
import { formatAtomic } from '../../../src/lib/money';
import { LoadingState, ErrorState } from '../../../src/components/states';
import { ScreenHeader } from '../../../src/components/screen-header';
import { elevation } from '../../../src/theme/elevation';

const STATUS: Record<string, { label: string; color: string; hint: string }> = {
  detected: { label: 'Detected', color: '#F79009', hint: 'We noticed an incoming transfer and are confirming it with the bank.' },
  verifying: { label: 'Verifying', color: '#F79009', hint: 'The transfer is being verified before it is credited.' },
  verified: { label: 'Verified', color: '#12B76A', hint: 'The transfer is verified and will be credited to your NGN balance.' },
  credited: { label: 'Credited', color: '#12B76A', hint: 'This deposit has been credited to your NGN balance.' },
  under_review: { label: 'Under review', color: '#F79009', hint: 'This deposit needs a manual review — nothing is required from you.' },
  reversed: { label: 'Reversed', color: '#F04438', hint: 'This credit was reversed. Any adjustments are already reflected in your balance.' },
  failed: { label: 'Failed', color: '#F04438', hint: 'This deposit could not be completed.' },
  reconciliation_required: { label: 'Checking', color: '#F79009', hint: 'This deposit is being reconciled with the bank.' },
};

export default function DepositDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useFiatDeposit(id);
  const dep = d.data;
  const s = dep ? (STATUS[dep.status] ?? { label: dep.status, color: colors.textMuted, hint: '' }) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Deposit details" subtitle="NGN transfer status" onBack={() => (router.canGoBack() ? router.back() : router.replace('/fiat/deposits' as never))} />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {d.isLoading ? <LoadingState /> : d.error || !dep ? <ErrorState description="Could not load this deposit." onRetry={d.refetch} /> : (
          <View style={{ gap: 14 }}>
            <LinearGradient colors={['#00B887', '#003D32', '#004C3F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF55', ...elevation.raised }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Deposit amount</Text>
              <Text style={{ fontSize: 33, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'], marginTop: 8 }}>+₦{formatAtomic(dep.amountAtomic, 2)}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#C9F5E8', textTransform: 'uppercase', marginTop: 7 }}>{s!.label}</Text>
              {s!.hint ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 19 }}>{s!.hint}</Text> : null}
            </LinearGradient>
            <View style={{ borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, gap: 12, ...elevation.surface }}>
              {[
                ['Amount', `₦${formatAtomic(dep.amountAtomic, 2)}`],
                ['Credited', `₦${formatAtomic(dep.creditedAtomic, 2)}`],
                ['Currency', dep.currency],
                ['Detected', dep.detectedAt ? new Date(dep.detectedAt).toLocaleString() : '—'],
                ['Credited at', dep.creditedAt ? new Date(dep.creditedAt).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 }}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18, paddingHorizontal: 4 }}>
              Deposits are credited only after the bank transfer is verified by our payment partner — the balance you see is the authoritative state.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
