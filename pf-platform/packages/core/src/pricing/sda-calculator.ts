import {
  type SdaPricingInput,
  type SdaPricingResult,
  DesignCategory,
} from '@pf/shared';
import {
  SDA_BASE_RATES_2025_26,
  OOA_SUPPLEMENT_ANNUAL,
  BREAKOUT_ROOM_SUPPLEMENT_ANNUAL,
  FIRE_SPRINKLER_SUPPLEMENT_ANNUAL,
} from '@pf/shared';

/**
 * Calculate the expected annual SDA income for a property.
 *
 * Formula:
 *   (base_rate + supplements) × location_factor = annual SDA amount
 *
 * Supplements:
 *   - OOA (On-site Overnight Assistance)
 *   - Breakout room (Robust category only)
 *   - Fire sprinklers
 */
export function calculateSdaPricing(input: SdaPricingInput): SdaPricingResult {
  const rateKey = `${input.buildingType}|${input.designCategory}`;
  const baseAnnualRate = SDA_BASE_RATES_2025_26[rateKey];

  if (baseAnnualRate === undefined) {
    throw new Error(
      `No SDA rate found for building type "${input.buildingType}" and design category "${input.designCategory}". ` +
      `Note: "Basic" category is not available for new builds.`,
    );
  }

  // Calculate supplements
  const ooaSupplement = input.hasOoa ? OOA_SUPPLEMENT_ANNUAL : 0;
  const breakoutSupplement =
    input.hasBreakoutRoom && input.designCategory === DesignCategory.ROBUST
      ? BREAKOUT_ROOM_SUPPLEMENT_ANNUAL
      : 0;
  const fireSprinklerSupplement = input.hasFireSprinklers
    ? FIRE_SPRINKLER_SUPPLEMENT_ANNUAL
    : 0;

  const subtotalBeforeLocation =
    baseAnnualRate + ooaSupplement + breakoutSupplement + fireSprinklerSupplement;

  const annualSdaAmount = Math.round(subtotalBeforeLocation * input.locationFactor * 100) / 100;
  const monthlySdaAmount = Math.round((annualSdaAmount / 12) * 100) / 100;
  const dailySdaAmount = Math.round((annualSdaAmount / 365) * 100) / 100;

  return {
    baseAnnualRate,
    ooaSupplement,
    breakoutSupplement,
    fireSprinklerSupplement,
    subtotalBeforeLocation,
    locationFactor: input.locationFactor,
    annualSdaAmount,
    monthlySdaAmount,
    dailySdaAmount,
  };
}
