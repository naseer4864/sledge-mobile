import { z } from 'zod';
import { api, setTokens, clearTokens, getTokens } from './api';

export const AuthTokensSchema = z.object({ accessToken: z.string(), refreshToken: z.string(), expiresIn: z.number() });
export const UserSchema = z.object({ customerId: z.string(), email: z.string().email(), firstName: z.string().optional(), lastName: z.string().optional(), kycStatus: z.string().optional() }).loose();
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type User = z.infer<typeof UserSchema>;

const LoginRes = z.union([
  AuthTokensSchema.extend({ customer: UserSchema }),
  z.object({ mfaRequired: z.literal(true), mfaTicket: z.string() }),
]);

export async function login(email: string, password: string) {
  const res = await api<z.infer<typeof LoginRes>>('/api/v1/auth/login', {
    method: 'POST', body: { email, password }, schema: LoginRes, skipAuth: true,
  });
  if ('mfaRequired' in res) return res;
  await setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function verifyEmailCode(token: string) {
  const res = await api<z.infer<typeof AuthTokensSchema>>('/api/v1/auth/email/verify', {
    method: 'POST',
    body: { token },
    schema: AuthTokensSchema,
    skipAuth: true,
  });
  await setTokens(res.accessToken, res.refreshToken);
  return me();
}

export const me = () => api<User>('/api/v1/auth/me', { schema: z.object({ customer: UserSchema }).transform((r) => r.customer) });
export async function logout() {
  const { refreshToken } = await getTokens();
  // skipAuth: never let logout trigger a refresh — the body identifies the session.
  if (refreshToken) {
    await api('/api/v1/auth/logout', { method: 'POST', body: { refreshToken }, skipAuth: true }).catch(() => {});
  }
  await clearTokens();
}
export const register = (body: { email: string; password: string; firstName?: string; lastName?: string }) =>
  api('/api/v1/auth/register', { method: 'POST', body, skipAuth: true });
export const forgotPassword = (email: string) => api('/api/v1/auth/password/forgot', { method: 'POST', body: { email }, skipAuth: true });
