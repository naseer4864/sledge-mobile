import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from '../src/providers/session';
import { useTheme } from '../src/providers/theme';

export default function Index() {
  const { state } = useSession();
  const { colors } = useTheme();

  if (state.kind === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }
  if (state.kind === 'mfa') return <Redirect href="/(auth)/mfa" />;
  if (state.kind === 'unauthenticated') return <Redirect href="/(auth)/welcome" />;
  return <Redirect href="/(tabs)" />;
}
