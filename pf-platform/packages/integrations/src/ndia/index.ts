export { createNdiaClient, isNdiaConfigured } from './ndia.client';
export type { NdiaClient } from './ndia.client';
export {
  lookupParticipant,
  getServiceBookings,
  getPlanStatus,
  submitBulkPaymentRequest,
} from './ndia.service';
export type {
  ParticipantLookup,
  ServiceBooking,
  PlanStatus,
  ClaimData,
  ClaimResult,
  SubmissionResult,
} from './ndia.types';
