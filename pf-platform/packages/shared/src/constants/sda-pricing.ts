import { BuildingType, DesignCategory } from '../types/pricing.types';

/**
 * SDA base annual rates for FY 2025-26.
 * Source: NDIS Pricing Arrangements for Specialist Disability Accommodation.
 * Updated each July.
 *
 * Key: `${BuildingType}|${DesignCategory}`
 * Value: base annual rate in dollars (before location factor)
 *
 * NOTE: These are approximate rates for development. Actual rates must be
 * verified against the published NDIS SDA Pricing Arrangements before
 * production use. Rates are seeded into sda_pricing_rates table.
 */
export const SDA_BASE_RATES_2025_26: Record<string, number> = {
  // House, 2 residents
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 26380,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 41400,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.ROBUST}`]: 46170,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 56880,

  // House, 3 residents
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 19650,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 30140,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.ROBUST}`]: 33630,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 40660,

  // Villa/duplex/townhouse, 1 resident
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 36950,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.FULLY_ACCESSIBLE}`]: 54530,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.ROBUST}`]: 60810,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 73460,

  // Villa/duplex/townhouse, 2 residents
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 22400,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 34670,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.ROBUST}`]: 38680,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 47210,
};

/**
 * Supplement amounts (annual, before location factor).
 * NOTE: Approximate — verify against published NDIS data.
 */
export const OOA_SUPPLEMENT_ANNUAL = 11600;
export const BREAKOUT_ROOM_SUPPLEMENT_ANNUAL = 3680;
export const FIRE_SPRINKLER_SUPPLEMENT_ANNUAL = 2930;

export const CURRENT_FINANCIAL_YEAR = '2025-26';
