import * as SecureStore from 'expo-secure-store';
import { kycStatus, startKyc, resubmitKyc, KYC_STATUS } from '../services/kyc';
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
const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;
const json = (status: number, body: unknown) => ({ ok: status < 400, status, headers: new Map([['content-type', 'application/json']]), json: () => Promise.resolve(body) } as never);

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('kyc status', () => {
  it('parses full status', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { verificationId: 'v1', status: 'in_review', reason: null, createdAt: '2026-01-01', completedAt: null }));
    const r = await kycStatus();
    expect(r.status).toBe('in_review');
    expect(r.verificationId).toBe('v1');
  });
  it('parses not_started', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { status: 'not_started' }));
    expect((await kycStatus()).status).toBe('not_started');
  });
  it('status map covers all enums + unknown', () => {
    for (const s of ['not_started', 'pending', 'in_review', 'info_requested', 'approved', 'rejected', 'expired']) expect(KYC_STATUS[s]).toBeDefined();
    expect(KYC_STATUS.someUnknown).toBeUndefined();
  });
  it('terminal states flagged', () => {
    expect(KYC_STATUS.approved.terminal).toBe(true);
    expect(KYC_STATUS.pending.terminal).toBeUndefined();
  });
});

describe('start + resubmit', () => {
  it('start posts empty body', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { verificationId: 'v1', status: 'pending', reused: false }));
    const r = (await startKyc()) as { status?: string };
    expect(r.status).toBe('pending');
    expect((mockFetch.mock.calls[0][1] as { method?: string }).method).toBe('POST');
  });
  it('resubmit posts to resubmit route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { verificationId: 'v1', status: 'pending' }));
    await resubmitKyc();
    expect(String(mockFetch.mock.calls[0][0])).toContain('/kyc/resubmit');
  });
  it('resubmit on non-eligible fails', async () => {
    mockFetch.mockResolvedValueOnce(json(409, { message: 'Cannot resubmit' }));
    await expect(resubmitKyc()).rejects.toBeInstanceOf(ApiError);
  });
});
