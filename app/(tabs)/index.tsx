import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle, Path, Defs, RadialGradient, LinearGradient as SvgGrad, Stop, Ellipse, G } from 'react-native-svg';
import { router } from 'expo-router';
import { Eye, EyeOff, ArrowDown, ArrowUpRight, Landmark, ShieldCheck, ArrowRight, ChevronRight, Clock3, ReceiptText, Headset, Gift, PiggyBank, Bell } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useSession } from '../../src/providers/session';
import { useDashboard } from '../../src/services/dashboard';
import { useWallets, useWalletBalances, useAssets } from '../../src/services/wallets';
import { useBankingAccounts } from '../../src/services/fiat';
import { useUnreadCount } from '../../src/services/notifications';
import { formatAtomic } from '../../src/lib/money';
import { LoadingState, ErrorState } from '../../src/components/states';

const SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 } as const;
const QA = [
  { label: 'Add Money', href: '/deposit/select', icon: ArrowDown },
  { label: 'Send', href: '/withdraw/history', icon: ArrowUpRight },
  { label: 'Gift Cards', href: '/gift-cards', icon: Gift },
  { label: 'Savings', href: '/savings', icon: PiggyBank },
];

function HeaderGlow() {
  return (
    <Svg width="100%" height={640} preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="none">
      <Defs>
        <RadialGradient id="g1" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#004C3F" stopOpacity="0.95" /><Stop offset="0.65" stopColor="#004C3F" stopOpacity="0.55" /><Stop offset="1" stopColor="#004C3F" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="g2" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#00B887" stopOpacity="0.5" /><Stop offset="0.7" stopColor="#00B887" stopOpacity="0.22" /><Stop offset="1" stopColor="#00B887" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="g3" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#00D6A0" stopOpacity="0.3" /><Stop offset="1" stopColor="#00D6A0" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* far-right teal halo */}
      <Circle cx="118%" cy="16%" r="38%" fill="url(#g3)" />
      {/* oversized forest disc clipping top-right */}
      <Circle cx="104%" cy="-10%" r="46%" fill="url(#g1)" />
      {/* emerald disc overlapping it */}
      <Circle cx="78%" cy="8%" r="26%" fill="url(#g2)" />
      {/* left accent curve */}
      <Path d="M-40 120 C 40 160, 60 260, -30 320 L -60 340 L -60 100 Z" fill="rgba(14,89,65,0.3)" />
      {/* lower sweeps fading into page */}
      <Path d="M0 320 C 110 380, 260 300, 420 340 L 420 420 C 260 380, 110 460, 0 400 Z" fill="rgba(0,184,148,0.10)" />
      <Path d="M0 400 C 140 470, 280 390, 420 430 L 420 520 C 280 480, 140 560, 0 500 Z" fill="rgba(14,89,65,0.16)" />
    </Svg>
  );
}

function BannerArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <Defs>
        <RadialGradient id="bv1" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#004C3F" stopOpacity="1" /><Stop offset="0.7" stopColor="#004C3F" stopOpacity="0.55" /><Stop offset="1" stopColor="#004C3F" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bv2" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#00D6A0" stopOpacity="0.5" /><Stop offset="0.7" stopColor="#00D6A0" stopOpacity="0.2" /><Stop offset="1" stopColor="#00D6A0" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bv3" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#00B887" stopOpacity="0.6" /><Stop offset="1" stopColor="#00B887" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* oversized dark disc clipping the right edge */}
      <Circle cx={292} cy={22} r={100} fill="url(#bv1)" />
      {/* lighter emerald curve overlapping beneath it */}
      <Circle cx={318} cy={90} r={85} fill="url(#bv2)" />
      {/* emerald glow bottom-right, clipped by banner */}
      <Circle cx={250} cy={128} r={70} fill="url(#bv3)" />
      {/* sweeping emerald ribbon across the lower half */}
      <Path d="M150 110 C 210 55, 290 45, 340 75 L 340 118 L 150 118 Z" fill="rgba(0,184,137,0.18)" />
      {/* subtle turquoise accent high right */}
      <Circle cx={255} cy={-25} r={55} fill="rgba(0,201,167,0.16)" />
    </Svg>
  );
}

