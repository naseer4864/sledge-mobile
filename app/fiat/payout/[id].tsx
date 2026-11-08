import { TopFade } from '../../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/providers/theme';
import { useFiatPayouts } from '../../../src/services/fiat';
import { formatAtomic } from '../../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../../src/components/states';
import { ScreenHeader } from '../../../src/components/screen-header';
import { elevation } from '../../../src/theme/elevation';

const STATUS: Record<string, { label: string; color: string; hint: string }> = {
  requested: { label: 'Requested', color: '#F79009', hint: 'Your withdrawal was received and is being prepared.' },
  reserved: { label: 'Processing', color: '#F79009', hint: 'Funds are reserved and the transfer is being submitted to the bank.' },
  submitting: { label: 'Submitting', color: '#F79009', hint: 'The transfer is being submitted to the bank.' },
  submission_unknown: { label: 'Verifying', color: '#F79009', hint: 'We are confirming this transfer with the bank. Do not submit another withdrawal for the same transfer.' },
  settled: { label: 'Completed', color: '#12B76A', hint: 'This withdrawal was completed successfully.' },
  rejected: { label: 'Rejected', color: '#F04438', hint: 'The bank rejected this transfer. Reserved funds are released back to your balance.' },
  failed: { label: 'Failed', color: '#F04438', hint: 'This withdrawal failed. Reserved funds are released back to your balance.' },
  cancelled: { label: 'Cancelled', color: '#758780', hint: 'This withdrawal was cancelled before submission.' },
  reconciliation_required: { label: 'Checking', color: '#F79009', hint: 'This withdrawal is being reconciled with the bank — no action needed.' },
};

export default function PayoutDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useFiatPayouts(); // no single-payout endpoint — reuse the list contract (fields are identical)
  const p = d.data?.find((x) => x.payoutId === id);
  const s = p ? (STATUS[p.status] ?? { label: p.status, color: colors.textMuted, hint: '' }) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Withdrawal details" subtitle="NGN payout status" onBack={() => (router.canGoBack() ? router.back() : router.replace('/fiat/payouts' as never))} />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load this withdrawal." onRetry={d.refetch} /> :
          !p ? <EmptyState title="Not found" description="This withdrawal is not in your history." /> : (
          <View style={{ gap: 14 }}>
            <LinearGradient colors={['#00B887', '#003D32', '#004C3F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF55', ...elevation.raised }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Total debit</Text>
              <Text style={{ fontSize: 33, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'], marginTop: 8 }}>-₦{formatAtomic(p.totalReservedAtomic, 2)}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#C9F5E8', textTransform: 'uppercase', marginTop: 7 }}>{s!.label}</Text>
              {s!.hint ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 19 }}>{s!.hint}</Text> : null}
            </LinearGradient>
            <View style={{ borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, gap: 12, ...elevation.surface }}>
              {([
                ['Amount', `₦${formatAtomic(p.amountAtomic, 2)}`],
                ['Fee', `₦${formatAtomic(p.feeAtomic, 2)}`],
                ['Total debited', `₦${formatAtomic(p.totalReservedAtomic, 2)}`],
                ['Bank', p.bankName ?? p.bankCode],
                ['Account', `${p.accountName ?? ''} ${p.accountNumberMasked ?? p.accountNumber}`.trim()],
                ['Destination', p.destinationSource === 'customer_bank_account' ? 'Saved beneficiary' : 'Manual details'],
                ['Requested', p.requestedAt ? new Date(p.requestedAt).toLocaleString() : '—'],
                ['Settled', p.settledAt ? new Date(p.settledAt).toLocaleString() : '—'],
              ] as [string, string | undefined][]).filter((x): x is [string, string] => Boolean(x[1])).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
