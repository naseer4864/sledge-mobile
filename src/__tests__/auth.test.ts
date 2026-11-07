import * as SecureStore from 'expo-secure-store';
import { login, me, logout, register, forgotPassword } from '../services/auth';
import { setTokens, getTokens, ApiError } from '../services/api';

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
const TOKENS = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('login', () => {
  it('stores tokens and returns user on success', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...TOKENS, customer: { customerId: 'u1', email: 'a@b.co' } }));
    const res = await login('a@b.co', 'pass');
    expect(res).not.toHaveProperty('mfaRequired');
    expect(await getTokens()).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });
  it('returns mfaRequired without storing tokens', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { mfaRequired: true, mfaTicket: 'ticket-1' }));
    const res = await login('a@b.co', 'pass');
    expect(res).toMatchObject({ mfaRequired: true, mfaTicket: 'ticket-1' });
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
  it('rejects malformed login responses', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { unexpected: true }));
    await expect(login('a@b.co', 'pass')).rejects.toBeInstanceOf(ApiError);
  });
  it('surfaces server errors', async () => {
    mockFetch.mockResolvedValueOnce(json(401, { message: 'Invalid credentials' }));
    await expect(login('a@b.co', 'pass')).rejects.toThrow('Invalid credentials');
  });
});

describe('register', () => {
  it('sends the register DTO shape', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ok: true }));
    await register({ firstName: 'Ada', lastName: 'Okafor', email: 'a@b.co', password: 'Str0ng!Pass' });
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({ firstName: 'Ada', lastName: 'Okafor', email: 'a@b.co' });
    expect(body).not.toHaveProperty('confirm');
  });
});

describe('me / session restore', () => {
  it('parses the {customer} response shape', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockResolvedValueOnce(json(200, { customer: { customerId: 'u1', email: 'a@b.co', firstName: 'Ada' } }));
    const user = await me();
    expect(user.customerId).toBe('u1');
    expect(user.firstName).toBe('Ada');
  });
  it('sends the access token as a Bearer header', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockResolvedValueOnce(json(200, { customer: { customerId: 'u1', email: 'a@b.co' } }));
    await me();
    const headers = (mockFetch.mock.calls[0][1] as { headers: Record<string, string> }).headers;
    expect(headers.authorization).toBe('Bearer at');
  });
});

describe('logout', () => {
  it('clears session even when backend is unreachable', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    await logout();
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
  it('posts the refreshToken in the body without auth header', async () => {
    await setTokens('at', 'rt');
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await logout();
    const call = mockFetch.mock.calls.find((c: any[]) => String(c[0]).includes('/auth/logout'));
    expect(JSON.parse((call![1] as { body: string }).body)).toEqual({ refreshToken: 'rt' });
    expect((call![1] as { headers: Record<string, string> }).headers.authorization).toBeUndefined();
  });
});

describe('forgotPassword', () => {
  it('posts email without auth', async () => {
    mockFetch.mockResolvedValueOnce(json(200, {}));
    await forgotPassword('a@b.co');
    const call = mockFetch.mock.calls[0];
    expect(String(call[0])).toContain('/auth/password/forgot');
    expect((call[1] as { headers: Record<string, string> }).headers.authorization).toBeUndefined();
  });
});
