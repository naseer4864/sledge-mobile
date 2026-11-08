import { Redirect, Stack, useSegments } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useSession } from '../../src/providers/session';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { state } = useSession();
  const segments = useSegments();
  const current = segments[segments.length - 1];
  // Post-verification the session is already authenticated; onboarding and
  // the verify screen itself must remain reachable in that state.
  const setupScreens = current === 'onboarding' || current === 'verify-email';
  if (state.kind === 'authenticated' && !setupScreens) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
