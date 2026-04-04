// Legacy compatibility: ensure Date formatting uses a sensible default.
// Components should prefer the formatDate/formatCurrency helpers from
// @/lib/locale-format for proper i18n-aware formatting.
// This override remains as a safety net for any code that calls
// toLocaleDateString() without explicit locale arguments.

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

const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;

Date.prototype.toLocaleDateString = function (
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
) {
  const locale = locales ?? LOCALE_MAP[i18n.language] ?? 'en-US';
  const mergedOptions: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    ...options,
  };
  return originalDateToLocaleDateString.call(this, locale, mergedOptions);
};
