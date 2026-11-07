import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';
import { api } from './api';

export const GiftProductSchema = z.object({
  productId: z.string(), brand: z.string().optional(), name: z.string().optional(),
  description: z.string().optional(), country: z.string().optional(), currency: z.string().optional(),
  status: z.string(), imageUrl: z.string().nullable().optional(),
  denominations: z.array(z.object({ amountAtomic: z.string().optional(), currency: z.string().optional(), label: z.string().optional() }).loose()).optional(),
}).loose();
export type GiftProduct = z.infer<typeof GiftProductSchema>;

export const GiftQuoteSchema = z.object({
  quoteId: z.string(), productId: z.string(), amountAtomic: z.string(),
  paymentAtomic: z.string().optional(), feeAtomic: z.string().optional(), totalAtomic: z.string().optional(),
  exchangeRate: z.string().optional(), currency: z.string().optional(), payAssetId: z.string().optional(),
  expiresAt: z.string().optional(), status: z.string().optional(), simulated: z.boolean().optional(),
}).loose();
export type GiftQuote = z.infer<typeof GiftQuoteSchema>;

export const GiftPurchaseSchema = z.object({
  purchaseId: z.string(), productId: z.string().optional(), quoteId: z.string().optional(),
  amountAtomic: z.string().optional(), cardAmountAtomic: z.string().optional(), paymentAtomic: z.string().optional(),
  currency: z.string().optional(), status: z.string(), refundStatus: z.string().optional(),
  credentialId: z.string().nullable().optional(), createdAt: z.string().optional(),
  completedAt: z.string().nullable().optional(), replayed: z.boolean().optional(),
}).loose();
export type GiftPurchase = z.infer<typeof GiftPurchaseSchema>;

// Statuses the backend actually returns (PurchaseStatus enum).
export const GC_STATUS: Record<string, { label: string; color: string; terminal?: boolean }> = {
  created: { label: 'Created', color: '#F79009' }, risk_pending: { label: 'Under review', color: '#F79009' },
  reserved: { label: 'Reserved', color: '#F79009' }, submission_pending: { label: 'Submitting', color: '#F79009' },
  submission_unknown: { label: 'Verifying', color: '#F79009' }, processing: { label: 'Processing', color: '#F79009' },
  completed: { label: 'Completed', color: '#12B76A', terminal: true }, failed: { label: 'Failed', color: '#F04438', terminal: true },
  refund_pending: { label: 'Refund pending', color: '#F79009' }, refunded: { label: 'Refunded', color: '#667085', terminal: true },
  case_open: { label: 'Under review', color: '#F79009' }, rejected: { label: 'Rejected', color: '#F04438', terminal: true },
};
const TERMINAL = new Set(Object.keys(GC_STATUS).filter((k) => GC_STATUS[k].terminal));

export const products = () =>
  api('/api/v1/gift-cards/products', { schema: z.array(GiftProductSchema) }).then((r) => r as GiftProduct[]);
export const createQuote = (productId: string, amountAtomic: string, idempotencyKey: string) =>
  api('/api/v1/gift-cards/quotes', { method: 'POST', body: { productId, amountAtomic, idempotencyKey }, schema: GiftQuoteSchema }).then((r) => r as GiftQuote);
export const createPurchase = (quoteId: string, idempotencyKey: string) =>
  api('/api/v1/gift-cards/purchases', { method: 'POST', body: { quoteId, idempotencyKey }, schema: GiftPurchaseSchema }).then((r) => r as GiftPurchase);
export const purchases = () =>
  api('/api/v1/gift-cards/purchases', { schema: z.array(GiftPurchaseSchema) }).then((r) => r as GiftPurchase[]);
export const purchase = (id: string) =>
  api(`/api/v1/gift-cards/purchases/${id}`, { schema: GiftPurchaseSchema }).then((r) => r as GiftPurchase);

// Credential reveal — direct api() call, NEVER through TanStack Query (keeps it out of the cache).
export const revealCredentials = (id: string) =>
  api(`/api/v1/gift-cards/purchases/${id}/details`, { schema: z.object({ code: z.string(), pin: z.string().nullable().optional() }).loose() }).then((r) => r as { code: string; pin?: string | null });

export const inquire = (id: string, type: 'balance' | 'redemption') =>
  api(`/api/v1/gift-cards/purchases/${id}/${type === 'balance' ? 'balance-inquiry' : 'redemption-status'}`,
    { method: 'POST', body: {}, schema: z.object({ supported: z.boolean().optional(), inquiry: z.object({}).loose().optional() }).loose() }).then((r) => r as { supported?: boolean; inquiry?: Record<string, unknown> });

export const refundPurchase = (id: string, idempotencyKey: string) =>
  api(`/api/v1/gift-cards/purchases/${id}/refund`, { method: 'POST', body: { idempotencyKey }, schema: z.object({}).loose() });

