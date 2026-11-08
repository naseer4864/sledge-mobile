import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Activity, Bell, CheckCheck, ChevronRight, Gift, Landmark, ShieldCheck, Wallet } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../src/providers/theme';
import { useNotifications, markRead, markAllRead, type AppNotification } from '../src/services/notifications';
import { LoadingState, EmptyState, ErrorState } from '../src/components/states';
import { TopFade } from '../src/components/top-fade';
import { ScreenHeader } from '../src/components/screen-header';
import { elevation } from '../src/theme/elevation';
import { useFeedback } from '../src/components/ui/feedback-modal';

const CAT: Record<string, string> = {
  deposit: '/deposit/history',
  withdrawal: '/withdraw/history',
  trade: '/trade/history',
  gift_card: '/gift-cards',
  savings: '/savings',
};

function NotificationIcon({ item }: { item: AppNotification }) {
  const category = `${item.entityType ?? ''} ${item.category ?? ''}`.toLowerCase();
  const Icon = category.includes('deposit') ? Landmark
    : category.includes('withdraw') || category.includes('wallet') ? Wallet
      : category.includes('gift') ? Gift
        : category.includes('security') || category.includes('kyc') ? ShieldCheck
          : category.includes('trade') ? Activity : Bell;
  return <Icon size={19} color="#003D32" strokeWidth={2} />;
}

export default function Notifications() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useNotifications();
  const { show, modal } = useFeedback();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const mark = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: () => show({ kind: 'error', title: 'Could not update notification', message: 'Please try again in a moment.' }),
  });
  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: () => show({ kind: 'error', title: 'Could not update notifications', message: 'Your updates could not be marked as read. Please try again.' }),
  });
  const items = d.data ?? [];
  const unread = items.filter((item) => !item.read).length;
  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items;
  const open = (item: AppNotification) => {
    const route = item.entityType ? CAT[item.entityType] : item.category ? CAT[item.category] : undefined;
    if (route) router.push(route as never);
  };
  const panel = { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader
        title="Notifications"
        subtitle="Important updates about your account"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
        right={unread > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Mark all as read" onPress={() => markAll.mutate()} disabled={markAll.isPending}
            style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCheck size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B887" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 22, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -30, top: -56, width: 150, height: 150, borderRadius: 75, borderWidth: 22, borderColor: 'rgba(255,255,255,0.07)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Bell size={20} color="#C9F5E8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>{unread ? `${unread} new update${unread === 1 ? '' : 's'}` : 'You’re all caught up'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 }}>Account activity, security and service messages</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
          {(['all', 'unread'] as const).map((key) => {
            const active = filter === key;
            const label = key === 'all' ? `All · ${items.length}` : `Unread · ${unread}`;
            return (
              <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFilter(key)}
                style={{ borderRadius: 999, borderWidth: 1, borderColor: active ? '#003D32' : colors.border, backgroundColor: active ? '#003D32' : colors.surface, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8 }}>
                <Text style={{ color: active ? '#FFFFFF' : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            );
          })}
          <View style={{ flex: 1 }} />
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{items.length} total</Text>
        </View>

        {d.isLoading ? <View style={panel}><LoadingState /></View>
          : d.error ? <View style={panel}><ErrorState description="Could not load notifications." onRetry={d.refetch} /></View>
            : visible.length ? (
              <View style={{ gap: 9 }}>
                {visible.map((item, index) => (
                  <Pressable key={item.notificationId ?? item.id ?? index}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.read ? '' : 'Unread: '}${item.title ?? 'Notification'}`}
                    onPress={() => {
                      const id = item.notificationId ?? item.id;
                      if (id && !item.read) mark.mutate(id);
                      open(item);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', borderRadius: 19, borderWidth: 1, borderColor: item.read ? '#FFFFFF' : '#B6E8D8', backgroundColor: colors.surface, padding: 15, ...elevation.surface }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: item.read ? colors.surfaceMuted : '#C9F5E8', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <NotificationIcon item={item} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: item.read ? '600' : '800', lineHeight: 19 }}>{item.title ?? 'Notification'}</Text>
                        {!item.read ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#00B887', marginTop: 5, marginLeft: 8 }} /> : null}
                      </View>
                      {item.body || item.message ? <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{item.body ?? item.message}</Text> : null}
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 7 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}
                        {item.category ? `  ·  ${item.category.replace(/_/g, ' ')}` : ''}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 5, marginTop: 12 }} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={panel}>
                <EmptyState
                  icon={<Bell size={28} color="#003D32" />}
                  title={filter === 'unread' ? 'No unread updates' : 'No notifications yet'}
                  description={filter === 'unread' ? 'You’re up to date.' : 'Account and service updates will appear here.'}
                />
              </View>
            )}
      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}
