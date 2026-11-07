import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PiggyBank, Plus, ChevronRight, Clock3 } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { usePlans, useProducts } from '../../src/services/savings';
import { useAssets } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#00B894' }, funded: { label: 'Funded', color: '#00B894' },
  locked: { label: 'Locked', color: '#F79009' }, matured: { label: 'Matured', color: '#4778F5' },
  broken: { label: 'Broken early', color: '#F04438' }, closed: { label: 'Closed', color: '#667085' },
  completed: { label: 'Completed', color: '#12B76A' },
};

export default function Savings() {
  const { colors } = useTheme();
  const d = usePlans();
  const p = useProducts();
  const a = useAssets();
  const assetOf = (id: string) => a.data?.find((x) => x.assetId === id);
  const matured = (d.data ?? []).filter((x) => x.status === 'matured').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Savings</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Simulated — no yield is earned</Text>
          </View>
          <Pressable onPress={() => router.push('/savings/new' as never)} accessibilityLabel="New plan"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#00B894', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Plus size={14} color="#fff" strokeWidth={2.8} /><Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>New</Text>
          </Pressable>
        </View>

        {matured > 0 ? (
          <View style={{ marginHorizontal: 20, borderRadius: 14, backgroundColor: '#4778F5', padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{matured} plan{matured > 1 ? 's' : ''} matured</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Open a plan to redeem it.</Text>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, marginTop: 14, gap: 10 }}>
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load savings." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((x) => {
              const asset = assetOf(x.assetId); const s = STATUS[x.status] ?? { label: x.status, color: colors.textMuted };
              return (
                <Pressable key={x.planId} onPress={() => router.push(`/savings/${x.planId}` as never)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                    <PiggyBank size={20} color="#00B894" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>{x.productType.replace('_', ' ')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      {x.maturityAt ? <><Clock3 size={11} color={colors.textMuted} /><Text style={{ fontSize: 11, color: colors.textMuted }}>Matures {new Date(x.maturityAt).toLocaleDateString()}</Text></> : <Text style={{ fontSize: 11, color: colors.textMuted }}>Flexible — withdraw anytime</Text>}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{asset ? formatAtomic(x.principalAtomic, asset.decimals) : x.principalAtomic} {asset?.symbol ?? ''}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: s.color }}>{s.label}</Text>
                  </View>
                </Pressable>
              );
            }) : <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><EmptyState icon={<PiggyBank size={36} color={colors.textMuted} />} title="No savings plans" description="Lock funds in a flexible or fixed-term plan." /></View>}
        </View>

        {p.data?.length ? (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Available products</Text>
            {p.data.map((x) => (
              <Pressable key={x.productId} onPress={() => router.push(`/savings/new?product=${x.productId}` as never)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{x.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>{x.type.replace('_', ' ')}{x.termDays ? ` · ${x.termDays} days` : ''}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
