import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const WithdrawalSchema = z.object({
  withdrawalId: z.string(), assetId: z.string(), networkId: z.string(),
  amountAtomic: z.string(), feeAtomic: z.string(), totalReservedAtomic: z.string(),
  status: z.enum(['requested', 'pending_review', 'approved', 'rejected', 'reserved', 'submitting', 'submission_unknown', 'broadcast', 'confirming', 'completed', 'failed', 'cancelled', 'reconciliation_required']),
  blockchainTransactionHash: z.string().nullable().optional(),
  requestedAt: z.string().optional(), broadcastAt: z.string().nullable().optional(), confirmedAt: z.string().nullable().optional(),
  replayed: z.boolean().optional(),
}).loose();
export type Withdrawal = z.infer<typeof WithdrawalSchema>;

export const QuoteSchema = z.object({
  amountAtomic: z.string(), feeAtomic: z.string(), totalReservedAtomic: z.string(), feePolicyVersion: z.number().optional(),
}).loose();
export type WithdrawalQuote = z.infer<typeof QuoteSchema>;

export const quoteWithdrawal = (body: { walletId: string; assetId: string; networkId: string; amount: string }) =>
  api('/api/v1/withdrawals/quote', { method: 'POST', body, schema: QuoteSchema }).then((r) => r as WithdrawalQuote);
export const createWithdrawal = (body: { walletId: string; assetId: string; networkId: string; amount: string; destinationAddress: string; destinationMemo?: string; idempotencyKey?: string }) =>
  api('/api/v1/withdrawals', { method: 'POST', body, schema: WithdrawalSchema }).then((r) => r as Withdrawal);
export const withdrawals = (limit = 50) =>
  api(`/api/v1/withdrawals?limit=${limit}`, { schema: z.object({ withdrawals: z.array(WithdrawalSchema) }).transform((r) => r.withdrawals) }).then((r) => r as Withdrawal[]);
export const withdrawalStatus = (id: string) =>
  api<{ withdrawalId: string; status: string }>(`/api/v1/withdrawals/${id}/status`);
export const withdrawal = (id: string) =>
  api(`/api/v1/withdrawals/${id}`, { schema: WithdrawalSchema }).then((r) => r as Withdrawal);

export const useWithdrawals = (limit = 50) =>
  useQuery({ queryKey: ['withdrawals', limit], queryFn: () => withdrawals(limit), staleTime: 15_000 });
export const useWithdrawal = (id?: string) =>
  useQuery({ queryKey: ['withdrawal', id], queryFn: () => withdrawal(id!), enabled: !!id, staleTime: 10_000, refetchInterval: (q) => (q.state.data && ['completed', 'failed', 'rejected', 'cancelled'].includes(q.state.data.status) ? false : 30_000) });
