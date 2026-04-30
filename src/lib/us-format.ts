import { DEFAULT_US_COUNTRY, DEFAULT_US_COUNTRY_CODE, US_PHONE_REGEX, US_ZIP_REGEX } from "@/constants"
import { formatCurrency, formatDate } from "@/lib/locale-format"

const US_DATE_DEFAULTS: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
}

export function formatUSDate(value?: string | number | Date, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatDate(date, { ...US_DATE_DEFAULTS, ...options })
}

export function formatUSD(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return formatCurrency(0, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  const numeric = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(numeric)) {
    return formatCurrency(0, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return formatCurrency(numeric, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function normalizeUSPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits
}

export function formatUSPhone(value?: string | null) {
  if (!value) return ""
  const digits = normalizeUSPhone(value)
  if (digits.length !== 10) return value
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function validateUSPhone(value: string) {
  return US_PHONE_REGEX.test(value)
}

export function validateUSZip(zip: string) {
  return US_ZIP_REGEX.test(zip)
}

export function getDefaultUSAddress() {
  return {
    country: DEFAULT_US_COUNTRY,
    countryCode: DEFAULT_US_COUNTRY_CODE,
  }
}

