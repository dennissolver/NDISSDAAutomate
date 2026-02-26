import type { Period } from '../types/common.types';

/** Format date as AU standard: DD/MM/YYYY */
export function formatDateAu(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format date as US for PRODA CSV: YYYY/MM/DD */
export function formatDatePrrodaCsv(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/** Get first day of a period */
export function periodStart(period: Period): Date {
  return new Date(period.year, period.month - 1, 1);
}

/** Get last day of a period */
export function periodEnd(period: Period): Date {
  return new Date(period.year, period.month, 0);
}

/** Get number of days in a period */
export function daysInPeriod(period: Period): number {
  return periodEnd(period).getDate();
}

/** Get current period */
export function currentPeriod(): Period {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** Format period as display string: "February 2026" */
export function formatPeriod(period: Period): string {
  const date = new Date(period.year, period.month - 1);
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

/** Format period as file-safe string: "2026-02" */
export function periodToString(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

/** Detect financial year from a date: e.g. "2025-26" */
export function financialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 7) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/** Calculate pro-rata days for mid-month occupancy */
export function proRataDays(
  periodDays: number,
  moveInDate?: Date,
  moveOutDate?: Date,
  period?: Period,
): number {
  if (!period) return periodDays;
  const start = periodStart(period);
  const end = periodEnd(period);

  const effectiveStart = moveInDate && moveInDate > start ? moveInDate : start;
  const effectiveEnd = moveOutDate && moveOutDate < end ? moveOutDate : end;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
}
