import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const SavingsProductSchema = z.object({
  productId: z.string(), name: z.string(), type: z.string(), assetId: z.string(),
  minimumAmount: z.string().optional(), maximumAmount: z.string().optional(),
  minimumFundingAmount: z.string().optional(), termDays: z.number().optional(),
}).loose();
export type SavingsProduct = z.infer<typeof SavingsProductSchema>;

export const SavingsPlanSchema = z.object({
  planId: z.string(), productId: z.string(), productType: z.string(), assetId: z.string(),
  status: z.string(), principalAtomic: z.string(), availableAtomic: z.string().optional(),
  lockedAtomic: z.string().optional(), withdrawnAtomic: z.string().optional(),
  startedAt: z.string().optional(), maturityAt: z.string().nullable().optional(), simulated: z.boolean().optional(),
}).loose();
export type SavingsPlan = z.infer<typeof SavingsPlanSchema>;

export const SavingsTxnSchema = z.object({
  transactionId: z.string().optional(), type: z.string().optional(), amountAtomic: z.string().optional(),
  status: z.string().optional(), createdAt: z.string().optional(),
}).loose();
export type SavingsTxn = z.infer<typeof SavingsTxnSchema>;

export const products = () =>
  api('/api/v1/savings/products', { schema: z.array(SavingsProductSchema) }).then((r) => r as SavingsProduct[]);
export const plans = () =>
  api('/api/v1/savings/plans', { schema: z.array(SavingsPlanSchema) }).then((r) => r as SavingsPlan[]);
export const summary = () =>
  api('/api/v1/savings/summary', { schema: z.object({}).loose() });
export const plan = (id: string) =>
  api(`/api/v1/savings/plans/${id}`, { schema: SavingsPlanSchema }).then((r) => r as SavingsPlan);
export const planTxns = (id: string) =>
  api(`/api/v1/savings/plans/${id}/transactions`, { schema: z.array(SavingsTxnSchema) }).then((r) => r as SavingsTxn[]);
export const createPlan = (productId: string, termDays: number | undefined, idempotencyKey: string) =>
  api('/api/v1/savings/plans', { method: 'POST', body: { productId, termDays, idempotencyKey }, schema: SavingsPlanSchema }).then((r) => r as SavingsPlan);
export const fundPlan = (planId: string, amount: string, idempotencyKey: string) =>
  api(`/api/v1/savings/plans/${planId}/fund`, { method: 'POST', body: { amount, idempotencyKey }, schema: z.object({}).loose() });
export const withdrawPlan = (planId: string, amount: string, idempotencyKey: string) =>
  api(`/api/v1/savings/plans/${planId}/withdraw`, { method: 'POST', body: { amount, idempotencyKey }, schema: z.object({}).loose() });
export const redeemPlan = (planId: string, amount: string, idempotencyKey: string) =>
  api(`/api/v1/savings/plans/${planId}/redeem`, { method: 'POST', body: { amount, idempotencyKey }, schema: z.object({}).loose() });
export const earlyBreakPlan = (planId: string, idempotencyKey: string) =>
  api(`/api/v1/savings/plans/${planId}/early-break`, { method: 'POST', body: { confirm: true, idempotencyKey }, schema: z.object({}).loose() });

export const useProducts = () => useQuery({ queryKey: ['savings-products'], queryFn: products, staleTime: 300_000 });
export const usePlans = () => useQuery({ queryKey: ['savings-plans'], queryFn: plans, staleTime: 15_000 });
export const usePlan = (id?: string) => useQuery({ queryKey: ['savings-plan', id], queryFn: () => plan(id!), enabled: !!id, staleTime: 10_000 });