function WalletArt() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Defs>
        <SvgGrad id="wbody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#00D6A0" /><Stop offset="0.5" stopColor="#00B887" /><Stop offset="1" stopColor="#003D32" />
        </SvgGrad>
        <SvgGrad id="wback" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#004C3F" /><Stop offset="1" stopColor="#003D32" />
        </SvgGrad>
        <SvgGrad id="wflap" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00D6A0" /><Stop offset="1" stopColor="#00B887" />
        </SvgGrad>
        <RadialGradient id="wglow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#00D6A0" stopOpacity="0.45" /><Stop offset="1" stopColor="#00D6A0" stopOpacity="0" />
        </RadialGradient>
        <SvgGrad id="coin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9F5E8" /><Stop offset="1" stopColor="#00D6A0" />
        </SvgGrad>
      </Defs>
      <Ellipse cx={95} cy={112} rx={55} ry={12} fill="url(#wglow)" />
      <G rotation={-8} origin="90,72">
        <Rect x={40} y={44} width={96} height={64} rx={14} fill="url(#wback)" />
        <Rect x={30} y={52} width={96} height={58} rx={14} fill="url(#wbody)" />
        <Rect x={30} y={52} width={96} height={12} rx={6} fill="rgba(255,255,255,0.22)" />
        <Rect x={96} y={68} width={30} height={24} rx={8} fill="url(#wflap)" />
        <Circle cx={104} cy={80} r={4.5} fill="#003D32" />
      </G>
      <Circle cx={108} cy={30} r={17} fill="url(#coin)" />
      <Circle cx={108} cy={30} r={17} stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="none" />
      <Path d="M101 22 h14 M101 30 h14 M104 22 v17 M111 22 v17" stroke="#004C3F" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function Home() {
  const { colors } = useTheme();
  const { state } = useSession();
  const [masked, setMasked] = useState(false);
  const d = useDashboard();
  const wallets = useWallets();
  const balances = useWalletBalances(wallets.data?.[0]?.walletId);
  const assets = useAssets();
  const accts = useBankingAccounts();
  const unread = useUnreadCount();
  const ngnAsset = assets.data?.find((x) => x.type === 'fiat');
  const ngnRow = ngnAsset ? balances.data?.find((b) => b.assetId === ngnAsset.assetId) : undefined;
  const ngnAcct = accts.data?.find((x) => x.status === 'active') ?? accts.data?.[0];
  const user = state.kind === 'authenticated' ? state.user : null;
  const firstName = user?.firstName ?? (user?.email?.split('@')[0] ?? 'there');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const kycDone = d.kyc?.status === 'verified' || d.kyc?.status === 'approved';
  const zero = !ngnRow || ngnRow.available === '0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <LinearGradient colors={['#004C3F', '#003D32', '#F4F8F7', colors.bg]} locations={[0, 0.38, 0.7, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 620 }} />
      <HeaderGlow />
      <ScrollView refreshControl={<RefreshControl refreshing={d.refreshing} onRefresh={d.refresh} tintColor="#00B887" />} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12 }}>
          <View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{greeting},</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>{firstName} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={unread.data ? `Notifications, ${unread.data} unread` : 'Notifications'}
              onPress={() => router.push('/notifications' as never)}
              style={{ width: 46, height: 46, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} color="#FFFFFF" strokeWidth={2.1} />
              {unread.data && unread.data > 0 ? (
                <View style={{ position: 'absolute', right: -5, top: -5, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, backgroundColor: '#00D6A0', borderWidth: 2, borderColor: '#003D32', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#003D32', fontSize: 9, fontWeight: '900' }}>{unread.data > 99 ? '99+' : unread.data}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable accessibilityLabel="Account" onPress={() => router.push('/account' as never)}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{firstName[0]?.toUpperCase()}</Text>
              <View style={{ position: 'absolute', right: 1, bottom: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#00D6A0', borderWidth: 2.5, borderColor: '#003D32' }} />
            </Pressable>
          </View>
        </View>

        {/* Balance card */}
        <View style={{ marginHorizontal: 22, marginTop: 22 }}>
          <LinearGradient colors={['#004C3F', '#00B887']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 22, overflow: 'hidden', ...SHADOW, shadowOpacity: 0.18, elevation: 6 }}>
            {/* decorative curves inside the card — clipped by overflow:hidden */}
            <Svg width="100%" height="100%" viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
              <Defs>
                <RadialGradient id="cb1" cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor="#00D6A0" stopOpacity="0.4" /><Stop offset="1" stopColor="#00D6A0" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="cb2" cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor="#003D32" stopOpacity="0.8" /><Stop offset="1" stopColor="#003D32" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              {/* big emerald curve emerging bottom-right */}
              <Circle cx={350} cy={170} r={110} fill="url(#cb1)" />
              {/* darker curve overlapping from right edge */}
              <Circle cx={360} cy={60} r={85} fill="url(#cb2)" />
              {/* lighter emerald band sweeping mid-card */}
              <Path d="M200 160 C 240 90, 300 60, 360 80 L 360 170 L 200 170 Z" fill="rgba(0,224,164,0.12)" />
              {/* soft glow behind the wallet */}
              <Circle cx={300} cy={80} r={70} fill="rgba(0,224,164,0.14)" />
            </Svg>
            <View style={{ position: 'absolute', right: -4, top: -8 }}>
              <WalletArt />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Landmark size={15} strokeWidth={2.6} color="rgba(255,255,255,0.85)" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>NGN Balance</Text>
              <Pressable accessibilityLabel={masked ? 'Show balance' : 'Hide balance'} onPress={() => setMasked(!masked)} hitSlop={8} style={{ marginLeft: 2 }}>
                {masked ? <EyeOff size={15} strokeWidth={2.6} color="rgba(255,255,255,0.7)" /> : <Eye size={15} strokeWidth={2.6} color="rgba(255,255,255,0.7)" />}
              </Pressable>
            </View>
            <Text style={{ marginTop: 16, fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
              {masked ? '₦ ••••••' : `₦ ${ngnRow ? formatAtomic(ngnRow.available, ngnAsset?.decimals ?? 2) : '0.00'}`}
            </Text>
            <Text style={{ marginTop: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>
              {zero ? 'Zero Naira' : ngnAcct?.accountNumber ? `${ngnAcct.bankName ?? 'NGN'} · ${ngnAcct.accountNumber}` : `Reserved ₦${formatAtomic(ngnRow.reserved, ngnAsset?.decimals ?? 2)} · Frozen ₦${formatAtomic(ngnRow.frozen, ngnAsset?.decimals ?? 2)}`}
            </Text>
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 22, marginTop: 20, gap: 12 }}>
          {QA.map((a) => (
            <Pressable key={a.label} onPress={() => router.push(a.href as never)} accessibilityLabel={a.label}
              style={{ flex: 1, alignItems: 'center', gap: 9, paddingVertical: 16, borderRadius: 18, backgroundColor: colors.surface, ...SHADOW }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00B88714', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={19} strokeWidth={2.6} color="#00B887" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Verify banner */}
        {!kycDone ? (
          <View style={{ marginHorizontal: 22, marginTop: 18 }}>
            <LinearGradient colors={['#003D32', '#004C3F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
              <BannerArt />
              <ShieldCheck size={34} strokeWidth={2.6} color="#00D6A0" />
              <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Verify your account</Text>
                <Text style={{ marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Unlock transfers, withdrawals and higher limits.</Text>
              </View>
              <Pressable onPress={() => router.push('/kyc' as never)} accessibilityLabel="Verify"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#003D32' }}>Verify</Text>
                <ArrowRight size={14} strokeWidth={2.8} color="#003D32" />
              </Pressable>
            </LinearGradient>
          </View>
        ) : null}

        {/* NGN bank card */}
        <Pressable onPress={() => router.push('/fiat/receive' as never)} accessibilityLabel="NGN bank account"
          style={{ marginHorizontal: 22, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, backgroundColor: colors.surface, padding: 16, ...SHADOW }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B88714', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={20} strokeWidth={2.6} color="#00B887" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>NGN bank account</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Receive transfers from any Nigerian bank</Text>
          </View>
          <ChevronRight size={19} strokeWidth={2.6} color={colors.textMuted} />
        </Pressable>

        {/* Recent activity */}
        <View style={{ paddingHorizontal: 22, marginTop: 26 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Clock3 size={15} strokeWidth={2.4} color={colors.textMuted} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Recent activity</Text>
            </View>
            <Pressable onPress={() => router.push('/withdraw/history' as never)} accessibilityLabel="See all activity" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#00B887' }}>See all</Text>
              <ArrowRight size={14} strokeWidth={2.8} color="#00B887" />
            </Pressable>
          </View>
          <View style={{ marginTop: 12, borderRadius: 18, backgroundColor: colors.surface, ...SHADOW }}>
            {d.loading ? <LoadingState /> : d.error ? <ErrorState description="Could not load." onRetry={d.refresh} /> : (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#00B88712', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <ReceiptText size={26} strokeWidth={2.4} color="#00B887" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>No activity</Text>
                <Text style={{ marginTop: 4, fontSize: 12.5, color: colors.textMuted }}>Deposits and orders will appear here.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Support FAB */}
      <Pressable onPress={() => router.push('/account' as never)} accessibilityLabel="Support"
        style={{ position: 'absolute', right: 20, bottom: 96, width: 52, height: 52, borderRadius: 26, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center', ...SHADOW, shadowOpacity: 0.25, elevation: 8 }}>
        <Headset size={22} strokeWidth={2.5} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}
