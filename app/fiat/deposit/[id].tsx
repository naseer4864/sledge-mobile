import { TopFade } from '../../../src/components/top-fade';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/providers/theme';
import { useFiatDeposit } from '../../../src/services/fiat';
import { formatAtomic } from '../../../src/lib/money';
import { LoadingState, ErrorState } from '../../../src/components/states';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/fiat/deposits' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Deposit</Text>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {d.isLoading ? <LoadingState /> : d.error || !dep ? <ErrorState description="Could not load this deposit." onRetry={d.refetch} /> : (
          <View style={{ gap: 14 }}>
            <View style={{ alignItems: 'center', paddingVertical: 18 }}>
              <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>+₦{formatAtomic(dep.amountAtomic, 2)}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: s!.color, textTransform: 'uppercase', marginTop: 6 }}>{s!.label}</Text>
              {s!.hint ? <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19, paddingHorizontal: 16 }}>{s!.hint}</Text> : null}
            </View>
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
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
