import * as SecureStore from 'expo-secure-store';
import { products, plans, createPlan, fundPlan, earlyBreakPlan, SavingsPlanSchema, SavingsProductSchema } from '../services/savings';
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
const PLAN = { planId: 'sp1', productId: 'flex-ngn', productType: 'flexible', assetId: 'ngn', status: 'active', principalAtomic: '1000000', availableAtomic: '1000000', lockedAtomic: '0', withdrawnAtomic: '0', startedAt: '2026-01-01T00:00:00Z', maturityAt: null };
const PROD = { productId: 'flex-ngn', name: 'Flexible NGN', type: 'flexible', assetId: 'ngn', minimumAmount: '100' };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('schemas', () => {
  it('parses products (bare array)', async () => {
    mockFetch.mockResolvedValueOnce(json(200, [PROD]));
    const r = await products();
    expect(r[0].type).toBe('flexible');
  });
  it('parses plans list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, [PLAN]));
    const r = await plans();
    expect(r[0].principalAtomic).toBe('1000000');
  });
  it('preserves large atomic strings', () => {
    const big = '9007199254740993000';
    expect(SavingsPlanSchema.parse({ ...PLAN, principalAtomic: big }).principalAtomic).toBe(big);
  });
  it('rejects malformed plan', () => {
    expect(() => SavingsPlanSchema.parse({ nope: 1 })).toThrow();
    expect(() => SavingsProductSchema.parse({ bad: true })).toThrow();
  });
});

describe('mutations', () => {
  it('create plan body + idempotency key', async () => {
    mockFetch.mockResolvedValueOnce(json(200, PLAN));
    await createPlan('flex-ngn', undefined, 'idem-1');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ productId: 'flex-ngn', termDays: undefined, idempotencyKey: 'idem-1' });
  });
  it('fund body preserves amount string', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ok: true }));
    await fundPlan('sp1', '5000.00', 'idem-2');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body.amount).toBe('5000.00');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/savings/plans/sp1/fund');
  });
  it('early break sends confirm:true', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ok: true }));
    await earlyBreakPlan('sp1', 'idem-3');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body).confirm).toBe(true);
    expect(String(mockFetch.mock.calls[0][0])).toContain('/early-break');
  });
  it('propagates backend errors — no optimistic success', async () => {
    mockFetch.mockResolvedValueOnce(json(409, { message: 'Maturity lock active' }));
    await expect(earlyBreakPlan('sp1', 'x')).rejects.toBeInstanceOf(ApiError);
  });
});

