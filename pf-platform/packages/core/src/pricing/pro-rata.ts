import type { Period } from '@pf/shared';
import { daysInPeriod } from '@pf/shared';

/**
 * Calculate pro-rata amount for partial-month occupancy.
 * Used when a participant moves in or out mid-month.
 */
export function proRataAmount(
  monthlyAmount: number,
  occupiedDays: number,
  period: Period,
): number {
  const totalDays = daysInPeriod(period);
  if (occupiedDays >= totalDays) return monthlyAmount;
  return Math.round((monthlyAmount * occupiedDays / totalDays) * 100) / 100;
}
