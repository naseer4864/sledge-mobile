import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const KycStatusSchema = z.object({
  status: z.string(),
  verificationId: z.string().optional(),
  provider: z.string().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
}).loose();
export type KycStatus = z.infer<typeof KycStatusSchema>;

// Exact backend enum + 'not_started' when there's no verification record.
export const KYC_STATUS: Record<string, { label: string; color: string; terminal?: boolean; detail: string }> = {
  not_started: { label: 'Not started', color: '#758780', detail: 'Verify your identity to unlock the full app.' },
  pending: { label: 'Pending', color: '#F79009', detail: 'Your verification is queued for review.' },
  in_review: { label: 'Under review', color: '#F79009', detail: 'Our team is reviewing your information — usually takes a few minutes.' },
  info_requested: { label: 'Info needed', color: '#F79009', detail: 'We need a bit more information — check the reason below.' },
  approved: { label: 'Verified', color: '#12B76A', terminal: true, detail: 'Your identity is verified.' },
  rejected: { label: 'Rejected', color: '#F04438', terminal: true, detail: 'Verification was declined — see the reason and resubmit if eligible.' },
  expired: { label: 'Expired', color: '#758780', terminal: true, detail: 'Your verification expired — start again.' },
};
const ACTIVE = new Set(['pending', 'in_review', 'info_requested']);

export const kycStatus = () => api('/api/v1/kyc/status', { schema: KycStatusSchema }).then((r) => r as KycStatus);
export const startKyc = () =>
  api('/api/v1/kyc/start', { method: 'POST', body: {}, schema: z.object({ verificationId: z.string(), status: z.string(), reused: z.boolean().optional() }).loose() });
export const resubmitKyc = () =>
  api('/api/v1/kyc/resubmit', { method: 'POST', body: {}, schema: z.object({ verificationId: z.string(), status: z.string() }).loose() });

export const useKyc = () =>
  useQuery({ queryKey: ['kyc-status'], queryFn: kycStatus, staleTime: 30_000, refetchInterval: (q) => (q.state.data && ACTIVE.has(q.state.data.status) ? 20_000 : false) });
