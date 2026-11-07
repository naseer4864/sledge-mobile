import { z } from 'zod';
import { api } from './api';

export const OnboardingStatusSchema = z.object({ status: z.string(), currentStep: z.string().optional() }).loose();
export const KycStatusSchema = z.object({ status: z.string(), provider: z.string().optional(), reference: z.string().optional() }).loose();
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const onboardingStatus = () => api<OnboardingStatus>('/api/v1/onboarding/status', { schema: OnboardingStatusSchema });
export const submitProfile = (body: { legalFirstName: string; legalLastName: string; dateOfBirth: string; countryOfResidence: string }) =>
  api('/api/v1/onboarding/profile', { method: 'POST', body });
export const submitOnboarding = () => api('/api/v1/onboarding/submit', { method: 'POST' });
export const kycStatus = () => api<KycStatus>('/api/v1/kyc/status', { schema: KycStatusSchema });
export const startKyc = () => api('/api/v1/kyc/start', { method: 'POST' });
