import { createServerClient } from '@pf/db';
import {
  SDA_BASE_RATES_2025_26,
  OOA_SUPPLEMENT_ANNUAL,
  BREAKOUT_ROOM_SUPPLEMENT_ANNUAL,
  FIRE_SPRINKLER_SUPPLEMENT_ANNUAL,
  CURRENT_FINANCIAL_YEAR,
} from '@pf/shared';

async function seedSdaRates() {
  const db = createServerClient();

  const rows = Object.entries(SDA_BASE_RATES_2025_26).map(([key, baseRate]) => {
    const [building_type, design_category] = key.split('|');
    return {
      financial_year: CURRENT_FINANCIAL_YEAR,
      building_type,
      design_category,
      base_annual_rate: baseRate,
      ooa_supplement: OOA_SUPPLEMENT_ANNUAL,
      breakout_supplement: BREAKOUT_ROOM_SUPPLEMENT_ANNUAL,
      fire_sprinkler_supp: FIRE_SPRINKLER_SUPPLEMENT_ANNUAL,
      effective_from: '2025-07-01',
    };
  });

  const { data, error } = await db
    .from('sda_pricing_rates')
    .upsert(rows, { onConflict: 'financial_year,building_type,design_category' })
    .select();

  if (error) {
    console.error('Failed to seed SDA rates:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} SDA pricing rates for FY ${CURRENT_FINANCIAL_YEAR}`);
}

seedSdaRates();
