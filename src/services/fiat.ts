import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const BankingAccountSchema = z.object({
  bankingAccountId: z.string(), provider: z.string().nullable().optional(), currency: z.string(), country: z.string(),
  accountNumber: z.string().nullable().optional(), bankName: z.string().nullable().optional(), accountName: z.string().nullable().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'closed', 'failed']), issuedAt: z.string().nullable().optional(), simulated: z.boolean().optional(),
}).loose();
export type BankingAccount = z.infer<typeof BankingAccountSchema>;

export const FiatDepositSchema = z.object({
  fiatDepositId: z.string(), bankingAccountId: z.string().optional(), currency: z.string(),
  amountAtomic: z.string(), creditedAtomic: z.string(), status: z.string(),
  detectedAt: z.string().optional(), creditedAt: z.string().nullable().optional(),
}).loose();
export type FiatDeposit = z.infer<typeof FiatDepositSchema>;

export const FiatPayoutSchema = z.object({
  payoutId: z.string(), currency: z.string(), amountAtomic: z.string(), feeAtomic: z.string(), totalReservedAtomic: z.string(),
  accountNumber: z.string(), accountNumberMasked: z.string().optional(), bankCode: z.string(), bankName: z.string().optional(),
  accountName: z.string().optional(), customerBankAccountId: z.string().nullable().optional(), destinationSource: z.string().optional(),
  status: z.string(), requestedAt: z.string().optional(), settledAt: z.string().nullable().optional(),
}).loose();
export type FiatPayout = z.infer<typeof FiatPayoutSchema>;

export const FiatQuoteSchema = z.object({
  amountAtomic: z.string(), feeAtomic: z.string(), totalReservedAtomic: z.string(),
}).loose();
export type FiatQuote = z.infer<typeof FiatQuoteSchema>;

export const provisionAccount = (clientRequestId: string) =>
  api('/api/v1/banking-accounts', { method: 'POST', body: { currency: 'NGN', country: 'NG', clientRequestId }, schema: BankingAccountSchema }).then((r) => r as BankingAccount);
export const bankingAccounts = () =>
  api('/api/v1/banking-accounts', { schema: z.object({ bankingAccounts: z.array(BankingAccountSchema) }).transform((r) => r.bankingAccounts) }).then((r) => r as BankingAccount[]);
export const fiatDeposits = () =>
  api('/api/v1/fiat-deposits', { schema: z.object({ fiatDeposits: z.array(FiatDepositSchema) }).transform((r) => r.fiatDeposits) }).then((r) => r as FiatDeposit[]);
export const fiatPayouts = () =>
  api('/api/v1/fiat-payouts', { schema: z.object({ fiatPayouts: z.array(FiatPayoutSchema) }).transform((r) => r.fiatPayouts) }).then((r) => r as FiatPayout[]);
export const quotePayout = (amount: string) =>
  api('/api/v1/fiat-payouts/quote', { method: 'POST', body: { amount }, schema: FiatQuoteSchema }).then((r) => r as FiatQuote);
export const createPayout = (body: { amount: string; bankCode: string; accountNumber: string; accountName: string; idempotencyKey?: string }) =>
  api('/api/v1/fiat-payouts', { method: 'POST', body, schema: FiatPayoutSchema }).then((r) => r as FiatPayout);

export const useBankingAccounts = () => useQuery({ queryKey: ['banking-accounts'], queryFn: bankingAccounts, staleTime: 60_000 });
export const useFiatDeposits = () => useQuery({ queryKey: ['fiat-deposits'], queryFn: fiatDeposits, staleTime: 15_000 });
export const useFiatPayouts = () => useQuery({ queryKey: ['fiat-payouts'], queryFn: fiatPayouts, staleTime: 15_000 });

/* ── Bank directory + customer bank accounts (NB.1) ─────────────────── */

export const BankSchema = z.object({
  code: z.string(), name: z.string(), active: z.boolean().optional(),
}).loose();
export type Bank = z.infer<typeof BankSchema>;

