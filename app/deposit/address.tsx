import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Copy, TriangleAlert } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { listAddresses, createAddress } from '../../src/services/deposits';
import { LoadingState, ErrorState } from '../../src/components/states';

export default function DepositAddress() {
  const { walletId, assetId, symbol, networkId, networkName } = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const existing = useQuery({ queryKey: ['deposit-addresses', walletId], queryFn: () => listAddresses(walletId!), enabled: !!walletId, staleTime: 60_000 });
  const found = existing.data?.find((a) => a.assetId === assetId && a.networkId === networkId);

  const create = useMutation({
    mutationFn: () => createAddress(walletId!, assetId!, networkId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposit-addresses', walletId] }),
  });
  useEffect(() => {
    if (existing.isSuccess && !found && !create.isPending && !create.isSuccess && walletId && assetId && networkId) {
      create.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.isSuccess, found]);

  const copy = async (label: string, value: string) => {
    try { await Share.share({ message: value }); setCopied(label); setTimeout(() => setCopied(null), 1500); } catch { /* share dismissed */ }
  };

  const busy = existing.isLoading || create.isPending;
  const a = found ?? create.data;
  if (busy) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState message="Preparing your address…" /></SafeAreaView>;
  if (existing.error || create.error || !a) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Could not get a deposit address — try again." onRetry={() => create.mutate()} /></SafeAreaView>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Deposit {symbol}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{symbol} · {networkName}</Text>
          <Text style={{ marginTop: 12, fontSize: 13, fontFamily: 'monospace', color: colors.text, lineHeight: 20 }} selectable>{a.address}</Text>
          <Pressable onPress={() => copy('address', a.address)} accessibilityLabel="Copy address"
            style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#00B894' }}>
            <Copy size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{copied === 'address' ? 'Shared' : 'Copy address'}</Text>
          </Pressable>
        </View>
        {a.memo ? (
          <View style={{ marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' }}>Memo / destination tag</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 16, fontFamily: 'monospace', color: colors.text }} selectable>{a.memo}</Text>
              <Pressable onPress={() => copy('memo', a.memo!)} accessibilityLabel="Copy memo" style={{ padding: 6 }}><Copy size={16} color={colors.textMuted} /></Pressable>
            </View>
            <Text style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>Required — deposits without this tag may not be credited.</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F79009', backgroundColor: '#F790090D', padding: 14, flexDirection: 'row', gap: 10 }}>
          <TriangleAlert size={18} color="#F79009" />
          <Text style={{ flex: 1, fontSize: 13, color: '#B45309', lineHeight: 19 }}>
            Only send {symbol} on the {networkName} network to this address. Other assets or networks may be lost permanently.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
