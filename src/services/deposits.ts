import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const DepositAddressSchema = z.object({
  addressId: z.string(), assetId: z.string(), networkId: z.string(),
  address: z.string(), memo: z.string().nullable().optional(), status: z.string().optional(),
  simulated: z.boolean().optional(),
}).loose();
export type DepositAddress = z.infer<typeof DepositAddressSchema>;

export const DepositSchema = z.object({
  depositId: z.string(), assetId: z.string(), networkId: z.string().optional(),
  amount: z.string(), txHash: z.string().optional(),
  confirmations: z.number().optional(), requiredConfirmations: z.number().optional(),
  status: z.string(), createdAt: z.string().optional(), creditedAt: z.string().optional(),
}).loose();
export type Deposit = z.infer<typeof DepositSchema>;

export const createAddress = (walletId: string, assetId: string, networkId: string) =>
  api(`/api/v1/wallets/${walletId}/addresses`, { method: 'POST', body: { assetId, networkId }, schema: DepositAddressSchema }).then((r) => r as DepositAddress);
export const listAddresses = (walletId: string) =>
  api(`/api/v1/wallets/${walletId}/addresses`, { schema: z.object({ addresses: z.array(DepositAddressSchema) }).transform((r) => r.addresses) }).then((r) => r as DepositAddress[]);
export const deposits = (limit = 50) =>
  api(`/api/v1/deposits?limit=${limit}`, { schema: z.object({ deposits: z.array(DepositSchema) }).transform((r) => r.deposits) }).then((r) => r as Deposit[]);
export const depositStatus = (depositId: string) =>
  api<{ status: string; confirmations?: number }>(`/api/v1/deposits/${depositId}/status`);

export const useDepositAddresses = (walletId?: string) =>
  useQuery({ queryKey: ['deposit-addresses', walletId], queryFn: () => listAddresses(walletId!), enabled: !!walletId, staleTime: 60_000 });
export const useDeposits = (limit = 50) =>
  useQuery({ queryKey: ['deposits', limit], queryFn: () => deposits(limit), staleTime: 15_000 });
