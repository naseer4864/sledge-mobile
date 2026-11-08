import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, Plus,
  Wallet as WalletIcon, Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useWallets, useAssets, useWalletBalances, type Wallet } from '../../src/services/wallets';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';

const STATUS_COLOR: Record<string, string> = {
  active: '#00D6A0', pending: '#F9C46B', restricted: '#F9C46B',
  suspended: '#FF8E86', closed: '#B8C7C1', failed: '#FF8E86',
};
const WALLET_GRADIENTS: [string, string][] = [
  ['#00B887', '#003D32'],
  ['#004C3F', '#071714'],
  ['#00D6A0', '#004C3F'],
];

function WalletCard({ wallet, index, onPress }: { wallet: Wallet; index: number; onPress: () => void }) {
  const gradient = WALLET_GRADIENTS[index % WALLET_GRADIENTS.length];
  const status = STATUS_COLOR[wallet.status] ?? '#DCE8E2';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${wallet.name}`} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 278,
          minHeight: 166,
          borderRadius: 24,
          padding: 18,
          marginRight: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
          ...elevation.raised,
        }}
      >
        <View style={{ position: 'absolute', right: -38, top: -54, width: 162, height: 162, borderRadius: 81, borderWidth: 22, borderColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ position: 'absolute', right: 22, top: 26, width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(255,255,255,0.055)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 37, height: 37, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <WalletIcon size={18} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Sledge wallet</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>{wallet.name}</Text>
          </View>
          <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(5,25,20,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}>
            <Text style={{ color: status, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{wallet.status}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, textTransform: 'capitalize' }}>{wallet.type.replace('_', ' ')}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 3 }}>Open wallet</Text>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={17} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function WalletTab() {
  const { colors } = useTheme();
  const wallets = useWallets();
  const assets = useAssets();
  const primaryWallet = wallets.data?.find((wallet) => wallet.status === 'active') ?? wallets.data?.[0];
  const balances = useWalletBalances(primaryWallet?.walletId);
  const fiatAsset = assets.data?.find((asset) => asset.type === 'fiat');
  const ngnBalance = balances.data?.find((balance) => balance.assetId === fiatAsset?.assetId);
  const [masked, setMasked] = useState(false);
  const refreshing = wallets.isRefetching || assets.isRefetching || balances.isRefetching;

  const refresh = async () => {
    await Promise.all([wallets.refetch(), assets.refetch(), balances.refetch()]);
  };
  const surface = {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: colors.surface,
    ...elevation.surface,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade height={340} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#00D6A0" />}
        contentContainerStyle={{ paddingBottom: 142 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 16 }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>Your money, together</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 4 }}>Wallet</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create wallet"
            onPress={() => router.push('/wallet/create' as never)}
            style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={21} color="#FFFFFF" strokeWidth={2.3} />
          </Pressable>
        </View>

        {/* Available NGN balance — never adds unlike assets together. */}
        <View style={{ marginHorizontal: 20, marginTop: 18 }}>
          <LinearGradient
            colors={['#00D6A0', '#00B887', '#004C3F']}
            locations={[0, 0.57, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: 188,
              borderRadius: 28,
              padding: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.34)',
              ...elevation.raised,
            }}
          >
            <View style={{ position: 'absolute', right: -35, top: -64, width: 190, height: 190, borderRadius: 95, borderWidth: 26, borderColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', right: 36, top: 45, width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(116,255,221,0.08)' }} />
            <View style={{ position: 'absolute', right: 92, bottom: -88, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 31, height: 31, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}>
                  <Sparkles size={15} color="#DFFFF5" />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 0.7 }}>AVAILABLE NGN</Text>
              </View>
              <Pressable accessibilityLabel={masked ? 'Show balance' : 'Hide balance'} onPress={() => setMasked((value) => !value)} hitSlop={10}>
                {masked ? <EyeOff size={18} color="rgba(255,255,255,0.8)" /> : <Eye size={18} color="rgba(255,255,255,0.8)" />}
              </Pressable>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 22, fontVariant: ['tabular-nums'] }}>
              {masked ? '₦ ••••••' : ngnBalance && fiatAsset ? `₦${formatAtomic(ngnBalance.available, fiatAsset.decimals)}` : '₦0.00'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              {balances.isLoading ? (
                <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12 }}>Loading wallet balance…</Text>
              ) : (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    {primaryWallet ? `${balances.data?.length ?? 0} asset${balances.data?.length === 1 ? '' : 's'} in this wallet` : 'Create a wallet to get started'}
                  </Text>
                  {ngnBalance && fiatAsset ? (
                    <Text style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11, marginLeft: 9 }}>
                      · Reserved {formatAtomic(ngnBalance.reserved, fiatAsset.decimals)}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 14 }}>
          {[
            { label: 'Add money', Icon: ArrowDownLeft, href: '/deposit/select' },
            { label: 'Send', Icon: ArrowUpRight, href: '/withdraw/history' },
          ].map(({ label, Icon, href }, index) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={() => router.push(href as never)}
              style={{
                flex: 1,
                minHeight: 54,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: '#FFFFFF',
                borderRadius: 17,
                marginRight: index === 0 ? 10 : 0,
                ...elevation.surface,
              }}
            >
              <Icon size={17} color="#003D32" strokeWidth={2.4} />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginLeft: 8 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {wallets.error ? (
          <View style={{ marginHorizontal: 20, marginTop: 18 }}>
            <ErrorState description="Could not load wallets. Pull down to retry." onRetry={refresh} />
          </View>
        ) : null}

        <View style={{ marginTop: 27 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 12 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>Your wallets</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Separate places for your assets</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{wallets.data?.length ?? 0} total</Text>
          </View>
          {wallets.isLoading ? (
            <LoadingState />
          ) : wallets.data?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 7 }}>
              {wallets.data.map((wallet: Wallet, index: number) => (
                <WalletCard
                  key={wallet.walletId}
                  wallet={wallet}
                  index={index}
                  onPress={() => router.push(`/wallet/${wallet.walletId}` as never)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ marginHorizontal: 20, ...surface }}>
              <EmptyState
                title="Your first wallet starts here"
                description="Create a wallet to hold your supported assets."
                icon={<WalletIcon size={28} color="#003D32" />}
              />
            </View>
          )}
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>Explore assets</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Networks and availability</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{assets.data?.length ?? 0} assets</Text>
          </View>
          {assets.isLoading ? <LoadingState /> : assets.data?.length ? (
            <View style={{ ...surface, overflow: 'hidden' }}>
              {assets.data.map((asset, index) => (
                <View key={asset.assetId}>
                  {index > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 66 }} /> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 }}>
                    <LinearGradient
                      colors={index % 2 ? ['#004C3F', '#071714'] : ['#00B887', '#003D32']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{asset.symbol.slice(0, 4)}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{asset.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{asset.symbol} · {asset.type.replace('_', ' ')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: asset.enabled ? '#003D32' : colors.textMuted, fontSize: 10, fontWeight: '700' }}>{asset.enabled ? 'AVAILABLE' : 'OFFLINE'}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 3 }}>
                        {asset.networks?.length ?? 0} network{asset.networks?.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={surface}><EmptyState title="No assets available" description="Supported assets will appear here." /></View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
