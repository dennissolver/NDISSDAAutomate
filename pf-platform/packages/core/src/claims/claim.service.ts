import {
  type Participant,
  type Property,
  type Period,
  type Cents,
  type SdaPricingInput,
  ClaimPathway,
  PlanManagementType,
  ClaimStatus,
  toCents,
  daysInPeriod,
  periodStart,
  periodEnd,
} from '@pf/shared';
import { SDA_ITEM_CODES } from '@pf/shared';
import { calculateSdaPricing } from '../pricing';
import { proRataAmount } from '../pricing';
import { generateClaimReference } from './claim-reference';
import type { ClaimDraft } from './claim.validator';

export interface GenerateClaimInput {
  property: Property;
  participant: Participant;
  period: Period;
  occupiedDays?: number; // If not provided, assume full month
  mrrcFortnightly?: Cents;
}

export function generateClaim(input: GenerateClaimInput): ClaimDraft {
  const { property, participant, period } = input;

  // Calculate SDA pricing for property
  const sdaPricing = calculateSdaPricing({
    buildingType: property.buildingType,
    designCategory: property.designCategory,
    hasOoa: property.hasOoa,
    hasBreakoutRoom: property.hasBreakoutRoom,
    hasFireSprinklers: property.hasFireSprinklers,
    locationFactor: property.locationFactor,
  });

  // Calculate monthly SDA amount (pro-rated if partial month)
  const totalDays = daysInPeriod(period);
  const occupiedDays = input.occupiedDays ?? totalDays;
  const sdaMonthlyCents = toCents(sdaPricing.monthlySdaAmount);
  const sdaAmount = occupiedDays < totalDays
    ? toCents(proRataAmount(sdaPricing.monthlySdaAmount, occupiedDays, period))
    : sdaMonthlyCents;

  // Calculate MRRC if provided
  const mrrcAmount = input.mrrcFortnightly
    ? Math.round(input.mrrcFortnightly * 26 / 12) as Cents  // fortnightly to monthly
    : undefined;

  const totalAmount = (sdaAmount + (mrrcAmount ?? 0)) as Cents;

  // Determine claim pathway
  const claimPathway = participant.planManagementType === PlanManagementType.NDIA_MANAGED
    ? ClaimPathway.NDIA_MANAGED
    : ClaimPathway.AGENCY_MANAGED;

  // Generate reference
  const propertyCode = property.propertyLabel ?? property.suburb;
  const claimReference = generateClaimReference(period, propertyCode, participant.lastName);

  return {
    claimReference,
    propertyId: property.id,
    participantId: participant.id,
    claimPathway,
    periodStart: periodStart(period),
    periodEnd: periodEnd(period),
    sdaAmount,
    mrrcAmount,
    totalAmount,
    ndisItemNumber: SDA_ITEM_CODES.SDA_DAILY_RATE,
  };
}
