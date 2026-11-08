import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Copy, TriangleAlert } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/providers/theme';
import { listAddresses, createAddress } from '../../src/services/deposits';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { Button } from '../../src/components/ui/button';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function DepositAddress() {
  const { walletId, assetId, symbol, networkId, networkName } = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { show, modal } = useFeedback();
  const [copied, setCopied] = useState<string | null>(null);

  const existing = useQuery({ queryKey: ['deposit-addresses', walletId], queryFn: () => listAddresses(walletId!), enabled: !!walletId, staleTime: 60_000 });
  const found = existing.data?.find((a) => a.assetId === assetId && a.networkId === networkId);

  const create = useMutation({
    mutationFn: () => createAddress(walletId!, assetId!, networkId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposit-addresses', walletId] }),
    onError: () => show({ kind: 'error', title: 'Address unavailable', message: 'Could not prepare a deposit address. Check your connection and try again.' }),
  });
  useEffect(() => {
    if (existing.isSuccess && !found && !create.isPending && !create.isSuccess && walletId && assetId && networkId) {
      create.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.isSuccess, found]);

  const copy = async (label: string, value: string) => {
    try { await Clipboard.setStringAsync(value); setCopied(label); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard unavailable */ }
  };

  const busy = existing.isLoading || create.isPending;
  const a = found ?? create.data;
  if (busy) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState message="Preparing your address…" /></SafeAreaView>;
  if (existing.error || create.error || !a) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Could not get a deposit address — try again." onRetry={() => create.mutate()} />{modal}</SafeAreaView>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader title={`Deposit ${symbol}`} subtitle={`${networkName} network`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderRadius: 22, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 18, ...elevation.surface }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{symbol} · {networkName}</Text>
          <Text style={{ marginTop: 12, fontSize: 13, fontFamily: 'monospace', color: colors.text, lineHeight: 21, backgroundColor: colors.surfaceMuted, borderRadius: 13, padding: 13 }} selectable>{a.address}</Text>
          <Button label={copied === 'address' ? 'Copied' : 'Copy address'} size="lg" onPress={() => copy('address', a.address)} style={{ marginTop: 14 }} />
        </View>
        {a.memo ? (
          <View style={{ marginTop: 14, borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, padding: 16, ...elevation.surface }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' }}>Memo / destination tag</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 16, fontFamily: 'monospace', color: colors.text }} selectable>{a.memo}</Text>
              <Pressable onPress={() => copy('memo', a.memo!)} accessibilityLabel="Copy memo" style={{ padding: 6 }}><Copy size={16} color={colors.textMuted} /></Pressable>
            </View>
            <Text style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>Required — deposits without this tag may not be credited.</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F0D7A8', backgroundColor: '#FFF9EC', padding: 14, flexDirection: 'row', gap: 10 }}>
          <TriangleAlert size={18} color="#F79009" />
          <Text style={{ flex: 1, fontSize: 13, color: '#B45309', lineHeight: 19 }}>
            Only send {symbol} on the {networkName} network to this address. Other assets or networks may be lost permanently.
          </Text>
        </View>
      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}
