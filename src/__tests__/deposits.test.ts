import * as SecureStore from 'expo-secure-store';
import { listAddresses, createAddress, deposits, depositStatus, DepositAddressSchema, DepositSchema } from '../services/deposits';
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
const ADDR = { addressId: 'ad1', assetId: 'btc-bitcoin', networkId: 'bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', memo: null, status: 'active' };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('address schema', () => {
  it('accepts a valid address', () => {
    const a = DepositAddressSchema.parse(ADDR);
    expect(a.addressId).toBe('ad1');
    expect(a.memo).toBeNull();
  });
  it('memo is optional/nullable', () => {
    expect(DepositAddressSchema.parse({ ...ADDR, memo: '12345' }).memo).toBe('12345');
    expect(DepositAddressSchema.parse({ ...ADDR, memo: undefined }).memo).toBeUndefined();
  });
  it('rejects malformed address', () => {
    expect(() => DepositAddressSchema.parse({ addressId: 5 })).toThrow();
  });
});

describe('deposit schema', () => {
  const DEP = { depositId: 'd1', assetId: 'btc-bitcoin', networkId: 'bitcoin', amount: '150000000', txHash: 'ab'.repeat(32), confirmations: 3, requiredConfirmations: 6, status: 'confirming' };
  it('accepts a valid deposit', () => { expect(DepositSchema.parse(DEP).amount).toBe('150000000'); });
  it('preserves exact atomic amount as string', () => {
    const big = '9007199254740993000';
    expect(DepositSchema.parse({ ...DEP, amount: big }).amount).toBe(big);
  });
  it('rejects malformed deposit', () => { expect(() => DepositSchema.parse({ bad: true })).toThrow(); });
});

describe('listAddresses / createAddress', () => {
  it('parses a list response', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { addresses: [ADDR] }));
    const r = await listAddresses('w1');
    expect(r).toHaveLength(1);
    expect(r[0].address).toContain('bc1q');
  });
  it('sends correct create body + parses response', async () => {
    mockFetch.mockResolvedValueOnce(json(201, ADDR));
    const r = await createAddress('w1', 'btc-bitcoin', 'bitcoin');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ assetId: 'btc-bitcoin', networkId: 'bitcoin' });
    expect(r.addressId).toBe('ad1');
  });
  it('propagates API failure', async () => {
    mockFetch.mockResolvedValueOnce(json(403, { message: 'Wallet not owned' }));
    await expect(createAddress('w1', 'x', 'y')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('deposits history', () => {
  const DEP = { depositId: 'd1', assetId: 'btc-bitcoin', networkId: 'bitcoin', amount: '150000000', status: 'confirmed', confirmations: 6, requiredConfirmations: 6 };
  it('parses the list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { deposits: [DEP] }));
    const r = await deposits();
    expect(r[0].depositId).toBe('d1');
    expect(r[0].status).toBe('confirmed');
  });
  it('passes the limit param', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { deposits: [] }));
    await deposits(10);
    expect(String(mockFetch.mock.calls[0][0])).toContain('limit=10');
  });
  it('same asset symbol on multiple networks parses distinctly', async () => {
    const a = { ...DEP, depositId: 'd1', networkId: 'ethereum' };
    const b = { ...DEP, depositId: 'd2', networkId: 'tron' };
    mockFetch.mockResolvedValueOnce(json(200, { deposits: [a, b] }));
    const r = await deposits();
    expect(r.map((x) => x.networkId)).toEqual(['ethereum', 'tron']);
  });
  it('depositStatus parses status payload', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { status: 'confirming', confirmations: 2 }));
    const s = await depositStatus('d1');
    expect(s.status).toBe('confirming');
  });
  it('rejects malformed list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { deposits: [{ nope: 1 }] }));
    await expect(deposits()).rejects.toThrow('Malformed response');
  });
});
