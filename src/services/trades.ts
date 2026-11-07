import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const TradingPairSchema = z.object({
  pairId: z.string(), baseAssetId: z.string(), quoteAssetId: z.string(), status: z.string().optional(),
}).loose();
export type TradingPair = z.infer<typeof TradingPairSchema>;

export const TradeQuoteSchema = z.object({
  quoteId: z.string(), pairId: z.string(), side: z.enum(['buy', 'sell']),
  inputAtomic: z.string(), expectedOutputAtomic: z.string(), executablePrice: z.string().optional(),
  inputAssetId: z.string().optional(), outputAssetId: z.string().optional(),
  indicativePrice: z.string().optional(), spreadBps: z.string().optional(),
  providerFeeAtomic: z.string().optional(), coinFeeAtomic: z.string().optional(),
  netOutputAtomic: z.string().optional(), totalInputAtomic: z.string().optional(),
  limits: z.object({
    minimumOrderAmount: z.string().nullable().optional(),
    maximumOrderAmount: z.string().nullable().optional(),
    minimumBaseQuantity: z.string().nullable().optional(),
    maximumBaseQuantity: z.string().nullable().optional(),
  }).optional(),
  expiresAt: z.string().optional(), simulated: z.boolean().optional(),
}).loose();
export type TradeQuote = z.infer<typeof TradeQuoteSchema>;

export const TradeOrderSchema = z.object({
  orderId: z.string(), pairId: z.string(), side: z.string(),
  inputAssetId: z.string().optional(), outputAssetId: z.string().optional(),
  inputAtomic: z.string(), expectedOutputAtomic: z.string(), filledOutputAtomic: z.string().optional(),
  settledInputAtomic: z.string().optional(), remainingOutputAtomic: z.string().optional(),
  avgPriceAtomic: z.string().optional(), coinFeeAtomic: z.string().optional(),
  providerFeeAtomic: z.string().optional(), expectedFeesAtomic: z.string().optional(),
  settledCoinFeeAtomic: z.string().optional(), settledProviderFeeAtomic: z.string().optional(),
  settledTotalFeesAtomic: z.string().optional(),
  fillCount: z.number().optional(),
  status: z.string(), requestedAt: z.string().optional(), completedAt: z.string().nullable().optional(),
}).loose();
export type TradeOrder = z.infer<typeof TradeOrderSchema>;

export const pairs = () =>
  api('/api/v1/trading/pairs', { schema: z.array(TradingPairSchema) }).then((r) => r as TradingPair[]);
export const quoteTrade = (side: 'buy' | 'sell', pairId: string, amount: string) =>
  api(`/api/v1/trading/quotes/${side}`, { method: 'POST', body: { pairId, amount }, schema: TradeQuoteSchema }).then((r) => r as TradeQuote);
export const createOrder = (quoteId: string, idempotencyKey?: string) =>
  api('/api/v1/trading/orders', { method: 'POST', body: { quoteId, idempotencyKey }, schema: TradeOrderSchema }).then((r) => r as TradeOrder);
export const orders = () =>
  api('/api/v1/trading/orders', { schema: z.object({ orders: z.array(TradeOrderSchema) }).transform((r) => r.orders) }).then((r) => r as TradeOrder[]);
export const order = (id: string) =>
  api(`/api/v1/trading/orders/${id}`, { schema: TradeOrderSchema }).then((r) => r as TradeOrder);

export const usePairs = () => useQuery({ queryKey: ['trading-pairs'], queryFn: pairs, staleTime: 300_000 });
export const useOrders = () => useQuery({ queryKey: ['trading-orders'], queryFn: orders, staleTime: 15_000 });
const TERMINAL = new Set(['completed', 'rejected', 'cancelled', 'failed']);
export const useOrder = (id?: string) => useQuery({ queryKey: ['trading-order', id], queryFn: () => order(id!), enabled: !!id, staleTime: 10_000, refetchInterval: (q) => (q.state.data && TERMINAL.has(q.state.data.status) ? false : 20_000) });

// Status lifecycle shared by UI + tests. pending_review (risk hold) and
// cancellation_pending (cancel in flight) are non-terminal — they stay "open".
export const OPEN_ORDER_STATUSES = new Set(['quoted', 'reserved', 'submitting', 'submission_unknown', 'accepted_by_provider', 'partially_filled', 'filled', 'settling', 'pending_review', 'cancellation_pending']);
// Must mirror the backend customer-cancel eligibility exactly — offering
// cancel in states the API rejects only produces guaranteed 409s.
export const CANCELLABLE_STATUSES = new Set(['quoted', 'reserved']);
export const cancelOrder = (id: string) =>
  api(`/api/v1/trading/orders/${id}/cancel`, { method: 'POST', schema: z.object({ orderId: z.string(), status: z.string() }) });
