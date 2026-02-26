import { describe, it, expect } from 'vitest';
import { calculateFees, calculateNetClientPayout } from '../reconciliation.calculator';
import { toCents } from '@pf/shared';

describe('Fee Calculator', () => {
  it('should calculate fees correctly for standard case', () => {
    const result = calculateFees({
      totalMoneyIn: toCents(4300),
      agencyFeeRate: 0.044,
    });
    expect(result.agencyManagementFee).toBe(Math.round(430000 * 0.044));
    expect(result.pfManagementFee).toBe(Math.round(430000 * 0.088));
  });

  it('should calculate GST as 1/11 of PF fee', () => {
    const result = calculateFees({
      totalMoneyIn: toCents(11000),
      agencyFeeRate: 0.044,
    });
    const expectedPfFee = Math.round(1100000 * 0.088);
    const expectedGst = Math.round(expectedPfFee / 11);
    expect(result.gstOnPfFee).toBe(expectedGst);
  });
});

describe('Net Client Payout', () => {
  it('should subtract all fees and costs from total money in', () => {
    const payout = calculateNetClientPayout(
      toCents(4300), // total money in
      toCents(189),  // agency fee
      toCents(378),  // PF fee
      toCents(220),  // maintenance
      toCents(0),    // other
    );
    expect(payout).toBe(toCents(4300 - 189 - 378 - 220));
  });
});
