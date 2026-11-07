import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const WalletSchema = z.object({
  walletId: z.string(), name: z.string(),
  type: z.enum(['custodial', 'non_custodial']),
  status: z.enum(['pending', 'active', 'restricted', 'suspended', 'closed', 'failed']),
  createdAt: z.string().optional(),
}).loose();
export type Wallet = z.infer<typeof WalletSchema>;

export const BalanceSchema = z.object({
  accountId: z.string(), assetId: z.string(), code: z.string().optional(),
  available: z.string(), reserved: z.string(), frozen: z.string(),
}).loose();
export type Balance = z.infer<typeof BalanceSchema>;

export const AssetNetworkSchema = z.object({
  networkAssetId: z.string(), networkId: z.string(), networkName: z.string(),
  chainId: z.number().nullable().optional(), contractAddress: z.string().nullable().optional(),
  depositsEnabled: z.boolean().optional(), withdrawalsEnabled: z.boolean().optional(),
}).loose();
export type AssetNetwork = z.infer<typeof AssetNetworkSchema>;

export const AssetSchema = z.object({
  assetId: z.string(), symbol: z.string(), name: z.string(),
  type: z.enum(['fiat', 'native_crypto', 'token']), decimals: z.number(),
  enabled: z.boolean(), depositsEnabled: z.boolean().optional(), withdrawalsEnabled: z.boolean().optional(),
  networks: z.array(AssetNetworkSchema).optional(),
}).loose();
export type Asset = z.infer<typeof AssetSchema>;

const list = <T,>(path: string, schema: z.ZodType<T>, key: string): Promise<T[]> =>
  api(path, { schema: z.object({ [key]: z.array(schema) }).transform((r) => (r as Record<string, T[]>)[key]) }).then((r) => r as T[]);

export const wallets = () => list('/api/v1/wallets', WalletSchema, 'wallets');
export const wallet = (id: string) => api(`/api/v1/wallets/${id}`, { schema: WalletSchema }).then((r) => r as Wallet);
export const balances = (id: string) =>
  api(`/api/v1/wallets/${id}/balances`, { schema: z.object({ balances: z.array(BalanceSchema) }).transform((r) => r.balances) }).then((r) => r as Balance[]);
export const assets = () => list('/api/v1/assets', AssetSchema, 'assets');
export const createWallet = (name: string, clientRequestId: string) =>
  api<{ walletId: string; replayed: boolean }>('/api/v1/wallets', { method: 'POST', body: { name, clientRequestId } });

export const useWallets = () => useQuery({ queryKey: ['wallets'], queryFn: wallets, staleTime: 30_000 });
export const useAssets = () => useQuery({ queryKey: ['assets'], queryFn: assets, staleTime: 120_000 });
export const useWalletBalances = (id?: string) => useQuery({ queryKey: ['wallet-balances', id], queryFn: () => balances(id!), enabled: !!id, staleTime: 15_000 });
