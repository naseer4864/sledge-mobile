import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownToLine, TriangleAlert, ShieldCheck, CircleCheck, ChevronRight, WalletCards } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/providers/theme';
import { useWallets, useAssets, type AssetNetwork } from '../../src/services/wallets';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { Button } from '../../src/components/ui/button';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';

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
  const panel = { borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title="Add money" subtitle={wallet ? `Into ${wallet.name}` : 'Choose an asset and network'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 18, overflow: 'hidden', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -28, top: -39, width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(201,245,232,0.15)', backgroundColor: 'rgba(201,245,232,0.06)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(201,245,232,0.16)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownToLine size={23} color="#C9F5E8" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: 'rgba(244,250,247,0.68)', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 }}>WALLET FUNDING</Text>
              <Text style={{ color: '#F4FAF7', fontSize: 19, fontWeight: '800', marginTop: 3 }}>Receive crypto</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(244,250,247,0.76)', fontSize: 12, lineHeight: 18, marginTop: 15 }}>
            Choose the exact asset and network your sender will use. You’ll review the deposit address before sharing it.
          </Text>
          {wallet ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' }}>
              <WalletCards size={15} color="#C9F5E8" />
              <Text style={{ color: '#C9F5E8', fontSize: 11, fontWeight: '700', marginLeft: 7 }}>Deposits will go to {wallet.name}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Choose asset & network</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>Only enabled deposit options are shown</Text>
          </View>
          <View style={{ borderRadius: 999, backgroundColor: '#C9F5E8', paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ color: '#004C3F', fontSize: 10, fontWeight: '800' }}>{choices.length}</Text>
          </View>
        </View>

        {a.isLoading ? <View style={panel}><LoadingState message="Loading deposit options…" /></View>
          : a.error ? <View style={panel}><ErrorState description="Could not load deposit options." onRetry={a.refetch} /></View>
            : choices.length === 0 ? <View style={panel}><EmptyState icon={<ArrowDownToLine size={27} color="#004C3F" />} title="No supported assets" description="No assets are enabled for deposits right now." /></View> : (
          <View style={{ gap: 10 }}>
            {choices.map((c) => {
              const active = pick?.networkAssetId === c.networkAssetId;
              return (
                <Pressable key={c.networkAssetId} onPress={() => setPick(c)} accessibilityState={{ selected: active }}
                  style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 19, borderWidth: 1.5, borderColor: active ? '#00B887' : colors.border, backgroundColor: active ? '#F0FBF7' : colors.surface, padding: 14, ...elevation.surface }}>
                  <LinearGradient colors={active ? ['#00D6A0', '#00B887'] : ['#004C3F', '#003D32']} style={{ width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FFFFFF' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{c.symbol.slice(0, 4)}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{c.symbol}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00B887', marginRight: 6 }} />
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{c.networkName}</Text>
                    </View>
                  </View>
                  {active ? (
                    <View style={{ width: 27, height: 27, borderRadius: 10, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center' }}>
                      <CircleCheck size={17} color="#004C3F" />
                    </View>
                  ) : (
                    <ChevronRight size={17} color={colors.textMuted} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {pick ? (
          <View style={{ marginTop: 14, borderRadius: 17, borderWidth: 1, borderColor: '#F5D08A', backgroundColor: '#FFF8EB', padding: 14, flexDirection: 'row', alignItems: 'flex-start' }}>
            <TriangleAlert size={18} color="#B45309" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: '#9A4D00', fontSize: 12, fontWeight: '800', marginBottom: 3 }}>Network check</Text>
              <Text style={{ fontSize: 12, color: '#9A4D00', lineHeight: 18 }}>
                Send only <Text style={{ fontWeight: '800' }}>{pick.symbol}</Text> on <Text style={{ fontWeight: '800' }}>{pick.networkName}</Text>. A different asset or network may result in permanent loss.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
          <ShieldCheck size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 10, marginLeft: 6 }}>Your deposit address is generated securely</Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button label="Continue" size="lg" disabled={!pick || !wallet} onPress={() => pick && wallet && router.push({ pathname: '/deposit/address', params: { walletId: wallet.walletId, assetId: pick.assetId, symbol: pick.symbol, networkId: pick.networkId, networkName: pick.networkName } } as never)} />
      </View>
    </SafeAreaView>
  );
}
