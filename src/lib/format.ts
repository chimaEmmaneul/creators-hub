const LOCALE = "en-US";

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" });
const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat(LOCALE);
const percentFormatter = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { year: "numeric", month: "short", day: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });
const regionNames = new Intl.DisplayNames([LOCALE], { type: "region" });

export const formatCurrency = (cents: number) => currencyFormatter.format(cents / 100);
export const formatCompactNumber = (value: number) => compactFormatter.format(value);
export const formatInteger = (value: number) => integerFormatter.format(value);
export const formatPercentChange = (ratio: number) => percentFormatter.format(ratio);
export const formatDate = (iso: string | Date) => dateFormatter.format(new Date(iso));
export const formatDateTime = (iso: string | Date) => dateTimeFormatter.format(new Date(iso));

export const formatDayKey = (dayKey: string) => shortDateFormatter.format(new Date(`${dayKey}T00:00:00Z`));

export function formatCountry(code: string) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + (char.codePointAt(0) ?? 0)));
}

export function formatFileSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function dollarsToCents(input: string) {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  return Math.round(Number(trimmed) * 100);
}

export const centsToDollarInput = (cents: number) => (cents / 100).toFixed(2);
