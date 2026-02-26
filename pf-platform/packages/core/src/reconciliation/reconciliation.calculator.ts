import {
  type Cents,
  type ReconciliationLineItemInput,
  LineItemCategory,
  percentOf,
  sumCents,
  gstFromInclusive,
} from '@pf/shared';
import { PF_FEE_RATE } from '@pf/shared';

export interface FeeCalculationInput {
  totalMoneyIn: Cents;
  agencyFeeRate: number;
}

export interface FeeCalculationResult {
  agencyManagementFee: Cents;
  pfManagementFee: Cents;
  gstOnPfFee: Cents;
  totalFees: Cents;
}

/**
 * Calculate management fees from total money in.
 * Agency fee: variable rate (e.g. 4.4%) of total money in
 * PF fee: 8.8% of total money in
 * GST: applied to PF fee (1/11 of GST-inclusive PF fee)
 */
export function calculateFees(input: FeeCalculationInput): FeeCalculationResult {
  const agencyManagementFee = percentOf(input.totalMoneyIn, input.agencyFeeRate);
  const pfManagementFee = percentOf(input.totalMoneyIn, PF_FEE_RATE);
  const gstOnPfFee = gstFromInclusive(pfManagementFee);

  return {
    agencyManagementFee,
    pfManagementFee,
    gstOnPfFee,
    totalFees: sumCents(agencyManagementFee, pfManagementFee),
  };
}

/**
 * Sum line items by category.
 */
export function sumByCategory(
  lineItems: ReconciliationLineItemInput[],
  category: LineItemCategory,
): Cents {
  return lineItems
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate total money in (rent + SDA subsidy).
 */
export function calculateTotalMoneyIn(
  totalRent: Cents,
  sdaSubsidy: Cents,
): Cents {
  return sumCents(totalRent, sdaSubsidy);
}

/**
 * Calculate net client payout.
 * = total money in - agency fee - PF fee - maintenance - other deductions
 *
 * Energy reimbursement and energy invoice should net to zero
 * (tenant pays back what the energy company invoiced).
 */
export function calculateNetClientPayout(
  totalMoneyIn: Cents,
  agencyFee: Cents,
  pfFee: Cents,
  maintenanceCosts: Cents,
  otherDeductions: Cents,
): Cents {
  return totalMoneyIn - agencyFee - pfFee - maintenanceCosts - otherDeductions;
}
