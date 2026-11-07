import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { me } from './auth';
import { onboardingStatus, kycStatus } from './onboarding';
import { ApiError } from './api';

// Verified customer-facing surface: /auth/me + /onboarding/status + /kyc/status.
// No wallet/balance/asset/transaction endpoints exist yet — represented honestly.

export const DashboardSchema = z.object({
  customer: z.object({ id: z.string(), email: z.string(), firstName: z.string().optional(), lastName: z.string().optional() }).loose(),
  onboarding: z.object({ status: z.string(), currentStep: z.string().optional() }).loose().optional(),
  kyc: z.object({ status: z.string(), provider: z.string().optional() }).loose().optional(),
});
export type Dashboard = z.infer<typeof DashboardSchema>;

export function useDashboard() {
  const customer = useQuery({ queryKey: ['dashboard', 'customer'], queryFn: me, staleTime: 60_000, retry: 1 });
  const onboarding = useQuery({ queryKey: ['dashboard', 'onboarding'], queryFn: onboardingStatus, staleTime: 60_000, retry: 0 });
  const kyc = useQuery({ queryKey: ['dashboard', 'kyc'], queryFn: kycStatus, staleTime: 60_000, retry: 0 });

  return {
    customer: customer.data,
    onboarding: onboarding.error instanceof ApiError ? undefined : onboarding.data,
    kyc: kyc.error instanceof ApiError ? undefined : kyc.data,
    loading: customer.isLoading,
    refreshing: customer.isRefetching || onboarding.isRefetching || kyc.isRefetching,
    error: customer.error,
    refresh: async () => { await Promise.all([customer.refetch(), onboarding.refetch(), kyc.refetch()]); },
  };
}
