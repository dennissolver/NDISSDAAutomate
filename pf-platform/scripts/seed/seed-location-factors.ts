import { createServerClient } from '@pf/db';
import { LOCATION_FACTORS } from '@pf/shared';
import { CURRENT_FINANCIAL_YEAR } from '@pf/shared';

async function seedLocationFactors() {
  const db = createServerClient();

  const rows = Object.entries(LOCATION_FACTORS).map(([regionName, { state, factor }]) => ({
    region_name: regionName,
    state,
    factor,
    financial_year: CURRENT_FINANCIAL_YEAR,
  }));

  const { data, error } = await db
    .from('location_factors')
    .upsert(rows, { onConflict: 'region_name,financial_year' })
    .select();

  if (error) {
    console.error('Failed to seed location factors:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} location factors for FY ${CURRENT_FINANCIAL_YEAR}`);
}

seedLocationFactors();
