import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../src/providers/theme';
import { useNotifications, markRead, markAllRead } from '../src/services/notifications';
import { LoadingState, EmptyState, ErrorState } from '../src/components/states';
import { TopFade } from '../src/components/top-fade';

const CAT: Record<string, string> = { deposit: '/deposit/history', withdrawal: '/withdraw/history', trade: '/trade/history', gift_card: '/gift-cards', savings: '/savings' };

export default function Notifications() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useNotifications();
  const mark = useMutation({ mutationFn: markRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAll = useMutation({ mutationFn: markAllRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const items = d.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const open = (n: { entityType?: string; entityId?: string; category?: string }) => {
    const route = n.entityType ? CAT[n.entityType] : n.category ? CAT[n.category] : undefined;
    if (route) router.push(route as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', flex: 1 }}>Notifications</Text>
        {unread > 0 ? (
          <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending} accessibilityLabel="Mark all read" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <CheckCheck size={15} color="#00E0A4" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#00E0A4' }}>All read</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load notifications." onRetry={d.refetch} /> :
          items.length ? items.map((n, i) => (
            <Pressable key={n.notificationId ?? n.id ?? i} onPress={() => { const id = n.notificationId ?? n.id; if (id) mark.mutate(id); open(n); }}
              style={{ flexDirection: 'row', gap: 12, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: n.read ? 'transparent' : '#00B894' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: n.read ? '500' : '700', color: colors.text }}>{n.title ?? 'Notification'}</Text>
                {n.body || n.message ? <Text style={{ marginTop: 3, fontSize: 12, color: colors.textMuted }}>{n.body ?? n.message}</Text> : null}
                <Text style={{ marginTop: 4, fontSize: 11, color: colors.textMuted }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}{n.category ? ` · ${n.category}` : ''}</Text>
              </View>
            </Pressable>
          )) : <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><EmptyState icon={<Bell size={36} color={colors.textMuted} />} title="No notifications" description="You're all caught up." /></View>}
      </ScrollView>
    </SafeAreaView>
  );
}
