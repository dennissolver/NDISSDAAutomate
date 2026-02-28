// Google Drive
export {
  uploadReconciliationPdf,
  uploadStatement,
  ensureFolderPath,
} from './google/drive.service';
export { createDriveClient, getRootFolderId } from './google/drive.client';
export type { DriveClient } from './google/drive.client';
export type { DriveFile, Period, UploadResult } from './google/drive.types';

// Gmail / Email Watcher
export { createGmailClient } from './google/gmail.client';
export type { GmailClient } from './google/gmail.client';
export { checkForStatements, markAsProcessed } from './google/email.watcher';
export type { IncomingStatement } from './google/gmail.types';

// Xero
export { createXeroClient } from './xero/xero.client';
export type { XeroClient } from './xero/xero.client';
export { createInvoice, getInvoiceStatus, syncPayments } from './xero/xero.service';
export type {
  XeroInvoiceInput,
  XeroInvoiceResult,
  XeroInvoiceStatus,
  XeroLineItem,
  PaymentUpdate,
} from './xero/xero.types';

// NDIA
export { createNdiaClient, isNdiaConfigured } from './ndia/ndia.client';
export type { NdiaClient } from './ndia/ndia.client';
export {
  lookupParticipant,
  getServiceBookings,
  getPlanStatus,
  submitBulkPaymentRequest,
} from './ndia/ndia.service';
export type {
  ParticipantLookup,
  ServiceBooking,
  PlanStatus,
  ClaimData,
  ClaimResult,
  SubmissionResult,
} from './ndia/ndia.types';
