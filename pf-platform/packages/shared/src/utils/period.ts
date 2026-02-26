import type { Period } from '../types/common.types';

/** Get previous period */
export function previousPeriod(period: Period): Period {
  if (period.month === 1) {
    return { month: 12, year: period.year - 1 };
  }
  return { month: period.month - 1, year: period.year };
}

/** Get next period */
export function nextPeriod(period: Period): Period {
  if (period.month === 12) {
    return { month: 1, year: period.year + 1 };
  }
  return { month: period.month + 1, year: period.year };
}

/** Compare two periods: -1 (a before b), 0 (equal), 1 (a after b) */
export function comparePeriods(a: Period, b: Period): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  return 0;
}

/** Check if a period is within a financial year (July to June) */
export function isInFinancialYear(period: Period, fyStartYear: number): boolean {
  if (period.year === fyStartYear && period.month >= 7) return true;
  if (period.year === fyStartYear + 1 && period.month <= 6) return true;
  return false;
}
