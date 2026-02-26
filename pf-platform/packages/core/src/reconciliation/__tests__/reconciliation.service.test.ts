import { describe, it, expect } from 'vitest';
import { generateReconciliation } from '../reconciliation.service';
import { LineItemCategory, LineItemSource, ReconStatus, toCents } from '@pf/shared';

describe('Reconciliation Engine', () => {
  const baseInput = {
    propertyId: 'prop-001',
    period: { month: 2, year: 2026 },
    statementNumber: 13,
    sdaSubsidyAmount: toCents(3500),
    lineItems: [
      {
        category: LineItemCategory.RENT,
        description: 'Tenant rent - February 2026',
        amount: toCents(800),
        source: LineItemSource.RENTAL_STATEMENT,
        sourceReference: 'Stmt 13',
      },
      {
        category: LineItemCategory.ENERGY_REIMBURSEMENT,
        description: 'Energy reimbursement from tenant',
        amount: toCents(150),
        source: LineItemSource.RENTAL_STATEMENT,
      },
      {
        category: LineItemCategory.ENERGY_INVOICE,
        description: 'Energy company invoice',
        amount: toCents(-150),
        source: LineItemSource.ENERGY_INVOICE,
      },
      {
        category: LineItemCategory.MAINTENANCE,
        description: 'Plumbing repair',
        amount: toCents(-220),
        source: LineItemSource.RENTAL_STATEMENT,
      },
    ],
  };

  const config = { agencyFeeRate: 0.044 };

  it('should calculate total money in as rent + SDA subsidy', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.totalRentReceived).toBe(toCents(800));
    expect(result.totalSdaSubsidy).toBe(toCents(3500));
    expect(result.totalMoneyIn).toBe(toCents(4300));
  });

  it('should calculate agency fee at 4.4%', () => {
    const result = generateReconciliation(baseInput, config);
    // 4300 * 0.044 = 189.20 → 18920 cents
    expect(result.agencyManagementFee).toBe(Math.round(toCents(4300) * 0.044));
  });

  it('should calculate PF fee at 8.8%', () => {
    const result = generateReconciliation(baseInput, config);
    // 4300 * 0.088 = 378.40 → 37840 cents
    expect(result.pfManagementFee).toBe(Math.round(toCents(4300) * 0.088));
  });

  it('should produce positive net client payout', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.netClientPayout).toBeGreaterThan(0);
  });

  it('should set status to GENERATED', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.status).toBe(ReconStatus.GENERATED);
  });

  it('should capture maintenance costs', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.maintenanceCosts).toBe(toCents(220));
  });

  it('should include SDA subsidy line item even if not in input', () => {
    const result = generateReconciliation(baseInput, config);
    const sdaItems = result.lineItems.filter(
      (i) => i.category === LineItemCategory.SDA_SUBSIDY,
    );
    expect(sdaItems.length).toBe(1);
    expect(sdaItems[0].amount).toBe(toCents(3500));
  });
});
