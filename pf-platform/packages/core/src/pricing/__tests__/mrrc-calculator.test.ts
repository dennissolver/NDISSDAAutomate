import { describe, it, expect } from 'vitest';
import { calculateMrrc } from '../mrrc-calculator';
import { MRRC_RATES } from '@pf/shared';

describe('MRRC Calculator', () => {
  it('should calculate MRRC from current rates', () => {
    const result = calculateMrrc({
      dspBasicFortnight: MRRC_RATES.dspBasicFortnight,
      pensionSuppFortnight: MRRC_RATES.pensionSuppFortnight,
      craMaxFortnight: MRRC_RATES.craMaxFortnight,
    });

    // 25% of 1116.30 = 279.075 → 279.08
    expect(result.dspComponent).toBeCloseTo(279.08, 1);
    // 25% of 83.20 = 20.80
    expect(result.pensionComponent).toBeCloseTo(20.80, 1);
    // 100% of 188.20 = 188.20
    expect(result.craComponent).toBeCloseTo(188.20, 1);

    expect(result.totalFortnightly).toBeCloseTo(279.08 + 20.80 + 188.20, 0);
    expect(result.totalAnnual).toBeCloseTo(result.totalFortnightly * 26, 0);
    expect(result.totalMonthly).toBeCloseTo(result.totalAnnual / 12, 0);
  });
});
