import {
  type Claim,
  type Participant,
  type Property,
  type ServiceBooking,
  type Period,
  type Cents,
  type CreateExceptionInput,
  ExceptionType,
  ExceptionSeverity,
  formatPeriod,
} from '@pf/shared';

function getParticipantName(p: Participant): string {
  return `${p.firstName} ${p.lastName}`;
}

export function createExceptionFromClaimRejection(claim: Claim, reason: string): CreateExceptionInput {
  return {
    type: ExceptionType.CLAIM_REJECTION,
    severity: ExceptionSeverity.CRITICAL,
    title: `Claim ${claim.claimReference} rejected`,
    description: `Reason: ${reason}`,
    propertyId: claim.propertyId,
    participantId: claim.participantId,
    claimId: claim.id,
    metadata: { rejectionReason: reason },
  };
}

export function createExceptionFromPlanExpiry(participant: Participant, property: Property): CreateExceptionInput {
  return {
    type: ExceptionType.PLAN_EXPIRY,
    severity: ExceptionSeverity.WARNING,
    title: `Plan expiring for ${getParticipantName(participant)}`,
    description: `NDIS plan for ${getParticipantName(participant)} at ${property.propertyLabel ?? property.suburb} expires ${participant.planEndDate?.toLocaleDateString('en-AU') ?? 'unknown'}`,
    propertyId: property.id,
    participantId: participant.id,
  };
}

export function createExceptionFromMissingStatement(property: Property, period: Period): CreateExceptionInput {
  return {
    type: ExceptionType.MISSING_STATEMENT,
    severity: ExceptionSeverity.WARNING,
    title: `Missing rental statement for ${property.propertyLabel ?? property.suburb}`,
    description: `No rental statement received for ${formatPeriod(period)}`,
    propertyId: property.id,
    metadata: { period },
  };
}

export function createExceptionFromBookingExpiry(booking: ServiceBooking, participant: Participant): CreateExceptionInput {
  return {
    type: ExceptionType.BOOKING_EXPIRY,
    severity: ExceptionSeverity.WARNING,
    title: `Service booking expiring for ${getParticipantName(participant)}`,
    description: `Booking ${booking.ndiaBookingId ?? booking.id} ends ${booking.endDate.toLocaleDateString('en-AU')}`,
    participantId: participant.id,
    propertyId: booking.propertyId,
    metadata: { bookingId: booking.id },
  };
}

export function createExceptionFromInsufficientFunds(booking: ServiceBooking, claimAmount: Cents): CreateExceptionInput {
  return {
    type: ExceptionType.INSUFFICIENT_FUNDS,
    severity: ExceptionSeverity.CRITICAL,
    title: `Insufficient booking funds`,
    description: `Claim amount ${claimAmount} exceeds remaining booking balance ${booking.remainingAmount}`,
    participantId: booking.participantId,
    propertyId: booking.propertyId,
    metadata: { bookingId: booking.id, claimAmount, remaining: booking.remainingAmount },
  };
}
