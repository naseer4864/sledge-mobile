import { Redirect, Tabs } from 'expo-router';
import { House, Wallet, ArrowLeftRight, PiggyBank, UserRound } from 'lucide-react-native';
import { colors as palette } from '../../src/theme/colors';
import { useSession } from '../../src/providers/session';

export default function TabLayout() {
  const { state } = useSession();
  if (state.kind === 'unauthenticated' || state.kind === 'mfa') return <Redirect href="/(auth)/welcome" />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.brand.emerald,
      tabBarInactiveTintColor: '#98A2B3',
      tabBarActiveBackgroundColor: '#00B89414',
      tabBarItemStyle: { borderRadius: 20, marginHorizontal: 4, marginVertical: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIconStyle: { marginTop: 2 },
      tabBarStyle: {
        position: 'absolute', bottom: 14, marginHorizontal: 16, height: 66,
        borderRadius: 28, backgroundColor: '#FFFFFF', borderTopWidth: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 10,
        borderWidth: 1, borderColor: '#E4E9F0', paddingTop: 2,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <House size={size} color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} /> }} />
      <Tabs.Screen name="trade" options={{ title: 'Trade', href: '/trade', tabBarIcon: ({ color, size }) => <ArrowLeftRight size={size} color={color} /> }} />
      <Tabs.Screen name="savings" options={{ title: 'Savings', tabBarIcon: ({ color, size }) => <PiggyBank size={size} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} /> }} />
    </Tabs>
  );
}
