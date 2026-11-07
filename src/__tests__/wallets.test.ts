import * as SecureStore from 'expo-secure-store';
import { wallets, wallet, balances, assets, createWallet } from '../services/wallets';
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
const WALLET = { walletId: 'w1', name: 'Main', type: 'custodial', status: 'active', createdAt: '2026-01-01T00:00:00Z' };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('wallet list', () => {
  it('parses a valid wallet list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { wallets: [WALLET, { ...WALLET, walletId: 'w2', name: 'Savings' }] }));
    const r = await wallets();
    expect(r).toHaveLength(2);
    expect(r[0].walletId).toBe('w1');
    expect(r[0].status).toBe('active');
  });
  it('rejects a malformed wallet response', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { wallets: [{ bogus: true }] }));
    await expect(wallets()).rejects.toThrow('Malformed response');
  });
});

describe('wallet detail', () => {
  it('parses a valid wallet', async () => {
    mockFetch.mockResolvedValueOnce(json(200, WALLET));
    const w = await wallet('w1');
    expect(w.type).toBe('custodial');
    expect(w.name).toBe('Main');
  });
  it('rejects malformed detail', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { wrong: 'shape' }));
    await expect(wallet('w1')).rejects.toThrow('Malformed response');
  });
});

describe('balances', () => {
  it('parses Decimal128 strings as exact strings', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { walletId: 'w1', balances: [{ accountId: 'a1', assetId: 'btc', available: '150000000', reserved: '5000000', frozen: '0' }] }));
    const b = await balances('w1');
    expect(b[0].available).toBe('150000000');
    expect(b[0].reserved).toBe('5000000');
    expect(b[0].frozen).toBe('0');
  });
  it('keeps large atomic balances without float loss', async () => {
    const big = '9007199254740993000'; // > Number.MAX_SAFE_INTEGER
    mockFetch.mockResolvedValueOnce(json(200, { walletId: 'w1', balances: [{ accountId: 'a1', assetId: 'eth', available: big, reserved: '0', frozen: '0' }] }));
    const b = await balances('w1');
    expect(b[0].available).toBe(big);
    expect(typeof b[0].available).toBe('string');
  });
  it('keeps available/reserved/frozen distinct', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { walletId: 'w1', balances: [{ accountId: 'a1', assetId: 'ngn', available: '100', reserved: '50', frozen: '10' }] }));
    const b = await balances('w1');
    expect(b[0].available).not.toBe(b[0].reserved);
    expect(b[0].reserved).not.toBe(b[0].frozen);
  });
});

describe('assets', () => {
  const ASSET = { assetId: 'btc-bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'native_crypto', decimals: 8, enabled: true, depositsEnabled: true, withdrawalsEnabled: true,
    networks: [{ networkAssetId: 'na1', networkId: 'bitcoin', networkName: 'Bitcoin', contractAddress: null }] };
  const TOKEN = { ...ASSET, assetId: 'usdt-ethereum', symbol: 'USDT', name: 'Tether', type: 'token', decimals: 6,
    networks: [{ networkAssetId: 'na2', networkId: 'ethereum', networkName: 'Ethereum', contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }] };

  it('parses asset-specific decimals', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { assets: [ASSET, TOKEN] }));
    const a = await assets();
    expect(a[0].decimals).toBe(8);
    expect(a[1].decimals).toBe(6);
  });
  it('parses multiple networks for the same symbol', async () => {
    const multi = { ...TOKEN, networks: [TOKEN.networks![0], { networkAssetId: 'na3', networkId: 'tron', networkName: 'Tron', contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' }] };
    mockFetch.mockResolvedValueOnce(json(200, { assets: [multi] }));
    const a = await assets();
    expect(a[0].symbol).toBe('USDT');
    expect(a[0].networks).toHaveLength(2);
    expect(a[0].networks![1].networkName).toBe('Tron');
  });
  it('handles contractAddress null vs present', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { assets: [ASSET, TOKEN] }));
    const a = await assets();
    expect(a[0].networks![0].contractAddress).toBeNull();
    expect(a[1].networks![0].contractAddress).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7');
  });
  it('rejects malformed assets', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { assets: [{ symbol: 'NOPE' }] }));
    await expect(assets()).rejects.toThrow('Malformed response');
  });
});

describe('createWallet', () => {
  it('sends name + exact clientRequestId', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { walletId: 'w9', replayed: false }));
    const req = 'req-abc-123';
    await createWallet('Travel', req);
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ name: 'Travel', clientRequestId: 'req-abc-123' });
  });
  it('returns the successful response', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { walletId: 'w9', replayed: false }));
    const r = await createWallet('Travel', 'req-1');
    expect(r).toMatchObject({ walletId: 'w9', replayed: false });
  });
  it('propagates API failure without false success', async () => {
    mockFetch.mockResolvedValueOnce(json(500, { message: 'Provider unreachable' }));
    await expect(createWallet('X', 'req-1')).rejects.toBeInstanceOf(ApiError);
  });
});
