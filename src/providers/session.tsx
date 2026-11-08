import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { me, login as svcLogin, logout as svcLogout, register as svcRegister, verifyEmailCode as svcVerifyEmailCode, type User } from '../services/auth';
import { registerForPush, unregisterForLogout } from '../services/push';
import { getTokens, setTokens } from '../services/api';

type State =
  | { kind: 'loading' }
  | { kind: 'unauthenticated' }
  | { kind: 'mfa'; ticket: string }
  | { kind: 'authenticated'; user: User };

interface SessionCtx {
  state: State;
  login: (email: string, password: string) => Promise<void>;
  register: (body: Parameters<typeof svcRegister>[0]) => Promise<void>;
  completeEmailVerification: (code: string) => Promise<void>;
  completeMfa: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionCtx>({
  state: { kind: 'loading' },
  login: async () => {}, register: async () => {}, completeEmailVerification: async () => {}, completeMfa: async () => {}, logout: async () => {}, refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    (async () => {
      const { accessToken, refreshToken } = await getTokens();
      if (!accessToken || !refreshToken) { setState({ kind: 'unauthenticated' }); return; }
      try { const user = await me(); setState({ kind: 'authenticated', user }); }
      catch { setState({ kind: 'unauthenticated' }); }
    })();
  }, []);

  const value: SessionCtx = {
    state,
    login: async (email, password) => {
      const res = await svcLogin(email, password);
      if ('mfaRequired' in res) setState({ kind: 'mfa', ticket: res.mfaTicket });
      else { setState({ kind: 'authenticated', user: res.customer }); registerForPush().catch(() => {}); }
    },
    register: async (body) => {
      const res = await svcRegister(body);
      if (res && typeof res === 'object' && 'accessToken' in res && 'refreshToken' in res) {
        await me().then((user) => setState({ kind: 'authenticated', user }));
      }
    },
    completeEmailVerification: async (code) => {
      const user = await svcVerifyEmailCode(code);
      setState({ kind: 'authenticated', user });
      registerForPush().catch(() => {});
    },
    completeMfa: async (accessToken, refreshToken) => {
      
      await setTokens(accessToken, refreshToken);
      const user = await me();
      setState({ kind: 'authenticated', user });
    },
    logout: async () => { await svcLogout(); unregisterForLogout().catch(() => {}); qc.clear(); setState({ kind: 'unauthenticated' }); },
    refresh: async () => {
      try { const user = await me(); setState({ kind: 'authenticated', user }); }
      catch { setState({ kind: 'unauthenticated' }); }
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
