export interface Palette { bg: string; surface: string; surfaceMuted: string; text: string; textMuted: string; border: string }

export const colors = {
  brand: { emerald: '#00B894', navy: '#101B2D', blue: '#4778F5' },
  light: { bg: '#F5F7FA', surface: '#FFFFFF', surfaceMuted: '#FAFBFC', text: '#172033', textMuted: '#667085', border: '#E4E9F0' } as Palette,
  dark: { bg: '#0D1622', surface: '#17263B', surfaceMuted: '#1C2D45', text: '#F4F7FB', textMuted: '#B8C5D6', border: '#2A3B52' } as Palette,
  status: { success: '#12B76A', warning: '#F79009', danger: '#F04438' },
} as const;
