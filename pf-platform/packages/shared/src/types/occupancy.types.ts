import type { Cents } from './common.types';

export interface Occupancy {
  id: string;
  propertyId: string;
  participantId: string;
  startDate: Date;
  endDate?: Date;
  roomNumber?: number;
  mrrcFortnightly?: Cents;
  createdAt: Date;
  updatedAt: Date;
}
