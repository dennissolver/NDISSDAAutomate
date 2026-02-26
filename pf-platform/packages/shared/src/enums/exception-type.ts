export enum ExceptionType {
  CLAIM_REJECTION = 'claim_rejection',
  PLAN_EXPIRY = 'plan_expiry',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  MISSING_STATEMENT = 'missing_statement',
  PAYMENT_OVERDUE = 'payment_overdue',
  BOOKING_EXPIRY = 'booking_expiry',
  PACE_TRANSITION = 'pace_transition',
}

export enum ExceptionSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum ExceptionStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}
