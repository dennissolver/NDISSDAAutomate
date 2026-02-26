import type { ReconciliationResult } from '@pf/shared';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a generated reconciliation before approval.
 * Catches common errors that would otherwise be found manually.
 */
export function validateReconciliation(
  recon: ReconciliationResult,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Total money in must be positive
  if (recon.totalMoneyIn <= 0) {
    errors.push({
      field: 'totalMoneyIn',
      message: 'Total money in must be greater than zero',
    });
  }

  // Net payout should not be negative (unusual, flag for review)
  if (recon.netClientPayout < 0) {
    errors.push({
      field: 'netClientPayout',
      message: 'Net client payout is negative — review deductions',
    });
  }

  // Energy reimbursement should roughly match energy invoice
  // (tenant pays back what energy company charged)
  if (recon.energyReimbursement > 0 && recon.energyInvoiceAmount > 0) {
    const diff = Math.abs(recon.energyReimbursement - recon.energyInvoiceAmount);
    if (diff > 100) {
      // More than $1 difference
      errors.push({
        field: 'energy',
        message: `Energy reimbursement and invoice differ by ${(diff / 100).toFixed(2)} — should net to zero`,
      });
    }
  }

  // PF fee should be approximately 8.8% of total money in
  const expectedPfFee = Math.round(recon.totalMoneyIn * 0.088);
  if (Math.abs(recon.pfManagementFee - expectedPfFee) > 10) {
    errors.push({
      field: 'pfManagementFee',
      message: 'PF management fee does not match expected 8.8% rate',
    });
  }

  return errors;
}
