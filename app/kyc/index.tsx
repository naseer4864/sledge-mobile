import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck, FileText, CircleCheck, CircleX, Clock3, RefreshCw, BadgeCheck, ScanFace, IdCard } from 'lucide-react-native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useKyc, startKyc, resubmitKyc, KYC_STATUS } from '../../src/services/kyc';
import { onboardingStatus } from '../../src/services/onboarding';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function Kyc() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useKyc();
  const { show, modal } = useFeedback();
  const s = d.data ? (KYC_STATUS[d.data.status] ?? { label: d.data.status, color: colors.textMuted, detail: 'Verification status.' }) : KYC_STATUS.not_started;

  const act = useMutation({
    mutationFn: (kind: 'start' | 'resubmit') => (kind === 'start' ? startKyc() : resubmitKyc()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
      show({ kind: 'success', title: 'Verification started', message: 'Your identity verification flow is ready. Follow the steps shown on this screen.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Could not continue', message: e instanceof ApiError ? e.message : 'Please try starting verification again.' }),
  });
  const status = d.data?.status ?? 'not_started';
  const ob = useQuery({ queryKey: ['onboarding-status'], queryFn: onboardingStatus, staleTime: 10_000 });
  const obStage = (ob.data as { stage?: string } | undefined)?.stage ?? '';
  const needsProfile = status === 'not_started' && ['account_created', 'email_verified'].includes(obStage);
  const resubmit = ['rejected', 'expired'].includes(status);

  if (d.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (d.error) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Could not load your verification status." onRetry={d.refetch} /></SafeAreaView>;

  const Icon = status === 'approved' ? CircleCheck : status === 'rejected' ? CircleX : status === 'not_started' ? ShieldCheck : Clock3;
  const card = { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', flex: 1, letterSpacing: -0.4 }}>Identity verification</Text>
        <Pressable accessibilityLabel="Refresh" onPress={() => d.refetch()} hitSlop={8}><RefreshCw size={18} color="rgba(255,255,255,0.8)" /></Pressable>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View style={[{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }, card]}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: `${s.color}14`, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={38} color={s.color} strokeWidth={2.2} />
          </View>
          <Text style={{ marginTop: 14, fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>{s.label}</Text>
          <Text style={{ marginTop: 6, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 }}>{s.detail}</Text>
        </View>

        {/* Details / requirements */}
        <View style={[{ marginTop: 14, padding: 16 }, card]}>
          {d.data?.verificationId ? (
            <View style={{ gap: 10 }}>
              {d.data.reason ? (
                <View style={{ flexDirection: 'row', gap: 10, borderRadius: 12, backgroundColor: `${s.color}0D`, borderWidth: 1, borderColor: `${s.color}33`, padding: 12 }}>
                  <FileText size={15} color={s.color} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: s.color, textTransform: 'capitalize' }}>{status === 'info_requested' ? 'Information needed' : 'Reason'}</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 19 }}>{d.data.reason}</Text>
                  </View>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>Started</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{d.data.createdAt ? new Date(d.data.createdAt).toLocaleDateString() : '—'}</Text>
              </View>
              {d.data.completedAt ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>Completed</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{new Date(d.data.completedAt).toLocaleDateString()}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>What you&apos;ll need</Text>
              {([
                [IdCard, 'Government-issued ID', 'A valid national ID, passport or driver licence'],
                [ScanFace, 'Selfie check', 'A quick face match to confirm it is really you'],
                [Clock3, 'A few minutes', 'Verification usually completes in minutes'],
              ] as const).map(([StepIcon, t, sub]) => (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#00B88714', alignItems: 'center', justifyContent: 'center' }}>
                    <StepIcon size={18} color="#00B887" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{t}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action per status */}
        <View style={{ marginTop: 18 }}>
          {needsProfile ? (
            <Button label="Complete your profile first" size="lg" onPress={() => router.push('/(auth)/onboarding' as never)} />
          ) : status === 'not_started' ? (
            <Button label="Start verification" size="lg" loading={act.isPending} onPress={() => act.mutate('start')} />
          ) : resubmit ? (
            <Button label="Resubmit verification" size="lg" loading={act.isPending} onPress={() => act.mutate('resubmit')} />
          ) : status === 'approved' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <BadgeCheck size={15} color="#12B76A" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#12B76A' }}>Your identity is verified</Text>
            </View>
          ) : ['pending', 'in_review'].includes(status) ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>This page refreshes automatically — check back soon.</Text>
          ) : null}
        </View>
      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}
