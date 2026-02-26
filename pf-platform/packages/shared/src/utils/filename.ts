import type { Period } from '../types/common.types';
import { periodToString } from './dates';

/**
 * Generate PF-standard filenames.
 * Convention from PF Training Manual: "Reconciliation Stmt # for (month)"
 */
export function reconFilename(statementNumber: number, period: Period): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[period.month - 1];
  return `Reconciliation Stmt ${statementNumber} for ${monthName} ${period.year}`;
}

/** Generate claim reference: PF-2026-02-{propertyShort}-{participantShort} */
export function claimReference(
  period: Period,
  propertyLabel: string,
  participantLastName: string,
): string {
  const periodStr = periodToString(period);
  const propShort = propertyLabel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const partShort = participantLastName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
  return `PF-${periodStr}-${propShort}-${partShort}`;
}
