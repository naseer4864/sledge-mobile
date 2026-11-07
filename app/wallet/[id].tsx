import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useWalletBalances, assets, wallet } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

export default function WalletDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const w = useQuery({ queryKey: ['wallet', id], queryFn: () => wallet(id!), enabled: !!id });
  const b = useWalletBalances(id);
  const a = useQuery({ queryKey: ['assets'], queryFn: assets, staleTime: 120_000 });
  const assetMap = new Map((a.data ?? []).map((x) => [x.assetId, x]));

  if (w.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (w.error || !w.data) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Wallet not found or access denied." onRetry={w.refetch} /></SafeAreaView>;

  const rows = b.data ?? [];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{w.data.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>{w.data.type.replace('_', ' ')} · {w.data.status}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' }}>Balances</Text>
          {b.isLoading ? <LoadingState /> : rows.length === 0 ? (
            <View style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
              <EmptyState title="No balances" description="This wallet holds no assets yet." />
            </View>
          ) : rows.map((r) => {
            const asset = assetMap.get(r.assetId);
            return (
              <View key={r.accountId} style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{asset?.symbol ?? r.code ?? r.assetId}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>
                    {asset ? formatAtomic(r.available, asset.decimals) : r.available}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  Reserved {asset ? formatAtomic(r.reserved, asset.decimals) : r.reserved} · Frozen {asset ? formatAtomic(r.frozen, asset.decimals) : r.frozen}
                </Text>
                {asset?.withdrawalsEnabled ? (
                  <Pressable onPress={() => {
                    const net = asset.networks?.find((n) => n.withdrawalsEnabled !== false) ?? asset.networks?.[0];
                    if (net) router.push({ pathname: '/withdraw/form', params: { walletId: w.data.walletId, assetId: asset.assetId, symbol: asset.symbol, networkId: net.networkId, networkName: net.networkName, decimals: String(asset.decimals) } } as never);
                  }} accessibilityLabel={`Send ${asset.symbol}`}
                    style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#00B894' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Send</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' }}>Receive address</Text>
          <View style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 14 }}>
            <Text style={{ fontSize: 13, color: '#B45309', lineHeight: 19 }}>
              Custodial receive addresses aren&rsquo;t exposed yet — the backend has no customer deposit-address endpoint. Deposits will activate when the custody contract lands.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
