import { type ClaimStatus } from '../enums/claim-status';
import { type ClaimPathway } from '../enums/claim-pathway';
import { type Cents } from './common.types';

export interface Claim {
  id: string;
  claimReference: string;
  propertyId: string;
  participantId: string;
  serviceBookingId?: string;
  reconciliationId?: string;
  claimPathway: ClaimPathway;
  periodStart: Date;
  periodEnd: Date;
  sdaAmount: Cents;
  mrrcAmount?: Cents;
  totalAmount: Cents;
  ndisItemNumber: string;
  status: ClaimStatus;
  ndiaRequestId?: string;
  ndiaResponse?: Record<string, unknown>;
  xeroInvoiceId?: string;
  rejectionReason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
