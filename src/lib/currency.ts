export function currencyDisplayDigits(currency: string): { min: number; max: number } {
  const normalized = currency.toUpperCase();
  if (normalized === 'CKB') return { min: 2, max: 8 };
  if (normalized === 'USDC') return { min: 2, max: 6 };
  return { min: 2, max: 4 };
}

export function formatCurrencyAmount(value: number, currency: string, maxDigits?: number): string {
  const digits = currencyDisplayDigits(currency);
  const maximumFractionDigits = maxDigits ?? digits.max;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: Math.min(digits.min, maximumFractionDigits),
    maximumFractionDigits
  });

  if (currency.toUpperCase() === 'USDC') return '$' + formatted + ' USDC';
  return formatted + ' ' + currency;
}

export function formatCurrencyNumber(value: number, currency: string, maxDigits?: number): string {
  const digits = currencyDisplayDigits(currency);
  const maximumFractionDigits = maxDigits ?? digits.max;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Math.min(digits.min, maximumFractionDigits),
    maximumFractionDigits
  });
}
