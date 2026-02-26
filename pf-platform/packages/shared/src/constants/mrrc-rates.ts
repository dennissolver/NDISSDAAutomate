/**
 * MRRC (Maximum Reasonable Rent Contribution) component rates.
 * Formula: 25% of DSP + 25% of Pension Supplement + 100% of CRA
 *
 * Rates are per FORTNIGHT.
 * Updated ~2x per year when DSS publishes new rates (March + September).
 *
 * These are the rates as of March 2025. Verify against current DSS publications.
 */
export const MRRC_RATES = {
  effectiveFrom: '2025-03-20',
  dspBasicFortnight: 1116.30,      // Max basic rate Disability Support Pension
  pensionSuppFortnight: 83.20,     // Max Pension Supplement
  craMaxFortnight: 188.20,         // Max Commonwealth Rent Assistance
};

/**
 * MRRC formula constants.
 */
export const DSP_PERCENTAGE = 0.25;
export const PENSION_SUPP_PERCENTAGE = 0.25;
export const CRA_PERCENTAGE = 1.0;

/**
 * Conversion factors.
 */
export const FORTNIGHTS_PER_YEAR = 26;
export const MONTHS_PER_YEAR = 12;
