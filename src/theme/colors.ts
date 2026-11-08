export interface Palette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
}

export const colors = {
  brand: {
    emerald: '#00B887',
    emeraldBright: '#00D6A0',
    emeraldDeep: '#003D32',
    forest: '#004C3F',
    mint: '#C9F5E8',
    mintDark: '#064E3B',
    navy: '#071714',
    blue: '#758780',
  },
  light: {
    bg: '#F4F8F7',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F8F7',
    text: '#14231F',
    textMuted: '#758780',
    border: '#E1EBE7',
  } as Palette,
  dark: {
    bg: '#071714',
    surface: '#10231F',
    surfaceMuted: '#064E3B',
    text: '#F4FAF7',
    textMuted: '#91A69E',
    border: '#29463E',
  } as Palette,
  status: { success: '#12B76A', warning: '#F79009', danger: '#F04438' },
  shadow: {
    soft: {
      shadowColor: '#003D32',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 3,
    },
    raised: {
      shadowColor: '#003D32',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 7,
    },
  },
} as const;
