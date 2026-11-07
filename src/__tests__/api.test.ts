import * as SecureStore from 'expo-secure-store';
import { api, setTokens, clearTokens, getTokens, ApiError } from '../services/api';
import { logout } from '../services/auth';
import { z } from 'zod';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => { store.set(k, v); return Promise.resolve(); }),
    deleteItemAsync: jest.fn((k: string) => { store.delete(k); return Promise.resolve(); }),
    __store: store,
  };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const json = (status: number, body: unknown) => ({ ok: status < 400, status, headers: new Map([['content-type', 'application/json']]), json: () => Promise.resolve(body) } as never);

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('token persistence', () => {
  it('stores and reads tokens from SecureStore', async () => {
    await setTokens('at', 'rt');
    expect(await getTokens()).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });
  it('clears tokens', async () => {
    await setTokens('at', 'rt'); await clearTokens();
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
});

describe('refresh behavior', () => {
  const rotated = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 900 };
  it('concurrent 401s share a single refresh', async () => {
    await setTokens('old-at', 'old-rt');
    mockFetch
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(200, rotated))
      .mockResolvedValueOnce(json(200, { ok: true }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    await Promise.all([api('/api/v1/x'), api('/api/v1/y')]);
    const refreshCalls = mockFetch.mock.calls.filter((c: any[]) => String(c[0]).includes('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });
  it('rotates tokens on successful refresh', async () => {
    await setTokens('old-at', 'old-rt');
    mockFetch
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(200, rotated))
      .mockResolvedValueOnce(json(200, { ok: true }));
    await api('/api/v1/x');
    expect(await getTokens()).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
  });
  it('clears session on refresh failure', async () => {
    await setTokens('old-at', 'old-rt');
    mockFetch
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(401, { message: 'invalid' }));
    await expect(api('/api/v1/x')).rejects.toBeInstanceOf(ApiError);
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
  it('rejects malformed refresh responses and clears session', async () => {
    await setTokens('old-at', 'old-rt');
    mockFetch
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(200, { garbage: true }));
    await expect(api('/api/v1/x')).rejects.toBeInstanceOf(ApiError);
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
  it('rejects malformed data via zod schema', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockResolvedValueOnce(json(200, { notAField: 1 }));
    await expect(api('/api/v1/x', { schema: z.object({ requiredField: z.string() }) })).rejects.toThrow('Malformed response');
  });
});

describe('logout', () => {
  it('clears credentials even when backend logout fails', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    await logout();
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
  it('does not send an authorization header on logout', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await logout();
    const call = mockFetch.mock.calls.find((c) => c[0].includes('/auth/logout'));
    expect((call![1] as { headers: Record<string, string> }).headers.authorization).toBeUndefined();
  });
});