export const useGiftProducts = () => useQuery({ queryKey: ['gift-products'], queryFn: products, staleTime: 300_000 });
export const useGiftPurchases = () => useQuery({ queryKey: ['gift-purchases'], queryFn: purchases, staleTime: 15_000 });
export const useGiftPurchase = (id?: string) =>
  useQuery({ queryKey: ['gift-purchase', id], queryFn: () => purchase(id!), enabled: !!id, staleTime: 10_000, refetchInterval: (q) => (q.state.data && TERMINAL.has(q.state.data.status) ? false : 20_000) });

// ── Sell ──────────────────────────────────────────────────────────────────────
const SellBrandSchema = z.object({ brand: z.string(), country: z.string(), cardCurrency: z.string(), cardType: z.string(), sellRateAtomic: z.string().optional(), minAmountAtomic: z.string().optional(), maxAmountAtomic: z.string().optional() }).loose();
export type SellBrand = z.infer<typeof SellBrandSchema>;
const SellQuoteSchema = z.object({ quoteId: z.string(), brand: z.string(), cardCurrency: z.string(), faceValueAtomic: z.string(), totalPayoutAtomic: z.string(), feeAtomic: z.string().optional(), settlementCurrency: z.string().optional(), expiresAt: z.string().optional(), status: z.string() }).loose();
export type SellQuote = z.infer<typeof SellQuoteSchema>;
const SellSubmissionSchema = z.object({ submissionId: z.string(), quoteId: z.string().optional(), brand: z.string().optional(), faceValueAtomic: z.string().optional(), totalPayoutAtomic: z.string().optional(), status: z.string(), createdAt: z.string().optional() }).loose();
export type SellSubmission = z.infer<typeof SellSubmissionSchema>;

export const sellBrands = () => api('/api/v1/gift-cards/sell/brands', { schema: z.array(SellBrandSchema) }).then((r) => r as SellBrand[]);
export const sellQuote = (brand: string, amountAtomic: string, country: string, cardCurrency: string, idempotencyKey: string) =>
  api('/api/v1/gift-cards/sell/quotes', { method: 'POST', body: { brand, amountAtomic, country, cardCurrency, idempotencyKey }, schema: SellQuoteSchema }).then((r) => r as SellQuote);
export const sellSubmit = (quoteId: string, code: string, pin: string | null, idempotencyKey: string) =>
  api('/api/v1/gift-cards/sell/submissions', { method: 'POST', body: { quoteId, code, pin, idempotencyKey }, schema: SellSubmissionSchema }).then((r) => r as SellSubmission);
export const sellSubmissions = () => api('/api/v1/gift-cards/sell/submissions', { schema: z.array(SellSubmissionSchema) }).then((r) => r as SellSubmission[]);
export const sellSubmission = (id: string) => api(`/api/v1/gift-cards/sell/submissions/${id}`, { schema: SellSubmissionSchema }).then((r) => r as SellSubmission);

export const useSellBrands = () => useQuery({ queryKey: ['sell-brands'], queryFn: sellBrands, staleTime: 60_000 });
export const useSellSubmissions = () => useQuery({ queryKey: ['sell-submissions'], queryFn: sellSubmissions, staleTime: 15_000 });
export const useSellSubmission = (id?: string) =>
  useQuery({ queryKey: ['sell-submission', id], queryFn: () => sellSubmission(id!), enabled: !!id, staleTime: 10_000, refetchInterval: (q) => (q.state.data && ['accepted', 'rejected', 'cancelled'].includes(q.state.data.status) ? false : 15_000) });
export const useSellQuote = () => useMutation({ mutationFn: (p: { brand: string; amountAtomic: string; country: string; cardCurrency: string; idempotencyKey: string }) => sellQuote(p.brand, p.amountAtomic, p.country, p.cardCurrency, p.idempotencyKey) });
export const useSellSubmit = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: { quoteId: string; code: string; pin: string | null; idempotencyKey: string }) => sellSubmit(p.quoteId, p.code, p.pin, p.idempotencyKey), onSuccess: () => qc.invalidateQueries({ queryKey: ['sell-submissions'] }) });
};
export const useSellSettledEffect = (completed: boolean) => {
  const qc = useQueryClient();
  React.useEffect(() => { if (completed) { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['sell-settlements'] }); qc.invalidateQueries({ queryKey: ['sell-submissions'] }); } }, [completed, qc]);
};

const SettlementSchema = z.object({ settlementId: z.string(), submissionId: z.string(), method: z.string(), amountAtomic: z.string(), currency: z.string(), status: z.string(), journalId: z.string().nullable().optional(), completedAt: z.string().nullable().optional(), createdAt: z.string().optional() }).loose();
export type Settlement = z.infer<typeof SettlementSchema>;
export const sellSettlements = () => api('/api/v1/gift-cards/sell/settlements', { schema: z.array(SettlementSchema) }).then((r) => r as Settlement[]);
export const useSellSettlements = () => useQuery({ queryKey: ['sell-settlements'], queryFn: sellSettlements, staleTime: 10_000, refetchInterval: (q) => (q.state.data ?? []).some((s) => ['pending', 'processing', 'submission_unknown', 'reconciliation_required'].includes(s.status)) ? 10_000 : false });
export const settlementFor = (settlements: Settlement[] | undefined, submissionId: string) => (settlements ?? []).find((s) => s.submissionId === submissionId);
