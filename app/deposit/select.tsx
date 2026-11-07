import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TriangleAlert } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useWallets, useAssets, type AssetNetwork } from '../../src/services/wallets';
import { LoadingState, EmptyState } from '../../src/components/states';
import { Button } from '../../src/components/ui/button';

type Pick_ = { assetId: string; symbol: string; networkAssetId: string; networkId: string; networkName: string };

export default function DepositSelect() {
  const { walletId } = useLocalSearchParams<{ walletId: string }>();
  const { colors } = useTheme();
  const w = useWallets();
  const a = useAssets();
  const [pick, setPick] = useState<Pick_ | null>(null);
  const wallet = w.data?.find((x) => x.walletId === walletId) ?? w.data?.[0];

  const choices: Pick_[] = (a.data ?? [])
    .filter((x) => x.enabled && x.depositsEnabled)
    .flatMap((x) => (x.networks ?? []).filter((n) => n.depositsEnabled !== false)
      .map((n: AssetNetwork) => ({ assetId: x.assetId, symbol: x.symbol, networkAssetId: n.networkAssetId, networkId: n.networkId, networkName: n.networkName })));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Add money</Text>
          {wallet ? <Text style={{ fontSize: 12, color: colors.textMuted }}>To {wallet.name}</Text> : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select asset + network</Text>
        {a.isLoading ? <LoadingState /> : choices.length === 0 ? <EmptyState title="No supported assets" description="No assets are enabled for deposits right now." /> : (
          <View style={{ marginTop: 10, gap: 8 }}>
            {choices.map((c) => {
              const active = pick?.networkAssetId === c.networkAssetId;
              return (
                <Pressable key={c.networkAssetId} onPress={() => setPick(c)} accessibilityState={{ selected: active }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, borderColor: active ? '#00B894' : colors.border, backgroundColor: active ? '#00B8940D' : colors.surface, padding: 14 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#101B2D', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{c.symbol.slice(0, 4)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{c.symbol}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{c.networkName}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {pick && (
          <View style={{ marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 14, flexDirection: 'row', gap: 10 }}>
            <TriangleAlert size={18} color="#F79009" />
            <Text style={{ flex: 1, fontSize: 13, color: '#B45309', lineHeight: 19 }}>
              Send only <Text style={{ fontWeight: '700' }}>{pick.symbol}</Text> on the <Text style={{ fontWeight: '700' }}>{pick.networkName}</Text> network to the address on the next screen. Sending a different asset or network may result in permanent loss.
            </Text>
          </View>
        )}
        <Button label="Continue" size="lg" disabled={!pick || !wallet} onPress={() => pick && wallet && router.push({ pathname: '/deposit/address', params: { walletId: wallet.walletId, assetId: pick.assetId, symbol: pick.symbol, networkId: pick.networkId, networkName: pick.networkName } } as never)} style={{ marginTop: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
