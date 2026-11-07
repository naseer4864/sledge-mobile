import * as SecureStore from 'expo-secure-store';
import { quoteWithdrawal, createWithdrawal, withdrawals, withdrawal, withdrawalStatus, WithdrawalSchema, QuoteSchema } from '../services/withdrawals';
import { ApiError } from '../services/api';
import { WITHDRAWAL_STATUS } from '../lib/withdrawal-status';

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
const W = { withdrawalId: 'w1', assetId: 'btc-bitcoin', networkId: 'bitcoin', amountAtomic: '1500000', feeAtomic: '5000', totalReservedAtomic: '1505000', status: 'confirming', blockchainTransactionHash: 'ab'.repeat(32) };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('quote', () => {
  it('posts the dry-run body + parses the response', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { amountAtomic: '1500000', feeAtomic: '5000', totalReservedAtomic: '1505000', feePolicyVersion: 3 }));
    const q = await quoteWithdrawal({ walletId: 'w1', assetId: 'btc-bitcoin', networkId: 'bitcoin', amount: '0.01500000' });
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ walletId: 'w1', assetId: 'btc-bitcoin', networkId: 'bitcoin', amount: '0.01500000' });
    expect(q.totalReservedAtomic).toBe('1505000');
  });
  it('preserves large atomics as strings', () => {
    const big = '9007199254740993000';
    expect(QuoteSchema.parse({ amountAtomic: big, feeAtomic: '0', totalReservedAtomic: big }).amountAtomic).toBe(big);
  });
});

describe('createWithdrawal', () => {
  const req = { walletId: 'w1', assetId: 'a', networkId: 'n', amount: '1', destinationAddress: 'bc1q...', idempotencyKey: 'idem-42' };
  it('sends address + exact idempotency key', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...W, replayed: false }));
    await createWithdrawal(req);
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body.destinationAddress).toBe('bc1q...');
    expect(body.idempotencyKey).toBe('idem-42');
  });
  it('surfaces replayed responses', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...W, replayed: true }));
    const r = await createWithdrawal(req);
    expect(r.replayed).toBe(true);
  });
  it('propagates insufficient-balance as ApiError', async () => {
    mockFetch.mockResolvedValueOnce(json(422, { message: 'Insufficient available balance' }));
    await expect(createWithdrawal(req)).rejects.toBeInstanceOf(ApiError);
  });
  it('rejects malformed responses', () => {
    expect(() => WithdrawalSchema.parse({ wrong: true })).toThrow();
  });
});

describe('history / detail / status', () => {
  it('parses the history list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { withdrawals: [W] }));
    const r = await withdrawals();
    expect(r[0].status).toBe('confirming');
  });
  it('parses the detail', async () => {
    mockFetch.mockResolvedValueOnce(json(200, W));
    const r = await withdrawal('w1');
    expect(r.amountAtomic).toBe('1500000');
    expect(r.blockchainTransactionHash).toBe('ab'.repeat(32));
  });
  it('parses the status payload', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { withdrawalId: 'w1', status: 'submission_unknown' }));
    const s = await withdrawalStatus('w1');
    expect(s.status).toBe('submission_unknown');
  });
});

describe('status map', () => {
  it('covers every backend status incl. unusual intermediates', () => {
    for (const k of ['requested','pending_review','approved','rejected','reserved','submitting','submission_unknown','broadcast','confirming','completed','failed','cancelled','reconciliation_required']) {
      expect(WITHDRAWAL_STATUS[k]).toBeDefined();
      expect(WITHDRAWAL_STATUS[k].label.length).toBeGreaterThan(0);
    }
  });
  it('refresh uses GET only — never resubmits', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { withdrawalId: 'w1', status: 'broadcast' }));
    await withdrawalStatus('w1');
    expect(mockFetch.mock.calls[0][1]?.method ?? 'GET').not.toBe('POST');
  });
});
