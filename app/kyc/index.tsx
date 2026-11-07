import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck, FileText, CircleCheck, CircleX, Clock3, RefreshCw } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useKyc, startKyc, resubmitKyc, KYC_STATUS } from '../../src/services/kyc';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

export default function Kyc() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useKyc();
  const [err, setErr] = useState('');
  const s = d.data ? (KYC_STATUS[d.data.status] ?? { label: d.data.status, color: colors.textMuted, detail: 'Verification status.' }) : KYC_STATUS.not_started;

  const act = useMutation({
    mutationFn: (kind: 'start' | 'resubmit') => (kind === 'start' ? startKyc() : resubmitKyc()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kyc-status'] }); setErr(''); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not continue'),
  });
  const status = d.data?.status ?? 'not_started';
  const resubmit = ['rejected', 'expired'].includes(status);

  if (d.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (d.error) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Could not load your verification status." onRetry={d.refetch} /></SafeAreaView>;

  const Icon = status === 'approved' ? CircleCheck : status === 'rejected' ? CircleX : status === 'not_started' ? ShieldCheck : Clock3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', flex: 1 }}>Identity verification</Text>
        <Pressable accessibilityLabel="Refresh" onPress={() => d.refetch()} hitSlop={8}><RefreshCw size={18} color="rgba(255,255,255,0.7)" /></Pressable>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 12 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: `${s.color}18`, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={40} color={s.color} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{s.label}</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, maxWidth: 300 }}>{s.detail}</Text>

          {/* Status fields */}
          {d.data?.verificationId ? (
            <View style={{ marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 8, alignSelf: 'stretch' }}>
              {d.data.reason ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <FileText size={15} color={s.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: s.color, textTransform: 'capitalize' }}>{status === 'info_requested' ? 'Information needed' : 'Reason'}</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{d.data.reason}</Text>
                  </View>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Started</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{d.data.createdAt ? new Date(d.data.createdAt).toLocaleDateString() : '—'}</Text>
              </View>
              {d.data.completedAt ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Completed</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{new Date(d.data.completedAt).toLocaleDateString()}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, alignSelf: 'stretch', gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>What we need</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                Sledge uses identity verification to keep accounts secure. Your provider may ask for a valid government ID and a quick selfie check — it usually takes a few minutes.
              </Text>
            </View>
          )}

          {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}

          {/* Action per status */}
          {status === 'not_started' ? (
            <Button label="Start verification" size="lg" style={{ alignSelf: 'stretch' }} loading={act.isPending} onPress={() => act.mutate('start')} />
          ) : resubmit ? (
            <Button label="Resubmit verification" size="lg" style={{ alignSelf: 'stretch' }} loading={act.isPending} onPress={() => act.mutate('resubmit')} />
          ) : ['pending', 'in_review'].includes(status) ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>This page refreshes automatically — check back soon.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
