import * as SecureStore from 'expo-secure-store';
import { products, createQuote, createPurchase, revealCredentials, inquire, refundPurchase, GiftPurchaseSchema, GiftProductSchema, GC_STATUS } from '../services/giftcards';
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
const PRODUCT = { productId: 'p1', brand: 'Apple', name: 'App Store', country: 'NG', currency: 'NGN', status: 'active' };
const QUOTE = { quoteId: 'q1', productId: 'p1', amountAtomic: '500000', paymentAtomic: '520000', feeAtomic: '20000', totalAtomic: '520000', expiresAt: '2026-12-01T00:00:00Z' };
const PURCHASE = { purchaseId: 'pu1', productId: 'p1', quoteId: 'q1', amountAtomic: '500000', paymentAtomic: '520000', status: 'completed' };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('catalogue', () => {
  it('parses products (bare array)', async () => {
    mockFetch.mockResolvedValueOnce(json(200, [PRODUCT]));
    const r = await products();
    expect(r[0].brand).toBe('Apple');
  });
  it('rejects malformed product', () => {
    expect(() => GiftProductSchema.parse({ nope: 1 })).toThrow();
  });
});

describe('quotes + purchases', () => {
  it('quote body + parse', async () => {
    mockFetch.mockResolvedValueOnce(json(201, QUOTE));
    const q = await createQuote('p1', '500000', 'idem-q');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ productId: 'p1', amountAtomic: '500000', idempotencyKey: 'idem-q' });
    expect(q.paymentAtomic).toBe('520000');
  });
  it('purchase body + replayed surfaced', async () => {
    mockFetch.mockResolvedValueOnce(json(201, { ...PURCHASE, replayed: true }));
    const pu = await createPurchase('q1', 'idem-p');
    expect(pu.replayed).toBe(true);
  });
  it('purchase status maps correctly', () => {
    expect(GC_STATUS.submission_unknown.label).toBe('Verifying');
    expect(GC_STATUS.completed.terminal).toBe(true);
    expect(GC_STATUS.refund_pending.terminal).toBeUndefined();
  });
  it('preserves large atomics', () => {
    const big = '9007199254740993000';
    expect(GiftPurchaseSchema.parse({ ...PURCHASE, amountAtomic: big }).amountAtomic).toBe(big);
  });
});

describe('credentials — never cached, explicit only', () => {
  it('reveal hits details route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { purchaseId: 'pu1', code: 'ABCD-1234', pin: null }));
    const c = await revealCredentials('pu1');
    expect(c.code).toBe('ABCD-1234');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/purchases/pu1/details');
  });
  it('rate-limit propagates — no retry loop', async () => {
    mockFetch.mockResolvedValueOnce(json(429, { error: 'CredentialAccessRateLimited' }));
    await expect(revealCredentials('pu1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('inquiries + refund', () => {
  it('inquiry posts to the right route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { supported: true, inquiry: { balanceAtomic: '500000', status: 'active' } }));
    const r = await inquire('pu1', 'balance');
    expect(r.supported).toBe(true);
    expect(String(mockFetch.mock.calls[0][0])).toContain('/balance-inquiry');
  });
  it('unsupported inquiry returns supported:false', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { supported: false, capability: 'redemption' }));
    const r = await inquire('pu1', 'redemption');
    expect(r.supported).toBe(false);
  });
  it('refund body + route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { action: 'created' }));
    await refundPurchase('pu1', 'idem-r');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ idempotencyKey: 'idem-r' });
    expect(String(mockFetch.mock.calls[0][0])).toContain('/refund');
  });
  it('refund on non-completed fails — not optimistic', async () => {
    mockFetch.mockResolvedValueOnce(json(400, { error: 'NotRefundable' }));
    await expect(refundPurchase('pu1', 'x')).rejects.toBeInstanceOf(ApiError);
  });
});
