import { type Period, periodToString } from '@pf/shared';

export function generateClaimReference(period: Period, propertyCode: string, participantCode: string): string {
  const periodStr = periodToString(period);
  const prop = propertyCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const part = participantCode.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
  return `PF-${periodStr}-${prop}-${part}`;
}
