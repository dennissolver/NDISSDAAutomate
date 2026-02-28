export {
  uploadReconciliationPdf,
  uploadStatement,
  ensureFolderPath,
} from './drive.service';
export { createDriveClient, getRootFolderId } from './drive.client';
export type { DriveClient } from './drive.client';
export type { DriveFile, Period, UploadResult } from './drive.types';

export { createGmailClient } from './gmail.client';
export type { GmailClient } from './gmail.client';
export { checkForStatements, markAsProcessed } from './email.watcher';
export type { IncomingStatement } from './gmail.types';
