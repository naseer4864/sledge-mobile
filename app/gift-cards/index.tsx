import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Gift, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../src/providers/theme';
import { useGiftProducts, useGiftPurchases } from '../../src/services/giftcards';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

export default function GiftCards() {
  const { colors } = useTheme();
  const p = useGiftProducts();
  const pu = useGiftPurchases();
  const products = (p.data ?? []).filter((x) => x.status === 'active');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScrollView refreshControl={<RefreshControl refreshing={p.isRefetching} onRefresh={async () => { await p.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Gift cards</Text>
        </View>
        {pu.data?.length ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Your purchases</Text>
            <Pressable onPress={() => router.push('/gift-cards/sell' as never)} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#00B894' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Sell a card</Text>
            </Pressable>
            </View>
            {pu.data.slice(0, 3).map((x) => (
              <View key={x.purchaseId} style={{ marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{x.productId ?? 'Gift card'}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: x.status === 'completed' || x.status === 'delivered' ? '#12B76A' : '#F79009', textTransform: 'capitalize' }}>{x.status.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {p.isLoading ? <LoadingState /> : p.error ? <ErrorState description="Could not load gift cards." onRetry={p.refetch} /> :
            products.length ? products.map((x) => (
              <Pressable key={x.productId} onPress={() => router.push(`/gift-cards/${x.productId}` as never)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={22} color="#00B894" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{x.brand ?? x.name ?? 'Gift card'}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{x.country ? `${x.country} · ` : ''}{x.currency ?? ''}{x.denominations?.length ? ` · ${x.denominations.length} options` : ''}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            )) : <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><EmptyState icon={<Gift size={36} color={colors.textMuted} />} title="No gift cards" description="Gift cards will appear here when available." /></View>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
