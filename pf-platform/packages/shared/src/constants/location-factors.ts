/**
 * NDIS SDA Location Factors for FY 2025-26.
 * Multiplied against the base SDA rate.
 *
 * NOTE: This is a subset for development. Full table must be loaded
 * from the NDIS published location factors sheet into the
 * location_factors Supabase table.
 */
export const LOCATION_FACTORS: Record<string, { state: string; factor: number }> = {
  'Townsville': { state: 'QLD', factor: 1.08 },
  'Brisbane': { state: 'QLD', factor: 1.04 },
  'Gold Coast': { state: 'QLD', factor: 1.03 },
  'Cairns': { state: 'QLD', factor: 1.12 },
  'Sydney': { state: 'NSW', factor: 1.14 },
  'Melbourne': { state: 'VIC', factor: 1.06 },
  'Adelaide': { state: 'SA', factor: 1.00 },
  'Perth': { state: 'WA', factor: 1.09 },
  'Darwin': { state: 'NT', factor: 1.29 },
  'Hobart': { state: 'TAS', factor: 1.02 },
};
