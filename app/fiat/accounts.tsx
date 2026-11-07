import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Landmark, Plus, Star } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useSavedAccounts, setDefaultAccount, disableAccount, type SavedAccount } from '../../src/services/fiat';
import { Button } from '../../src/components/ui/button';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { ApiError } from '../../src/services/api';

const STATUS: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verified', color: '#12B76A' },
  pending_verification: { label: 'Pending', color: '#F79009' },
  under_review: { label: 'Under review', color: '#F79009' },
  verification_failed: { label: 'Failed', color: '#F04438' },
  disabled: { label: 'Disabled', color: '#667085' },
};

export default function SavedAccounts() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useSavedAccounts();
  const [err, setErr] = useState('');

  const refresh = async () => { await d.refetch(); };
  const done = () => { setErr(''); qc.invalidateQueries({ queryKey: ['saved-bank-accounts'] }); };
  const fail = (e: unknown) => setErr(e instanceof ApiError ? e.message : 'Action failed');

  const setDefault = useMutation({ mutationFn: setDefaultAccount, onSuccess: done, onError: fail });
  const disable = useMutation({ mutationFn: disableAccount, onSuccess: done, onError: fail });
  const busy = setDefault.isPending || disable.isPending;

  const confirmDisable = (a: SavedAccount) =>
    Alert.alert('Disable bank account', `Remove ${a.bankName} ${a.accountNumberMasked} from your saved accounts? You can add it again later.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disable', style: 'destructive', onPress: () => disable.mutate(a.customerBankAccountId) },
    ]);
  const confirmDefault = (a: SavedAccount) =>
    Alert.alert('Set as default', `Use ${a.bankName} ${a.accountNumberMasked} as your default withdrawal account?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Set default', onPress: () => setDefault.mutate(a.customerBankAccountId) },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: colors.text }}>Bank accounts</Text>
        <Pressable accessibilityLabel="Add bank account" onPress={() => router.push('/fiat/add-account' as never)}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={refresh} tintColor="#00B894" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {err ? <Text style={{ fontSize: 13, color: '#F04438', marginBottom: 10 }}>{err}</Text> : null}
        {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load bank accounts." onRetry={refresh} /> :
          d.data?.length ? (
            <View style={{ gap: 10 }}>
              {d.data.map((a) => {
                const s = STATUS[a.status] ?? { label: a.status, color: colors.textMuted };
                const eligible = a.status === 'verified';
                return (
                  <View key={a.customerBankAccountId} style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                        <Landmark size={18} color="#00B894" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{a.bankName}</Text>
                          {a.isDefault ? <Star size={13} color="#F79009" fill="#F79009" /> : null}
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{a.accountName} · {a.accountNumberMasked}</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{s.label}</Text>
                    </View>
                    {eligible ? (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        {!a.isDefault ? <Button label="Set default" variant="outline" size="sm" disabled={busy} onPress={() => confirmDefault(a)} /> : null}
                        <Button label="Disable" variant="outline" size="sm" disabled={busy} onPress={() => confirmDisable(a)} />
                      </View>
                    ) : a.status === 'pending_verification' ? (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>Verification is in progress — this account cannot receive withdrawals yet.</Text>
                    ) : a.status === 'under_review' ? (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>This account is under additional review and cannot receive withdrawals yet.</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState title="No bank accounts" description="Add and verify a Nigerian bank account to withdraw NGN."
              icon={<Landmark size={26} color="#00B894" />} />
          )}
        <Button label="Add a bank account" size="lg" style={{ marginTop: 16 }} onPress={() => router.push('/fiat/add-account' as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}
