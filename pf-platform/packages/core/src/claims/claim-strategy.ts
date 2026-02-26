import { ClaimPathway } from '@pf/shared';

export interface ClaimSubmissionStrategy {
  pathway: ClaimPathway;
  canSubmit(): boolean;
  getDescription(): string;
}

export class NdiaClaimStrategy implements ClaimSubmissionStrategy {
  pathway = ClaimPathway.NDIA_MANAGED;
  canSubmit(): boolean { return false; } // Phase 2: NDIA API integration
  getDescription(): string { return 'Submit directly to NDIA via PRODA/API'; }
}

export class AgencyClaimStrategy implements ClaimSubmissionStrategy {
  pathway = ClaimPathway.AGENCY_MANAGED;
  canSubmit(): boolean { return false; } // Phase 2: Xero integration
  getDescription(): string { return 'Generate Xero invoice to plan manager'; }
}

export function getClaimStrategy(pathway: ClaimPathway): ClaimSubmissionStrategy {
  switch (pathway) {
    case ClaimPathway.NDIA_MANAGED: return new NdiaClaimStrategy();
    case ClaimPathway.AGENCY_MANAGED: return new AgencyClaimStrategy();
  }
}
