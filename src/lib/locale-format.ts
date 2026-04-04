import i18n from '@/lib/i18n';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
};

function getCurrentLocale(): string {
  return LOCALE_MAP[i18n.language] ?? 'en-US';
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  const mergedOptions: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    ...options,
  };
  return d.toLocaleDateString(getCurrentLocale(), mergedOptions);
}

export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  const mergedOptions: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return d.toLocaleString(getCurrentLocale(), mergedOptions);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}
