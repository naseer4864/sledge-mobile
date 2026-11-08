import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../src/providers/session';
import { useTheme } from '../src/providers/theme';
import { onboardingStatus } from '../src/services/onboarding';

export default function Index() {
  const { state } = useSession();
  const { colors } = useTheme();
  const authed = state.kind === 'authenticated';
  const ob = useQuery({ queryKey: ['onboarding-status'], queryFn: onboardingStatus, enabled: authed, staleTime: 30_000 });

  if (state.kind === 'loading' || (authed && ob.isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00B887" />
      </View>
    );
  }
  if (state.kind === 'mfa') return <Redirect href="/(auth)/mfa" />;
  if (state.kind === 'unauthenticated') return <Redirect href="/(auth)/welcome" />;
  const stage = (ob.data as { stage?: string } | undefined)?.stage;
  if (['account_created', 'email_verified', 'info_requested'].includes(stage ?? '')) return <Redirect href="/(auth)/onboarding" />;
  if (['profile_submitted', 'verification_initiated', 'verification_pending', 'verification_rejected', 'restricted'].includes(stage ?? '')) {
    return <Redirect href="/kyc" />;
  }
  return <Redirect href="/(tabs)" />;
}
