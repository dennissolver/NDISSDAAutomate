import { type Participant, ClaimPathway, PlanManagementType } from '@pf/shared';

export function isPlanExpiringSoon(participant: Participant, withinDays: number = 90): boolean {
  if (!participant.planEndDate) return false;
  const now = new Date();
  const diffMs = participant.planEndDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= withinDays;
}

export function isPlanExpired(participant: Participant): boolean {
  if (!participant.planEndDate) return false;
  return participant.planEndDate < new Date();
}

export function getParticipantDisplayName(participant: Participant): string {
  return `${participant.firstName} ${participant.lastName}`;
}

export function determineClaimPathway(participant: Participant): ClaimPathway {
  return participant.planManagementType === PlanManagementType.NDIA_MANAGED
    ? ClaimPathway.NDIA_MANAGED
    : ClaimPathway.AGENCY_MANAGED;
}
