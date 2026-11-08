import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { z } from 'zod';

// Base URL per environment — override via EXPO_PUBLIC_API_URL.
// Android emulator uses 10.0.2.2; physical devices use the host machine's LAN IP.
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const KEYS = { access: 'coin.access', refresh: 'coin.refresh' } as const;
const TIMEOUT_MS = 15_000;

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.access), SecureStore.getItemAsync(KEYS.refresh),
  ]);
  return { accessToken, refreshToken };
}
export async function setTokens(a: string, r: string) {
  await Promise.all([SecureStore.setItemAsync(KEYS.access, a), SecureStore.setItemAsync(KEYS.refresh, r)]);
}
export async function clearTokens() {
  await Promise.all([SecureStore.deleteItemAsync(KEYS.access), SecureStore.deleteItemAsync(KEYS.refresh)]);
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) { super(message); this.name = 'ApiError'; }
}

// Single-flight refresh — concurrent 401s share one refresh request.
let refreshFlight: Promise<string> | null = null;
async function refreshOnce(): Promise<string> {
  if (!refreshFlight) {
    refreshFlight = (async () => {
      const { refreshToken } = await getTokens();
      if (!refreshToken) throw new ApiError(401, 'No refresh token');
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) { await clearTokens(); throw new ApiError(res.status, 'Session expired'); }
      const body = await res.json();
      const parsed = z.object({ accessToken: z.string(), refreshToken: z.string(), expiresIn: z.number() }).safeParse(body);
      if (!parsed.success) { await clearTokens(); throw new ApiError(500, 'Invalid refresh response'); }
      await setTokens(parsed.data.accessToken, parsed.data.refreshToken);
      return parsed.data.accessToken;
    })().finally(() => { refreshFlight = null; });
  }
  return refreshFlight;
}

export interface RequestOpts { method?: string; body?: unknown; schema?: z.ZodType; timeoutMs?: number; skipAuth?: boolean }

export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { accessToken } = await getTokens();
  const headers: Record<string, string> = { 'x-request-id': Crypto.randomUUID() };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (accessToken && !opts.skipAuth) headers.authorization = `Bearer ${accessToken}`;

  const attempt = (tok?: string) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
    const h = tok ? { ...headers, authorization: `Bearer ${tok}` } : headers;
    return fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET', headers: h, signal: ctrl.signal,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }).finally(() => clearTimeout(t));
  };

  let res = await attempt();
  if (res.status === 401 && accessToken && !opts.skipAuth) {
    try { res = await attempt(await refreshOnce()); }
    catch (e) { if (e instanceof ApiError) throw e; throw new ApiError(401, 'Session expired'); }
  }

  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : undefined;
  if (!res.ok) {
    const msg = (body as { message?: string | string[] })?.message;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : (msg ?? `Request failed (${res.status})`), body);
  }
  if (opts.schema) {
    const parsed = opts.schema.safeParse(body);
    if (!parsed.success) throw new ApiError(500, 'Malformed response');
    return parsed.data as T;
  }
  return body as T;
}
