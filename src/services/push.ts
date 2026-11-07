import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

declare function require(name: string): unknown;
type NotificationsMod = typeof import('expo-notifications');

// Lazy module resolution — expo-notifications can't resolve in Expo Go (needs a dev build).
const loadNotifications = (): NotificationsMod | null => {
  try { return require('expo-notifications') as NotificationsMod; } catch { return null; }
};

export const PushDeviceSchema = z.object({
  deviceId: z.string().optional(), id: z.string().optional(), token: z.string().optional(),
  platform: z.string().optional(), createdAt: z.string().optional(),
}).loose();
export type PushDevice = z.infer<typeof PushDeviceSchema>;

export const registerDevice = (token: string, platform: string) =>
  api('/api/v1/push-devices', { method: 'POST', body: { token, platform }, schema: PushDeviceSchema }).then((r) => r as PushDevice);
export const devices = () =>
  api('/api/v1/push-devices', { schema: z.array(PushDeviceSchema) }).then((r) => r as PushDevice[]);
export const removeDevice = (id: string) => api(`/api/v1/push-devices/${id}`, { method: 'DELETE' });
export const getPushPrefs = () => api('/api/v1/notifications/push-preferences', { schema: z.object({}).loose() });
export const setPushPrefs = (body: Record<string, unknown>) =>
  api('/api/v1/notifications/push-preferences', { method: 'POST', body, schema: z.object({}).loose() });

export const usePushDevices = () => useQuery({ queryKey: ['push-devices'], queryFn: devices, staleTime: 300_000 });

// OS permission → Expo token → POST /push-devices, deduplicated by token.
// Never registers before auth, never throws, removes on logout.
export async function registerForPush(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const N = loadNotifications();
    if (!N) return { ok: false, reason: 'unavailable' };
    const { status } = await N.getPermissionsAsync();
    let final = status;
    if (status !== 'granted') {
      const ask = await N.requestPermissionsAsync();
      final = ask.status;
    }
    if (final !== 'granted') return { ok: false, reason: 'denied' };
    const { data } = await N.getExpoPushTokenAsync();
    const existing = await devices();
    if (existing.some((d) => d.token === data)) return { ok: true };
    await registerDevice(data, 'expo');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function unregisterForLogout(): Promise<void> {
  try {
    const N = loadNotifications();
    if (!N) return;
    const { data } = await N.getExpoPushTokenAsync();
    const list = await devices();
    const match = list.find((d) => d.token === data);
    if (match?.deviceId ?? match?.id) await removeDevice(match.deviceId ?? match.id!);
  } catch { /* never block logout */ }
}
