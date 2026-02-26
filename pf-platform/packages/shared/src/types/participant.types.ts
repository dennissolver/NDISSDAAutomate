import { type PlanStatus } from '../enums/plan-status';

export enum PlanManagementType {
  NDIA_MANAGED = 'ndia_managed',
  PLAN_MANAGED = 'plan_managed',
  SELF_MANAGED = 'self_managed',
}

export interface Participant {
  id: string;
  ndisNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  planManagementType: PlanManagementType;
  planManagerId?: string;
  planStatus: PlanStatus;
  planStartDate?: Date;
  planEndDate?: Date;
  paceTransitioned: boolean;
  sdaCategoryFunded?: string;
  createdAt: Date;
  updatedAt: Date;
}
