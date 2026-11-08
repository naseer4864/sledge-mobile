import { Redirect, Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { House, Wallet, ArrowLeftRight, PiggyBank, UserRound } from 'lucide-react-native';
import { colors as palette } from '../../src/theme/colors';
import { useSession } from '../../src/providers/session';

function TabIcon({ Icon, color, focused }: { Icon: typeof House; color: ColorValue; focused: boolean }) {
  return (
    <View style={{
      width: 34, height: 28,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={21} color={color} strokeWidth={focused ? 2.5 : 1.9} />
      {focused ? <View style={{ position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: color }} /> : null}
    </View>
  );
}

export default function TabLayout() {
  const { state } = useSession();
  if (state.kind === 'unauthenticated' || state.kind === 'mfa') return <Redirect href="/(auth)/welcome" />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.brand.emerald,
      tabBarInactiveTintColor: '#98A2B3',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      tabBarItemStyle: { paddingTop: 5 },
      tabBarIconStyle: { marginTop: 0 },
      tabBarStyle: {
        position: 'absolute', bottom: 14, marginHorizontal: 16, height: 68,
        borderRadius: 24, backgroundColor: '#FFFFFF', borderTopWidth: 0,
        shadowColor: '#003D32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 18, elevation: 9,
        borderWidth: 1, borderColor: '#FFFFFF', paddingTop: 0,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon Icon={House} color={color} focused={focused} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color, focused }) => <TabIcon Icon={Wallet} color={color} focused={focused} /> }} />
      <Tabs.Screen name="trade" options={{ title: 'Trade', tabBarIcon: ({ color, focused }) => <TabIcon Icon={ArrowLeftRight} color={color} focused={focused} /> }} />
      <Tabs.Screen name="savings" options={{ title: 'Savings', tabBarIcon: ({ color, focused }) => <TabIcon Icon={PiggyBank} color={color} focused={focused} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <TabIcon Icon={UserRound} color={color} focused={focused} /> }} />
    </Tabs>
  );
}
