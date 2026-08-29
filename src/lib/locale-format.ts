export function getCurrentLocale(): string {
  return 'en-US';
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a value for display. Bare `YYYY-MM-DD` strings are calendar dates
 * (local midnight), not UTC instants — `new Date("2026-09-05")` would otherwise
 * shift a day in US timezones.
 */
export function toDisplayDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const match = DATE_ONLY_RE.exec(value.trim());
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return new Date(value);
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toDisplayDate(date);
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
  const d = toDisplayDate(date);
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

export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toDisplayDate(date);
  const mergedOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return d.toLocaleTimeString(getCurrentLocale(), mergedOptions);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
}

/** Hide empty API numerics (`null` arrives even when the TS field is optional). */
export function formatOptionalNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return formatNumber(value, options);
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
