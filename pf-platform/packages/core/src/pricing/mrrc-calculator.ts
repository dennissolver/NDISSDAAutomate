import {
  type MrrcInput,
  type MrrcResult,
} from '@pf/shared';
import {
  DSP_PERCENTAGE,
  PENSION_SUPP_PERCENTAGE,
  CRA_PERCENTAGE,
  FORTNIGHTS_PER_YEAR,
  MONTHS_PER_YEAR,
} from '@pf/shared';

/**
 * Calculate Maximum Reasonable Rent Contribution (MRRC).
 *
 * Formula (per fortnight):
 *   25% of max basic DSP
 *   + 25% of max Pension Supplement
 *   + 100% of max Commonwealth Rent Assistance
 *
 * This is the amount the tenant (participant) pays as rent.
 */
export function calculateMrrc(input: MrrcInput): MrrcResult {
  const dspComponent = Math.round(input.dspBasicFortnight * DSP_PERCENTAGE * 100) / 100;
  const pensionComponent = Math.round(input.pensionSuppFortnight * PENSION_SUPP_PERCENTAGE * 100) / 100;
  const craComponent = Math.round(input.craMaxFortnight * CRA_PERCENTAGE * 100) / 100;

  const totalFortnightly = Math.round((dspComponent + pensionComponent + craComponent) * 100) / 100;
  const totalAnnual = Math.round(totalFortnightly * FORTNIGHTS_PER_YEAR * 100) / 100;
  const totalMonthly = Math.round((totalAnnual / MONTHS_PER_YEAR) * 100) / 100;

  return {
    dspComponent,
    pensionComponent,
    craComponent,
    totalFortnightly,
    totalMonthly,
    totalAnnual,
  };
}
