import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const NotificationSchema = z.object({
  notificationId: z.string().optional(), id: z.string().optional(),
  title: z.string().optional(), body: z.string().optional(), message: z.string().optional(),
  category: z.string().optional(), priority: z.string().optional(),
  read: z.boolean().optional(), readAt: z.string().nullable().optional(),
  createdAt: z.string().optional(), entityType: z.string().optional(), entityId: z.string().optional(),
}).loose();
export type AppNotification = z.infer<typeof NotificationSchema>;

export const listNotifications = (params?: { cursor?: string; unread?: boolean }) => {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.unread) qs.set('unread', 'true');
  const suffix = qs.size ? `?${qs}` : '';
  return api(`/api/v1/notifications${suffix}`, { schema: z.object({ notifications: z.array(NotificationSchema).optional(), items: z.array(NotificationSchema).optional(), nextCursor: z.string().optional() }).loose() })
    .then((r) => (r as { notifications?: AppNotification[]; items?: AppNotification[] }).notifications ?? (r as { items?: AppNotification[] }).items ?? []);
};
export const unreadCount = () =>
  api('/api/v1/notifications/unread-count', { schema: z.object({ count: z.number().optional(), unread: z.number().optional() }).loose() })
    .then((r) => (r as { count?: number }).count ?? (r as { unread?: number }).unread ?? 0);
export const markRead = (id: string) => api(`/api/v1/notifications/${id}/read`, { method: 'POST', body: {} });
export const markAllRead = () => api('/api/v1/notifications/read-all', { method: 'POST', body: {} });
export const getPreferences = () => api('/api/v1/notifications/preferences', { schema: z.object({}).loose() });
export const updatePreferences = (updates: Record<string, boolean>) =>
  api('/api/v1/notifications/preferences', { method: 'PATCH', body: { updates }, schema: z.object({}).loose() });

export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: () => listNotifications(), staleTime: 15_000 });
export const useUnreadCount = () => useQuery({ queryKey: ['notifications-unread'], queryFn: unreadCount, staleTime: 30_000, refetchInterval: 60_000 });
export const useNotifPrefs = () => useQuery({ queryKey: ['notifications-prefs'], queryFn: getPreferences, staleTime: 60_000 });
