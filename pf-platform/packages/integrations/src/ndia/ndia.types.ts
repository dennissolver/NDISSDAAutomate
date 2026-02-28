/** NDIA / PRODA API integration types. */

export interface NdiaConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface ParticipantLookup {
  ndisNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  planStatus: string;
  planStartDate: string;
  planEndDate: string;
  planManagedBy: 'ndia' | 'plan_manager' | 'self';
}

export interface ServiceBooking {
  bookingId: string;
  ndisNumber: string;
  supportCategory: string;
  supportItemNumber: string;
  startDate: string;
  endDate: string;
  allocatedAmount: number;
  remainingAmount: number;
  status: 'active' | 'expired' | 'cancelled';
}

export interface PlanStatus {
  ndisNumber: string;
  planId: string;
  status: 'active' | 'expiring' | 'expired' | 'reassessment';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  managedBy: 'ndia' | 'plan_manager' | 'self';
  paceTransition: boolean;
}

export interface ClaimData {
  ndisNumber: string;
  supportItemNumber: string;
  claimReference: string;
  serviceDate: string;
  quantity: number;
  unitPrice: number;
  gstCode: string;
  cancellationReason?: string;
}

export interface ClaimResult {
  claimReference: string;
  status: 'accepted' | 'rejected' | 'pending';
  errorCode?: string;
  errorMessage?: string;
}

export interface SubmissionResult {
  batchId: string;
  submittedAt: string;
  totalClaims: number;
  accepted: number;
  rejected: number;
  results: ClaimResult[];
}
