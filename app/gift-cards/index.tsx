import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Gift, ChevronRight, HandCoins, ArrowUpRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/providers/theme';
import { useGiftProducts, useGiftPurchases, GC_STATUS } from '../../src/services/giftcards';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';

export default function GiftCards() {
  const { colors } = useTheme();
  const p = useGiftProducts();
  const pu = useGiftPurchases();
  const products = (p.data ?? []).filter((x) => x.status === 'active');
  const card = { borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={p.isRefetching} onRefresh={async () => { await p.refetch(); }} tintColor="#00B887" />} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Gift cards"
          subtitle="Buy a card or sell one for NGN"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
          right={
          <Pressable accessibilityLabel="Sell a card" onPress={() => router.push('/gift-cards/sell' as never)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00B887', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, ...elevation.floating }}>
            <HandCoins size={15} color="#fff" strokeWidth={2.4} /><Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', marginLeft: 6 }}>Sell</Text>
          </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ minHeight: 142, borderRadius: 24, padding: 20, overflow: 'hidden', ...elevation.raised }}>
            <View style={{ position: 'absolute', right: -28, top: -45, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(201,245,232,0.16)', backgroundColor: 'rgba(201,245,232,0.06)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,245,232,0.16)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)' }}>
                <Gift size={22} color="#C9F5E8" />
              </View>
              <Text style={{ color: 'rgba(244,250,247,0.68)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 11 }}>GIFT CARD STUDIO</Text>
            </View>
            <Text style={{ color: '#F4FAF7', fontSize: 19, fontWeight: '800', marginTop: 15 }}>A better way to gift</Text>
            <Text style={{ color: 'rgba(244,250,247,0.76)', fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 275 }}>
              Browse available cards, review your quote, and keep track of every purchase.
            </Text>
            <ArrowUpRight size={25} color="rgba(201,245,232,0.72)" style={{ position: 'absolute', right: 18, bottom: 18 }} />
          </LinearGradient>
        </View>

        {pu.data?.length ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Your purchases</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Recently purchased cards</Text>
              </View>
              <View style={{ backgroundColor: '#C9F5E8', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }}>
                <Text style={{ color: '#004C3F', fontSize: 10, fontWeight: '800' }}>{pu.data.length}</Text>
              </View>
            </View>
            <View style={card}>
              {pu.data.slice(0, 3).map((x, i) => (
                <View key={x.purchaseId}>
                  {i > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }} /> : null}
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/gift-cards/purchase/${x.purchaseId}` as never)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                      <Gift size={17} color="#004C3F" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>{x.productId ?? 'Gift card'}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>{x.createdAt ? new Date(x.createdAt).toLocaleDateString() : 'View order details'}</Text>
                    </View>
                    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: `${GC_STATUS[x.status]?.color ?? '#758780'}18` }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: GC_STATUS[x.status]?.color ?? colors.textMuted }}>{GC_STATUS[x.status]?.label ?? x.status.replace(/_/g, ' ')}</Text>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 5 }} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Choose a gift card</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{products.length ? `${products.length} available` : 'Browse cards available in your region'}</Text>
          </View>
          {p.isLoading ? <LoadingState /> : p.error ? <ErrorState description="Could not load gift cards." onRetry={p.refetch} /> :
            products.length ? (
              <View style={{ gap: 10 }}>
                {products.map((x, i) => (
                  <View key={x.productId} style={card}>
                    <Pressable accessibilityLabel={x.brand ?? x.name ?? 'Gift card'} onPress={() => router.push(`/gift-cards/${x.productId}` as never)}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}>
                      <LinearGradient colors={['#00D6A0', '#00B887']} style={{ width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 13, borderWidth: 1, borderColor: '#FFFFFF' }}>
                        <Gift size={21} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>{x.brand ?? x.name ?? 'Gift card'}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }} numberOfLines={1}>{x.country ? `${x.country} · ` : ''}{x.currency ?? ''}{x.denominations?.length ? ` · ${x.denominations.length} values` : ''}</Text>
                      </View>
                      <View style={{ width: 30, height: 30, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                        <ChevronRight size={17} color="#004C3F" />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : <View style={card}><EmptyState icon={<Gift size={36} color={colors.textMuted} />} title="No gift cards" description="Gift cards will appear here when available." /></View>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
