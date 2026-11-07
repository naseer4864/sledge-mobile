// Decimal-safe display formatting — never arithmetic on floats.
export function maskAmount(hidden: boolean, value: string): string {
  return hidden ? '••••••' : value;
}

export function formatAtomic(amount: string, decimals: number): string {
  if (!/^\d+$/.test(amount)) return '0';
  const padded = amount.padStart(decimals + 1, '0');
  const int = decimals === 0 ? padded : padded.slice(0, -decimals);
  const frac = decimals === 0 ? '' : padded.slice(-decimals).replace(/0+$/, '');
  return frac ? `${int}.${frac}` : int;
}
