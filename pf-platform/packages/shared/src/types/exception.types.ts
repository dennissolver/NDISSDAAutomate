import type { ExceptionType, ExceptionSeverity, ExceptionStatus } from '../enums/exception-type';

export interface Exception {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  description?: string;
  propertyId?: string;
  participantId?: string;
  claimId?: string;
  reconciliationId?: string;
  status: ExceptionStatus;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExceptionInput {
  type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  description?: string;
  propertyId?: string;
  participantId?: string;
  claimId?: string;
  reconciliationId?: string;
  metadata?: Record<string, unknown>;
}
