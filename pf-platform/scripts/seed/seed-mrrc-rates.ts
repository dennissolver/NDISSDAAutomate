import { createServerClient } from '@pf/db';
import { MRRC_RATES } from '@pf/shared';

async function seedMrrcRates() {
  const db = createServerClient();

  const row = {
    effective_from: MRRC_RATES.effectiveFrom,
    dsp_basic_fortnight: MRRC_RATES.dspBasicFortnight,
    pension_supp_fortnight: MRRC_RATES.pensionSuppFortnight,
    cra_max_fortnight: MRRC_RATES.craMaxFortnight,
  };

  const { data, error } = await db
    .from('mrrc_rates')
    .upsert(row, { onConflict: 'effective_from' })
    .select();

  if (error) {
    console.error('Failed to seed MRRC rates:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} MRRC rate row (effective ${MRRC_RATES.effectiveFrom})`);
}

seedMrrcRates();
