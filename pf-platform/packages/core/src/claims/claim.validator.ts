import type { Cents, Period } from '@pf/shared';
import type { ValidationError } from '../reconciliation';

export interface ClaimDraft {
  claimReference: string;
  propertyId: string;
  participantId: string;
  claimPathway: string;
  periodStart: Date;
  periodEnd: Date;
  sdaAmount: Cents;
  mrrcAmount?: Cents;
  totalAmount: Cents;
  ndisItemNumber: string;
}

export function validateClaimDraft(draft: ClaimDraft, bookingAllocatedAmount?: Cents, bookingRemainingAmount?: Cents): ValidationError[] {
  const errors: ValidationError[] = [];

  if (draft.totalAmount <= 0) {
    errors.push({ field: 'totalAmount', message: 'Total claim amount must be positive' });
  }
  if (draft.sdaAmount <= 0) {
    errors.push({ field: 'sdaAmount', message: 'SDA amount must be positive' });
  }
  if (draft.periodEnd <= draft.periodStart) {
    errors.push({ field: 'periodEnd', message: 'Period end must be after period start' });
  }
  if (!draft.claimReference.startsWith('PF-')) {
    errors.push({ field: 'claimReference', message: 'Claim reference must start with PF-' });
  }
  if (bookingRemainingAmount !== undefined && draft.sdaAmount > bookingRemainingAmount) {
    errors.push({ field: 'sdaAmount', message: `SDA amount exceeds booking remaining amount (${bookingRemainingAmount})` });
  }

  return errors;
}
