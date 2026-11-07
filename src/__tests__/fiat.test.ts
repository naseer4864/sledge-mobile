import * as SecureStore from 'expo-secure-store';
import { bankingAccounts, provisionAccount, fiatDeposits, fiatPayouts, createPayout, BankingAccountSchema, FiatPayoutSchema, FiatQuoteSchema,
  banks, resolveAccount, saveAccount, savedAccounts, setDefaultAccount, disableAccount,
  quoteBeneficiaryPayout, createBeneficiaryPayout, fiatDeposit, ResolutionSchema, SavedAccountSchema } from '../services/fiat';
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
const ACCT = { bankingAccountId: 'ba1', provider: 'mock', currency: 'NGN', country: 'NG', accountNumber: '0123456789', bankName: 'Demo Bank', accountName: 'TEST USER', status: 'active', issuedAt: '2026-01-01T00:00:00Z', simulated: true };

beforeEach(() => { store.clear(); mockFetch.mockReset(); });

describe('banking accounts', () => {
  it('parses a valid account', () => {
    const a = BankingAccountSchema.parse(ACCT);
    expect(a.accountNumber).toBe('0123456789'); // leading zeros preserved
    expect(a.status).toBe('active');
  });
  it('parses the list', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { bankingAccounts: [ACCT] }));
    const r = await bankingAccounts();
    expect(r[0].bankName).toBe('Demo Bank');
  });
  it('posts provision with NGN + clientRequestId', async () => {
    mockFetch.mockResolvedValueOnce(json(201, ACCT));
    await provisionAccount('req-1');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ currency: 'NGN', country: 'NG', clientRequestId: 'req-1' });
  });
  it('rejects malformed account', () => {
    expect(() => BankingAccountSchema.parse({ bogus: true })).toThrow();
  });
});

describe('fiat deposits + payouts', () => {
  it('parses deposit history', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { fiatDeposits: [{ fiatDepositId: 'fd1', bankingAccountId: 'ba1', currency: 'NGN', amountAtomic: '150000', creditedAtomic: '150000', status: 'credited' }] }));
    const r = await fiatDeposits();
    expect(r[0].amountAtomic).toBe('150000');
    expect(r[0].status).toBe('credited');
  });
  it('parses payout history', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { fiatPayouts: [{ payoutId: 'p1', currency: 'NGN', amountAtomic: '500000', feeAtomic: '5000', totalReservedAtomic: '505000', accountNumber: '0123456789', bankCode: '058', status: 'settled' }] }));
    const r = await fiatPayouts();
    expect(r[0].status).toBe('settled');
    expect(r[0].bankCode).toBe('058');
  });
  it('parses a payout quote', () => {
    const q = FiatQuoteSchema.parse({ amountAtomic: '500000', feeAtomic: '5000', totalReservedAtomic: '505000' });
    expect(q.totalReservedAtomic).toBe('505000');
  });
  it('posts the payout body + idempotency key', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { payoutId: 'p1', currency: 'NGN', amountAtomic: '500000', feeAtomic: '5000', totalReservedAtomic: '505000', accountNumber: '0123456789', bankCode: '058', status: 'requested' }));
    await createPayout({ amount: '5000.00', bankCode: '058', accountNumber: '0123456789', accountName: 'TEST', idempotencyKey: 'idem-9' });
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body.idempotencyKey).toBe('idem-9');
    expect(body.bankCode).toBe('058');
  });
  it('propagates insufficient-balance', async () => {
    mockFetch.mockResolvedValueOnce(json(422, { message: 'Insufficient' }));
    await expect(createPayout({ amount: '1', bankCode: '058', accountNumber: '0123456789', accountName: 'X' })).rejects.toBeInstanceOf(ApiError);
  });
  it('rejects malformed payout', () => {
    expect(() => FiatPayoutSchema.parse({ nope: 1 })).toThrow();
  });
});

/* ── NB.6: bank directory, resolve, saved accounts, beneficiary payouts ── */
const BANK = { code: '058', name: 'Guaranty Trust Bank', active: true };
const RES = { resolutionId: 'res-1', bankCode: '058', bankName: 'GTBank', accountNumberMasked: '******7890', accountName: 'ADA LOVELACE', expiresAt: '2027-01-01T00:00:00Z', simulated: true };
const SAVED = { customerBankAccountId: 'cba-1', provider: 'mock', bankCode: '058', bankName: 'GTBank', accountNumberMasked: '******7890', accountNumberLast4: '7890', accountName: 'ADA LOVELACE', currency: 'NGN', country: 'NG', status: 'verified', isDefault: true, verifiedAt: '2026-01-02T00:00:00Z', createdAt: '2026-01-01T00:00:00Z' };

