import { z } from 'zod';
import { api } from './api';

export const OnboardingStatusSchema = z.object({
  stage: z.string(),
  restrictionReason: z.string().nullable().optional(),
  profileSubmitted: z.boolean().optional(),
  history: z.array(z.object({ to: z.string(), reason: z.string(), at: z.string() }).loose()).optional(),
  status: z.string().optional(),
  currentStep: z.string().optional(),
}).loose();
export const KycStatusSchema = z.object({ status: z.string(), provider: z.string().optional(), reference: z.string().optional() }).loose();
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const onboardingStatus = () => api<OnboardingStatus>('/api/v1/onboarding/status', { schema: OnboardingStatusSchema });
export const submitProfile = (body: {
  legalFirstName: string; legalLastName: string; dateOfBirth: string;
  countryOfResidence: string; nationality: string; residentialAddress: string;
  identityDocumentType: string; identityDocumentNumber: string; city?: string; postalCode?: string;
}) => api('/api/v1/onboarding/profile', { method: 'POST', body });

export const OnboardingDocumentSchema = z.object({
  kind: z.enum(['front', 'back', 'selfie']),
  identityDocumentType: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().optional(),
  uploadedAt: z.string().optional(),
});
export type OnboardingDocument = z.infer<typeof OnboardingDocumentSchema>;

export const listOnboardingDocuments = () => api<{ documents: OnboardingDocument[] }>(
  '/api/v1/onboarding/documents',
  { schema: z.object({ documents: z.array(OnboardingDocumentSchema) }) },
);

export const uploadOnboardingDocument = (body: {
  kind: 'front' | 'back' | 'selfie';
  identityDocumentType: string;
  contentType: 'image/jpeg' | 'image/png';
  dataBase64: string;
}) => api<{ kind: string; uploadedAt?: string }>('/api/v1/onboarding/documents', {
  method: 'POST',
  body,
  schema: z.object({ kind: z.string(), uploadedAt: z.string().optional() }),
});

export const submitOnboarding = () => api('/api/v1/onboarding/submit', { method: 'POST' });
export const kycStatus = () => api<KycStatus>('/api/v1/kyc/status', { schema: KycStatusSchema });
export const startKyc = () => api('/api/v1/kyc/start', { method: 'POST' });
