import { createContext, useContext, type ReactNode } from 'react';
import { colors, type Palette } from '../theme/colors';

// COIN mobile ships light-first (dark removed per product direction).
const Ctx = createContext<{ mode: 'light'; resolved: 'light'; setMode: (m: string) => void; colors: Palette }>({
  mode: 'light', resolved: 'light', setMode: () => {}, colors: colors.light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ mode: 'light', resolved: 'light', setMode: () => {}, colors: colors.light }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
