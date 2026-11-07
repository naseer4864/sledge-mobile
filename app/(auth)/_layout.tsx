import { Redirect, Stack } from 'expo-router';
import { useTheme } from '../../src/providers/theme';
import { useSession } from '../../src/providers/session';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { state } = useSession();
  if (state.kind === 'authenticated') return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