export const ResolutionSchema = z.object({
  resolutionId: z.string(), bankCode: z.string(), bankName: z.string(),
  accountNumberMasked: z.string(), accountName: z.string(),
  expiresAt: z.string(), simulated: z.boolean().optional(),
}).loose();
export type Resolution = z.infer<typeof ResolutionSchema>;

export const SavedAccountSchema = z.object({
  customerBankAccountId: z.string(), provider: z.string().nullable().optional(),
  bankCode: z.string(), bankName: z.string(), accountNumberMasked: z.string(),
  accountName: z.string(), currency: z.string(), country: z.string(),
  status: z.enum(['pending_verification', 'verified', 'under_review', 'verification_failed', 'disabled']),
  isDefault: z.boolean(), verifiedAt: z.string().nullable().optional(),
  disabledAt: z.string().nullable().optional(), createdAt: z.string().optional(),
}).loose();
export type SavedAccount = z.infer<typeof SavedAccountSchema>;

export const banks = () =>
  api('/api/v1/customer-bank-accounts/banks', { schema: z.object({ banks: z.array(BankSchema) }).transform((r) => r.banks) }).then((r) => r as Bank[]);
export const resolveAccount = (bankCode: string, accountNumber: string) =>
  api('/api/v1/customer-bank-accounts/resolve', { method: 'POST', body: { bankCode, accountNumber }, schema: ResolutionSchema }).then((r) => r as Resolution);
export const saveAccount = (body: { resolutionId: string; confirmedAccountName: string; idempotencyKey?: string }) =>
  api('/api/v1/customer-bank-accounts', { method: 'POST', body, schema: SavedAccountSchema }).then((r) => r as SavedAccount);
export const savedAccounts = () =>
  api('/api/v1/customer-bank-accounts', { schema: z.object({ bankAccounts: z.array(SavedAccountSchema) }).transform((r) => r.bankAccounts) }).then((r) => r as SavedAccount[]);
export const setDefaultAccount = (customerBankAccountId: string) =>
  api(`/api/v1/customer-bank-accounts/${encodeURIComponent(customerBankAccountId)}/default`, { method: 'POST', schema: SavedAccountSchema }).then((r) => r as SavedAccount);
export const disableAccount = (customerBankAccountId: string) =>
  api(`/api/v1/customer-bank-accounts/${encodeURIComponent(customerBankAccountId)}/disable`, { method: 'POST', schema: SavedAccountSchema }).then((r) => r as SavedAccount);

export const useBanks = () => useQuery({ queryKey: ['bank-directory'], queryFn: banks, staleTime: 300_000 });
export const useSavedAccounts = () => useQuery({ queryKey: ['saved-bank-accounts'], queryFn: savedAccounts, staleTime: 30_000 });

/* ── Beneficiary-bound payout (NB.2) ────────────────────────────────── */

export const BoundQuoteSchema = FiatQuoteSchema.extend({
  quoteId: z.string(), expiresAt: z.string(), customerBankAccountId: z.string().nullable().optional(),
}).loose();
export type BoundQuote = z.infer<typeof BoundQuoteSchema>;

export const quoteBeneficiaryPayout = (amount: string, customerBankAccountId: string) =>
  api('/api/v1/fiat-payouts/quote', { method: 'POST', body: { amount, customerBankAccountId }, schema: BoundQuoteSchema }).then((r) => r as BoundQuote);
export const createBeneficiaryPayout = (body: { amount: string; customerBankAccountId: string; quoteId?: string; idempotencyKey?: string }) =>
  api('/api/v1/fiat-payouts', { method: 'POST', body, schema: FiatPayoutSchema }).then((r) => r as FiatPayout);

export const fiatDeposit = (id: string) =>
  api(`/api/v1/fiat-deposits/${encodeURIComponent(id)}`, { schema: FiatDepositSchema }).then((r) => r as FiatDeposit);
export const useFiatDeposit = (id: string) =>
  useQuery({ queryKey: ['fiat-deposit', id], queryFn: () => fiatDeposit(id), staleTime: 15_000 });
