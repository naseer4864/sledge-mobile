import * as SecureStore from 'expo-secure-store';
import { pairs, quoteTrade, createOrder, orders, order, cancelOrder, OPEN_ORDER_STATUSES, CANCELLABLE_STATUSES, TradeQuoteSchema, TradeOrderSchema } from '../services/trades';
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
const QUOTE = { quoteId: 'q1', pairId: 'btc:ngn', side: 'buy', inputAtomic: '50000000', expectedOutputAtomic: '25000', executablePrice: '5000000', coinFeeAtomic: '5000', expiresAt: '2026-12-01T00:00:00Z' };
const ORDER = { orderId: 'o1', pairId: 'btc:ngn', side: 'buy', inputAtomic: '50000000', expectedOutputAtomic: '25000', status: 'completed' };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('pairs', () => {
  it('parses a bare array', async () => {
    mockFetch.mockResolvedValueOnce(json(200, [{ pairId: 'btc:ngn', baseAssetId: 'btc', quoteAssetId: 'ngn' }]));
    const r = await pairs();
    expect(r[0].pairId).toBe('btc:ngn');
  });
});

describe('quotes', () => {
  it('posts buy quote body + parses', async () => {
    mockFetch.mockResolvedValueOnce(json(200, QUOTE));
    const q = await quoteTrade('buy', 'btc:ngn', '500.00');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ pairId: 'btc:ngn', amount: '500.00' });
    expect(q.expectedOutputAtomic).toBe('25000');
    expect(q.expiresAt).toBe('2026-12-01T00:00:00Z');
  });
  it('posts sell quote to the sell route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...QUOTE, side: 'sell' }));
    await quoteTrade('sell', 'btc:ngn', '0.001');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/quotes/sell');
  });
  it('preserves large atomics', () => {
    const big = '9007199254740993000';
    expect(TradeQuoteSchema.parse({ ...QUOTE, inputAtomic: big }).inputAtomic).toBe(big);
  });
  it('rejects malformed quote', () => {
    expect(() => TradeQuoteSchema.parse({ bad: true })).toThrow();
  });
});

describe('orders', () => {
  it('posts quoteId + idempotencyKey', async () => {
    mockFetch.mockResolvedValueOnce(json(200, ORDER));
    await createOrder('q1', 'idem-7');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ quoteId: 'q1', idempotencyKey: 'idem-7' });
  });
  it('parses order history', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { orders: [ORDER] }));
    const r = await orders();
    expect(r[0].status).toBe('completed');
  });
  it('propagates backend errors', async () => {
    mockFetch.mockResolvedValueOnce(json(422, { message: 'Quote expired' }));
    await expect(createOrder('q1')).rejects.toBeInstanceOf(ApiError);
  });
  it('rejects malformed order', () => {
    expect(() => TradeOrderSchema.parse({ nope: 1 })).toThrow();
  });
  it('parses order detail incl. filled + intermediate statuses', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...ORDER, status: 'partially_filled', filledOutputAtomic: '10000' }));
    const o = await order('o1');
    expect(o.status).toBe('partially_filled');
    expect(o.filledOutputAtomic).toBe('10000');
  });
  it('status refresh is GET-only — never resubmits', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { ...ORDER, status: 'submitting' }));
    await order('o1');
    expect(mockFetch.mock.calls[0][1]?.method ?? 'GET').not.toBe('POST');
  });
});

describe('open/history classification', () => {
  const ALL = ['quoted','reserved','submitting','submission_unknown','accepted_by_provider','partially_filled','filled','settling','pending_review','cancellation_pending','completed','rejected','cancelled','failed'];
  it('every backend status lands in exactly one tab', () => {
    for (const s of ALL) expect(typeof OPEN_ORDER_STATUSES.has(s)).toBe('boolean');
    expect(ALL.filter((s) => !OPEN_ORDER_STATUSES.has(s)).sort()).toEqual(['cancelled','completed','failed','rejected']);
  });
  it('filled + settling stay open until terminal', () => {
    expect(OPEN_ORDER_STATUSES.has('filled')).toBe(true);
    expect(OPEN_ORDER_STATUSES.has('settling')).toBe(true);
  });
});

describe('cancellation', () => {
  it('cancellable set matches intended statuses', () => {
    // mirrors backend customer-cancel eligibility exactly (quoted|reserved)
    expect([...CANCELLABLE_STATUSES].sort()).toEqual(['quoted','reserved']);
    expect(CANCELLABLE_STATUSES.has('completed')).toBe(false);
    expect(CANCELLABLE_STATUSES.has('partially_filled')).toBe(false);
  });
  it('posts to the cancel route', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { orderId: 'o1', status: 'cancelled' }));
    await cancelOrder('o1');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/trading/orders/o1/cancel');
    expect((mockFetch.mock.calls[0][1] as { method?: string }).method).toBe('POST');
  });
  it('propagates cancel failure — never marks cancelled locally', async () => {
    mockFetch.mockResolvedValueOnce(json(409, { message: 'Order already filled' }));
    await expect(cancelOrder('o1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('CS.3 transparency fields', () => {
  it('parses indicative price, spread, fees, net output and limits on a quote', () => {
    const r = TradeQuoteSchema.parse({
      ...QUOTE, inputAssetId: 'ngn', outputAssetId: 'btc',
      indicativePrice: '5000000', spreadBps: '0', providerFeeAtomic: '0',
      netOutputAtomic: '20000', totalInputAtomic: '50000000',
      limits: { minimumOrderAmount: '1000', maximumOrderAmount: '50000000000', minimumBaseQuantity: '100', maximumBaseQuantity: '1000000000' },
    });
    expect(r.spreadBps).toBe('0');
    expect(r.limits?.minimumOrderAmount).toBe('1000');
    expect(r.netOutputAtomic).toBe('20000');
  });
  it('works when spread fields are absent (no reference price)', () => {
    const r = TradeQuoteSchema.parse({ ...QUOTE });
    expect(r.indicativePrice).toBeUndefined();
    expect(r.spreadBps).toBeUndefined();
    expect(r.netOutputAtomic).toBeUndefined();
  });
  it('parses settled execution details on an order', () => {
    const r = TradeOrderSchema.parse({
      ...ORDER, inputAssetId: 'ngn', outputAssetId: 'btc',
      filledOutputAtomic: '20000', settledInputAtomic: '50000000',
      remainingOutputAtomic: '0', avgPriceAtomic: '5000000',
      coinFeeAtomic: '5000', providerFeeAtomic: '0', expectedFeesAtomic: '5000', fillCount: 1,
      settledCoinFeeAtomic: '5000', settledProviderFeeAtomic: '0', settledTotalFeesAtomic: '5000',
    });
    expect(r.avgPriceAtomic).toBe('5000000');
    expect(r.expectedFeesAtomic).toBe('5000');
    expect(r.settledTotalFeesAtomic).toBe('5000');
    expect(r.fillCount).toBe(1);
  });
  it('pending order carries no settlement fields', () => {
    const r = TradeOrderSchema.parse({ ...ORDER, status: 'reserved', fillCount: 0, settledInputAtomic: '0', filledOutputAtomic: '0', remainingOutputAtomic: '25000' });
    expect(r.fillCount).toBe(0);
    expect(r.settledInputAtomic).toBe('0');
  });
});
