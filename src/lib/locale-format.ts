export function getCurrentLocale(): string {
  return 'en-US';
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

export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
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
