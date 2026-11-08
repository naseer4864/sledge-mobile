import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Wallet as WalletIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useWalletBalances, assets, wallet } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';

export default function WalletDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const w = useQuery({ queryKey: ['wallet', id], queryFn: () => wallet(id!), enabled: !!id });
  const b = useWalletBalances(id);
  const a = useQuery({ queryKey: ['assets'], queryFn: assets, staleTime: 120_000 });
  const assetMap = new Map((a.data ?? []).map((asset) => [asset.assetId, asset]));
  const rows = b.data ?? [];
  const walletIsActive = w.data?.status === 'active';
  const panel = {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: colors.surface,
    ...elevation.surface,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader
        title={w.data?.name ?? 'Wallet details'}
        subtitle={w.data ? `${w.data.type.replace('_', ' ')} wallet` : 'Your asset balances'}
      />
      {w.isLoading ? (
        <LoadingState message="Opening your wallet…" />
      ) : w.error || !w.data ? (
        <ErrorState description="Wallet not found or access denied." onRetry={w.refetch} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#00B887', '#003D32', '#004C3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: 146,
              borderRadius: 25,
              padding: 19,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              ...elevation.raised,
            }}
          >
            <View style={{ position: 'absolute', right: -34, top: -59, width: 170, height: 170, borderRadius: 85, borderWidth: 24, borderColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 39, height: 39, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                <WalletIcon size={19} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Wallet status</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 3, textTransform: 'capitalize' }}>{w.data.status}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600' }}>{rows.length} assets</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: 12, marginTop: 15 }}>
              Balances stay separated by asset. Reserved and frozen funds are shown independently below.
            </Text>
          </LinearGradient>

          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/deposit/select', params: { walletId: w.data.walletId } } as never)}
              style={{ flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: '#FFFFFF', marginRight: 10, ...elevation.surface }}
            >
              <ArrowDownLeft size={17} color="#003D32" />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginLeft: 8 }}>Add money</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/withdraw/history' as never)}
              style={{ flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: '#FFFFFF', ...elevation.surface }}
            >
              <ArrowUpRight size={17} color="#003D32" />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginLeft: 8 }}>Send</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 27, marginBottom: 11 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>Asset balances</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Available funds and holds</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{rows.length} total</Text>
          </View>

          {b.isLoading ? <LoadingState message="Loading balances…" /> : b.error ? (
            <View style={panel}><ErrorState description="Could not load balances." onRetry={b.refetch} /></View>
          ) : rows.length === 0 ? (
            <View style={panel}><EmptyState title="No balances yet" description="Assets received into this wallet will appear here." icon={<WalletIcon size={27} color="#003D32" />} /></View>
          ) : (
            <View style={{ ...panel, overflow: 'hidden' }}>
              {rows.map((row, index) => {
                const asset = assetMap.get(row.assetId);
                const canSend = walletIsActive && asset?.withdrawalsEnabled;
                return (
                  <View key={row.accountId}>
                    {index > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}>
                      <LinearGradient
                        colors={index % 2 ? ['#004C3F', '#071714'] : ['#00B887', '#003D32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FFFFFF80' }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{asset?.symbol.slice(0, 4) ?? row.code?.slice(0, 4) ?? '?'}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{asset?.name ?? row.code ?? row.assetId}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{asset?.symbol ?? row.code ?? row.assetId}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                          Reserved {asset ? formatAtomic(row.reserved, asset.decimals) : row.reserved}
                          {'  ·  '}
                          Frozen {asset ? formatAtomic(row.frozen, asset.decimals) : row.frozen}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                          {asset ? formatAtomic(row.available, asset.decimals) : row.available}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>Available</Text>
                        {canSend ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Send ${asset.symbol}`}
                            onPress={() => {
                              const network = asset.networks?.find((item) => item.withdrawalsEnabled !== false) ?? asset.networks?.[0];
                              if (network) router.push({ pathname: '/withdraw/form', params: { walletId: w.data.walletId, assetId: asset.assetId, symbol: asset.symbol, networkId: network.networkId, networkName: network.networkName, decimals: String(asset.decimals) } } as never);
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, borderRadius: 999, backgroundColor: '#C9F5E8', paddingHorizontal: 9, paddingVertical: 5 }}
                          >
                            <Text style={{ color: '#003D32', fontSize: 10, fontWeight: '800' }}>Send</Text>
                            <ChevronRight size={12} color="#003D32" />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#F0D7A8', backgroundColor: '#FFF9EC', padding: 15 }}>
            <Text style={{ color: '#855A17', fontSize: 13, fontWeight: '700' }}>Receive addresses</Text>
            <Text style={{ color: '#8C6A35', fontSize: 12, lineHeight: 18, marginTop: 4 }}>
              Crypto receive addresses are not available for customer wallets yet. Do not send funds to an address from another service.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
