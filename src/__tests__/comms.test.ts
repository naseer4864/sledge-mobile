import * as SecureStore from 'expo-secure-store';
import { listNotifications, unreadCount, markRead, markAllRead, updatePreferences } from '../services/notifications';
import { tickets, createTicket, replyTicket, TICKET_STATUS } from '../services/support';
import { conversations, messages, sendMessage } from '../services/chat';
import { registerDevice, removeDevice, registerForPush, getPushPrefs, setPushPrefs } from '../services/push';
import { ApiError } from '../services/api';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => { store.set(k, v); return Promise.resolve(); }),
    deleteItemAsync: jest.fn((k: string) => { store.delete(k); return Promise.resolve(); }),
    __store: store,
  };
});
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[t1]' })),
}));
const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;
const json = (status: number, body: unknown) => ({ ok: status < 400, status, headers: new Map([['content-type', 'application/json']]), json: () => Promise.resolve(body) } as never);

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('notifications', () => {
  it('parses list + unread count', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { notifications: [{ notificationId: 'n1', title: 'Deposit', read: false }] }));
    mockFetch.mockResolvedValueOnce(json(200, { count: 3 }));
    expect((await listNotifications())[0].title).toBe('Deposit');
    expect(await unreadCount()).toBe(3);
  });
  it('mark read posts to the right route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await markRead('n1');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/notifications/n1/read');
  });
  it('read-all posts to read-all', async () => {
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await markAllRead();
    expect(String(mockFetch.mock.calls[0][0])).toContain('/read-all');
  });
  it('prefs update patches updates body', async () => {
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await updatePreferences({ marketing: false });
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ updates: { marketing: false } });
  });
});

describe('support tickets', () => {
  it('list + create + reply routes', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { items: [{ ticketId: 't1', subject: 'Help', status: 'open' }] }));
    expect((await tickets())[0].subject).toBe('Help');
    mockFetch.mockResolvedValueOnce(json(201, { action: 'created', ticket: { ticketId: 't2', subject: 'New', status: 'open' } }));
    expect((await createTicket('New issue', 'Description here', 'payments', 'idem-t')).ticketId).toBe('t2');
    expect(String(mockFetch.mock.calls[1][0])).toContain('/support/tickets');
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await replyTicket('t1', 'Reply body');
    expect(String(mockFetch.mock.calls[2][0])).toContain('/tickets/t1/messages');
  });
  it('status map covers all statuses', () => {
    for (const s of ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened']) expect(TICKET_STATUS[s]).toBeDefined();
  });
});

describe('live chat', () => {
  it('conversations + messages + send routes', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { items: [{ conversationId: 'c1', status: 'waiting' }] }));
    expect((await conversations())[0].status).toBe('waiting');
    mockFetch.mockResolvedValueOnce(json(200, { items: [{ body: 'hi', senderType: 'customer' }] }));
    expect((await messages('c1'))[0].body).toBe('hi');
    mockFetch.mockResolvedValueOnce(json(200, { action: 'sent', message: { body: 'Hello', senderType: 'customer' } }));
    expect((await sendMessage('c1', 'Hello')).body).toBe('Hello');
    expect(String(mockFetch.mock.calls[2][0])).toContain('/messages');
  });
});

describe('push devices', () => {
  it('register + remove', async () => {
    mockFetch.mockResolvedValueOnce(json(201, { deviceId: 'd1', token: 'ExponentPushToken[x]' }));
    const d = await registerDevice('ExponentPushToken[x]', 'ios');
    expect(d.deviceId).toBe('d1');
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await removeDevice('d1');
    expect((mockFetch.mock.calls[1][1] as { method?: string }).method).toBe('DELETE');
  });
});

describe('push registration lifecycle', () => {
  it('registerForPush registers when granted', async () => {
    mockFetch.mockResolvedValueOnce(json(200, []));
    mockFetch.mockResolvedValueOnce(json(201, { deviceId: 'd1', token: 'ExponentPushToken[t1]' }));
    const r = await registerForPush();
    expect(r.ok).toBe(true);
    expect(String(mockFetch.mock.calls[1][0])).toContain('/push-devices');
  });
  it('skips registration when token already exists', async () => {
    mockFetch.mockResolvedValueOnce(json(200, [{ deviceId: 'd1', token: 'ExponentPushToken[t1]' }]));
    const r = await registerForPush();
    expect(r.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it('returns denied without registering', async () => {
    const N = jest.requireMock('expo-notifications') as typeof import('expo-notifications');
    (N.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (N.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const r = await registerForPush();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('denied');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('push permission + preferences UX', () => {
  it('registerForPush asks permission only via explicit call', async () => {
    const N = jest.requireMock('expo-notifications') as typeof import('expo-notifications');
    mockFetch.mockResolvedValueOnce(json(200, []));
    mockFetch.mockResolvedValueOnce(json(201, { deviceId: 'd1' }));
    (N.requestPermissionsAsync as jest.Mock).mockClear();
    await registerForPush();
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled(); // already granted in mock — no ask
    expect(N.getPermissionsAsync).toHaveBeenCalled();
  });
  it('getPushPrefs loads backend values', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { transactions: true, security: false }));
    const r = await getPushPrefs();
    expect((r as { transactions?: boolean }).transactions).toBe(true);
    expect((r as { security?: boolean }).security).toBe(false);
  });
  it('setPushPrefs posts the updates body', async () => {
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await setPushPrefs({ transactions: false });
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ transactions: false });
    expect(String(mockFetch.mock.calls[0][0])).toContain('/push-preferences');
  });
  it('save failure propagates — no optimistic success', async () => {
    mockFetch.mockResolvedValueOnce(json(500, { message: 'server error' }));
    await expect(setPushPrefs({ transactions: false })).rejects.toBeInstanceOf(ApiError);
  });
});
