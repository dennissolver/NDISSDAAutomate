import { type BuildingType, type DesignCategory } from './pricing.types';

export enum SdaEnrolmentStatus {
  PENDING = 'pending',
  ENROLLED = 'enrolled',
  CANCELLED = 'cancelled',
}

export interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyLabel?: string;
  buildingType: BuildingType;
  designCategory: DesignCategory;
  hasOoa: boolean;
  hasBreakoutRoom: boolean;
  hasFireSprinklers: boolean;
  locationFactor: number;
  maxResidents: number;
  sdaEnrolmentId?: string;
  sdaEnrolmentStatus: SdaEnrolmentStatus;
  sdaEnrolmentDate?: Date;
  annualSdaAmount?: number;
  ownerId: string;
  rentalAgencyId?: string;
  storagePath?: string;
  createdAt: Date;
  updatedAt: Date;
}
