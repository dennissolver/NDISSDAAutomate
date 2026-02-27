import {
  type ReconciliationInput,
  type ReconciliationResult,
  LineItemCategory,
  LineItemSource,
  ReconStatus,
} from '@pf/shared';
import {
  calculateFees,
  calculateTotalMoneyIn,
  calculateNetClientPayout,
  sumByCategory,
} from './reconciliation.calculator';

export interface ReconciliationConfig {
  agencyFeeRate: number; // From the rental agency record
}

/**
 * Reconciliation Engine.
 *
 * Takes parsed rental statement line items + SDA subsidy amount,
 * calculates all fees and deductions, and produces the complete
 * reconciliation result.
 *
 * This replaces the manual spreadsheet copy-paste process described
 * in the PF Training Manual.
 */
export function generateReconciliation(
  input: ReconciliationInput,
  config: ReconciliationConfig,
): ReconciliationResult {
  // Ensure SDA subsidy is in line items
  const lineItems = [...input.lineItems];
  const hasSdaItem = lineItems.some(
    (item) => item.category === LineItemCategory.SDA_SUBSIDY,
  );
  if (!hasSdaItem && input.sdaSubsidyAmount > 0) {
    lineItems.push({
      category: LineItemCategory.SDA_SUBSIDY,
      description: 'SDA Government Subsidy (PRODA claim)',
      amount: input.sdaSubsidyAmount,
      source: LineItemSource.PRODA_CLAIM,
    });
  }

  // Sum by category
  const totalRentReceived = sumByCategory(lineItems, LineItemCategory.RENT);
  const totalSdaSubsidy = sumByCategory(lineItems, LineItemCategory.SDA_SUBSIDY);
  const energyReimbursement = sumByCategory(lineItems, LineItemCategory.ENERGY_REIMBURSEMENT);
  const energyInvoiceAmount = Math.abs(
    sumByCategory(lineItems, LineItemCategory.ENERGY_INVOICE),
  );
  const maintenanceCosts = Math.abs(
    sumByCategory(lineItems, LineItemCategory.MAINTENANCE),
  );
  const otherDeductions = Math.abs(
    sumByCategory(lineItems, LineItemCategory.OTHER),
  );

  // Calculate totals
  const totalMoneyIn = calculateTotalMoneyIn(totalRentReceived, totalSdaSubsidy);

  // Calculate fees
  const fees = calculateFees({
    totalMoneyIn,
    agencyFeeRate: config.agencyFeeRate,
  });

  // Calculate net client payout
  const netClientPayout = calculateNetClientPayout(
    totalMoneyIn,
    fees.agencyManagementFee,
    fees.pfManagementFee,
    maintenanceCosts,
    otherDeductions,
  );

  return {
    propertyId: input.propertyId,
    period: input.period,
    status: ReconStatus.GENERATED,
    statementNumber: input.statementNumber,

    totalRentReceived,
    totalSdaSubsidy,
    totalMoneyIn,

    agencyManagementFee: fees.agencyManagementFee,
    pfManagementFee: fees.pfManagementFee,
    gstPayable: fees.gstOnPfFee,
    energyReimbursement,
    energyInvoiceAmount,
    maintenanceCosts,
    otherDeductions,

    netClientPayout,

    lineItems,
  };
}
