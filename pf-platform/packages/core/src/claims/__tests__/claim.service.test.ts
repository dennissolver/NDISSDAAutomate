import { describe, it, expect } from 'vitest';
import { generateClaim } from '../claim.service';
import { generateClaimReference } from '../claim-reference';
import { validateClaimDraft } from '../claim.validator';
import {
  BuildingType,
  DesignCategory,
  PlanManagementType,
  PlanStatus,
  SdaEnrolmentStatus,
  ClaimPathway,
} from '@pf/shared';

const mockProperty = {
  id: 'prop-1',
  addressLine1: '50 Champion Drive',
  suburb: 'Rosslea',
  state: 'QLD',
  postcode: '4812',
  propertyLabel: 'Champion Drive',
  buildingType: BuildingType.HOUSE_3_RESIDENTS,
  designCategory: DesignCategory.HIGH_PHYSICAL_SUPPORT,
  hasOoa: true,
  hasBreakoutRoom: false,
  hasFireSprinklers: false,
  locationFactor: 1.08,
  maxResidents: 3,
  sdaEnrolmentStatus: SdaEnrolmentStatus.ENROLLED,
  ownerId: 'client-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockParticipant = {
  id: 'part-1',
  ndisNumber: '123456789',
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: new Date('1990-01-01'),
  planManagementType: PlanManagementType.NDIA_MANAGED,
  planStatus: PlanStatus.ACTIVE,
  paceTransitioned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('generateClaim', () => {
  it('generates a claim draft for full month', () => {
    const result = generateClaim({
      property: mockProperty,
      participant: mockParticipant,
      period: { month: 2, year: 2026 },
    });

    expect(result.claimReference).toMatch(/^PF-2026-02-/);
    expect(result.propertyId).toBe('prop-1');
    expect(result.participantId).toBe('part-1');
    expect(result.claimPathway).toBe(ClaimPathway.NDIA_MANAGED);
    expect(result.sdaAmount).toBeGreaterThan(0);
    expect(result.totalAmount).toBeGreaterThan(0);
  });

  it('generates agency pathway for plan-managed participant', () => {
    const planManaged = { ...mockParticipant, planManagementType: PlanManagementType.PLAN_MANAGED };
    const result = generateClaim({
      property: mockProperty,
      participant: planManaged,
      period: { month: 2, year: 2026 },
    });

    expect(result.claimPathway).toBe(ClaimPathway.AGENCY_MANAGED);
  });

  it('pro-rates for partial month', () => {
    const full = generateClaim({
      property: mockProperty,
      participant: mockParticipant,
      period: { month: 2, year: 2026 },
    });

    const partial = generateClaim({
      property: mockProperty,
      participant: mockParticipant,
      period: { month: 2, year: 2026 },
      occupiedDays: 14,
    });

    expect(partial.sdaAmount).toBeLessThan(full.sdaAmount);
  });
});

describe('generateClaimReference', () => {
  it('generates correct format', () => {
    const ref = generateClaimReference({ month: 2, year: 2026 }, 'Champion Dr', 'Smith');
    expect(ref).toBe('PF-2026-02-CHAMPION-SMITH');
  });
});

describe('validateClaimDraft', () => {
  it('returns no errors for valid draft', () => {
    const draft = generateClaim({
      property: mockProperty,
      participant: mockParticipant,
      period: { month: 2, year: 2026 },
    });
    const errors = validateClaimDraft(draft);
    expect(errors).toHaveLength(0);
  });

  it('rejects negative total amount', () => {
    const draft = {
      claimReference: 'PF-2026-02-TEST-TEST',
      propertyId: 'p1',
      participantId: 'p2',
      claimPathway: 'ndia_managed',
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-02-28'),
      sdaAmount: -100,
      totalAmount: -100,
      ndisItemNumber: '01_012_0107_5_1',
    };
    const errors = validateClaimDraft(draft);
    expect(errors.length).toBeGreaterThan(0);
  });
});
