import { TopFade } from '../../src/components/top-fade';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useWallets, useAssets, type Wallet } from '../../src/services/wallets';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';

const STATUS_COLOR: Record<string, string> = { active: '#12B76A', pending: '#F79009', restricted: '#F79009', suspended: '#F04438', closed: '#667085', failed: '#F04438' };

export default function WalletTab() {
  const { colors } = useTheme();
  const w = useWallets();
  const a = useAssets();
  const refreshing = w.isRefetching || a.isRefetching;
  const refresh = async () => { await Promise.all([w.refetch(), a.refetch()]); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#00B894" />} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Wallet</Text>
          <Pressable accessibilityLabel="Create wallet" onPress={() => router.push('/wallet/create' as never)}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 10 }}>
          {w.isLoading ? <LoadingState /> : w.error ? <ErrorState description="Could not load wallets — pull to retry." onRetry={refresh} /> :
            w.data?.length ? w.data.map((wallet: Wallet) => (
              <Pressable key={wallet.walletId} onPress={() => router.push(`/wallet/${wallet.walletId}` as never)}
                style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#00B894', fontWeight: '800' }}>{wallet.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{wallet.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>{wallet.type.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: STATUS_COLOR[wallet.status] ?? colors.textMuted, textTransform: 'uppercase' }}>{wallet.status}</Text>
                </View>
              </Pressable>
            )) : (
              <EmptyState title="No wallets yet" description="Create your first custodial wallet to hold assets." />
            )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Supported assets</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {a.isLoading ? <LoadingState /> : a.data?.map((asset) => (
              <View key={asset.assetId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#101B2D', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{asset.symbol.slice(0, 4)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{asset.symbol}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{asset.name}</Text>
                </View>
                {asset.networks?.length ? (
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{asset.networks.length} network{asset.networks.length > 1 ? 's' : ''}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