describe('bank directory + resolve', () => {
  it('parses banks', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { banks: [BANK] }));
    expect((await banks())[0].code).toBe('058');
  });
  it('posts resolve with bankCode + accountNumber', async () => {
    mockFetch.mockResolvedValueOnce(json(200, RES));
    await resolveAccount('058', '0123456789');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ bankCode: '058', accountNumber: '0123456789' });
  });
  it('parses the resolution view (masked number + expiry)', () => {
    const r = ResolutionSchema.parse(RES);
    expect(r.accountNumberMasked).toBe('******7890');
    expect(r.accountName).toBe('ADA LOVELACE');
  });
  it('propagates resolve failures', async () => {
    mockFetch.mockResolvedValueOnce(json(404, { message: 'Account not found' }));
    await expect(resolveAccount('058', '0000000000')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('saved bank accounts', () => {
  it('saves with resolutionId + confirmed name + idempotency key', async () => {
    mockFetch.mockResolvedValueOnce(json(201, { ...SAVED, replayed: false }));
    await saveAccount({ resolutionId: 'res-1', confirmedAccountName: 'ADA LOVELACE', idempotencyKey: 'idem-1' });
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ resolutionId: 'res-1', confirmedAccountName: 'ADA LOVELACE', idempotencyKey: 'idem-1' });
  });
  it('parses saved accounts incl. all statuses', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { bankAccounts: [SAVED, { ...SAVED, customerBankAccountId: 'cba-2', status: 'under_review', isDefault: false }] }));
    const r = await savedAccounts();
    expect(r).toHaveLength(2);
    expect(r[0].isDefault).toBe(true);
    expect(r[1].status).toBe('under_review');
  });
  it('rejects unknown account statuses', () => {
    expect(() => SavedAccountSchema.parse({ ...SAVED, status: 'magical' })).toThrow();
  });
  it('posts set-default and disable to the right paths', async () => {
    mockFetch.mockResolvedValueOnce(json(200, SAVED)).mockResolvedValueOnce(json(200, { ...SAVED, status: 'disabled' }));
    await setDefaultAccount('cba-1');
    await disableAccount('cba-1');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/customer-bank-accounts/cba-1/default');
    expect(String(mockFetch.mock.calls[1][0])).toContain('/customer-bank-accounts/cba-1/disable');
  });
});

describe('beneficiary-bound payouts', () => {
  it('quotes with customerBankAccountId binding', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { quoteId: 'q-1', amountAtomic: '500000', feeAtomic: '5000', totalReservedAtomic: '505000', expiresAt: '2027-01-01T00:00:00Z', customerBankAccountId: 'cba-1' }));
    const q = await quoteBeneficiaryPayout('5000.00', 'cba-1');
    expect(JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body)).toEqual({ amount: '5000.00', customerBankAccountId: 'cba-1' });
    expect(q.quoteId).toBe('q-1');
  });
  it('creates a payout bound to quoteId + beneficiary', async () => {
    mockFetch.mockResolvedValueOnce(json(201, { payoutId: 'p1', currency: 'NGN', amountAtomic: '500000', feeAtomic: '5000', totalReservedAtomic: '505000', accountNumber: '******7890', bankCode: '058', status: 'requested' }));
    await createBeneficiaryPayout({ amount: '5000.00', customerBankAccountId: 'cba-1', quoteId: 'q-1', idempotencyKey: 'idem-2' });
    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ amount: '5000.00', customerBankAccountId: 'cba-1', quoteId: 'q-1', idempotencyKey: 'idem-2' });
    expect(body.bankCode).toBeUndefined(); // no manual destination fields in the beneficiary flow
  });
  it('propagates expired-quote + insufficient-balance errors', async () => {
    mockFetch.mockResolvedValueOnce(json(422, { message: 'Quote expired' }));
    await expect(createBeneficiaryPayout({ amount: '1', customerBankAccountId: 'cba-1', quoteId: 'q-1' })).rejects.toBeInstanceOf(ApiError);
    mockFetch.mockResolvedValueOnce(json(422, { message: 'Insufficient balance' }));
    await expect(createBeneficiaryPayout({ amount: '1', customerBankAccountId: 'cba-1' })).rejects.toBeInstanceOf(ApiError);
  });
});

describe('deposit detail', () => {
  it('fetches a deposit by id', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { fiatDepositId: 'fd-1', currency: 'NGN', amountAtomic: '150000', creditedAtomic: '150000', status: 'credited', detectedAt: '2026-01-01T00:00:00Z', creditedAt: '2026-01-01T00:05:00Z' }));
    const d = await fiatDeposit('fd-1');
    expect(String(mockFetch.mock.calls[0][0])).toContain('/fiat-deposits/fd-1');
    expect(d.creditedAt).toBe('2026-01-01T00:05:00Z');
  });
  it('parses every deposit status without rejecting', () => {
    for (const status of ['detected', 'verifying', 'verified', 'credited', 'under_review', 'reversed', 'failed', 'reconciliation_required']) {
      expect(() => FiatPayoutSchema.parse({ payoutId: 'p', currency: 'NGN', amountAtomic: '1', feeAtomic: '0', totalReservedAtomic: '1', accountNumber: 'x', bankCode: '058', status })).not.toThrow();
    }
  });
});
