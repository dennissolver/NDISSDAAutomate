import type { Cents } from './common.types';
import type { BookingStatus } from '../enums/booking-status';

export interface ServiceBooking {
  id: string;
  participantId: string;
  propertyId: string;
  ndiaBookingId?: string;
  ndisItemNumber: string;
  startDate: Date;
  endDate: Date;
  allocatedAmount: Cents;
  claimedYtd: Cents;
  remainingAmount: Cents;
  status: BookingStatus;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
