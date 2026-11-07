import { maskAmount, formatAtomic } from '../lib/money';
import { DashboardSchema } from '../services/dashboard';

describe('money formatting', () => {
  it('masks hidden amounts', () => {
    expect(maskAmount(true, '₦ 1,234.56')).toBe('••••••');
    expect(maskAmount(false, '₦ 1,234.56')).toBe('₦ 1,234.56');
  });
  it('formats atomic amounts decimal-safely', () => {
    expect(formatAtomic('150000000', 8)).toBe('1.5');         // 1.5 BTC
    expect(formatAtomic('15000000', 8)).toBe('0.15');
    expect(formatAtomic('25000', 6)).toBe('0.025');            // USDT
    expect(formatAtomic('1234', 0)).toBe('1234');              // whole units
    expect(formatAtomic('1000000000000000000', 18)).toBe('1'); // wei → ETH
  });
  it('handles zero and malformed amounts', () => {
    expect(formatAtomic('0', 8)).toBe('0');
    expect(formatAtomic('', 8)).toBe('0');
    expect(formatAtomic('abc', 8)).toBe('0');
  });
  it('preserves large integers without float loss', () => {
    expect(formatAtomic('9007199254740993', 0)).toBe('9007199254740993'); // > Number.MAX_SAFE_INTEGER
  });
});

describe('dashboard schema', () => {
  const valid = {
    customer: { id: 'u1', email: 'a@b.co', firstName: 'Ada' },
    onboarding: { status: 'complete' },
    kyc: { status: 'verified', provider: 'sumsub' },
  };
  it('parses a full dashboard payload', () => {
    const d = DashboardSchema.parse(valid);
    expect(d.customer.firstName).toBe('Ada');
    expect(d.kyc?.status).toBe('verified');
  });
  it('accepts missing optional sections (partial failure)', () => {
    const d = DashboardSchema.parse({ customer: valid.customer });
    expect(d.onboarding).toBeUndefined();
    expect(d.kyc).toBeUndefined();
  });
  it('rejects a missing customer', () => {
    expect(() => DashboardSchema.parse({})).toThrow();
  });
});
