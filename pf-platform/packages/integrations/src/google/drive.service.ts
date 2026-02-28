/**
 * Google Drive service — high-level operations for PF reconciliation files.
 *
 * Folder convention:
 *   {root}/NDIS/QLD/Tville/Rental/{Property}/PF Reconciliation/{YYYY_MM}/
 */

import { createDriveClient, getRootFolderId, type DriveClient } from './drive.client';
import type { Period, UploadResult } from './drive.types';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

// ── folder resolution ────────────────────────────────────────────────

/**
 * Walk/create a nested folder path under a given parent.
 *
 * Example: `ensureFolderPath(['NDIS', 'QLD', 'Tville'])` creates each
 * folder level if it doesn't already exist and returns the deepest folder ID.
 */
export async function ensureFolderPath(
  client: DriveClient,
  parentId: string,
  path: string[],
): Promise<string> {
  let currentParent = parentId;

  for (const segment of path) {
    const existing = await client.listFiles(
      currentParent,
      `name = '${segment}' and mimeType = '${FOLDER_MIME}'`,
    );

    if (existing.length > 0) {
      currentParent = existing[0].id;
    } else {
      currentParent = await client.createFolder(segment, currentParent);
    }
  }

  return currentParent;
}

// ── helpers ──────────────────────────────────────────────────────────

function formatPeriodFolder(period: Period): string {
  const mm = String(period.month).padStart(2, '0');
  return `${period.year}_${mm}`;
}

function reconciliationPath(propertyLabel: string, period: Period): string[] {
  return [
    'NDIS',
    'QLD',
    'Tville',
    'Rental',
    propertyLabel,
    'PF Reconciliation',
    formatPeriodFolder(period),
  ];
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Upload a reconciliation PDF to the standard Drive folder structure.
 *
 * Returns the Google Drive file ID and web view link.
 * Returns `null` when the Drive integration is not configured.
 */
export async function uploadReconciliationPdf(
  propertyLabel: string,
  period: Period,
  pdfBuffer: Buffer,
): Promise<UploadResult | null> {
  const client = createDriveClient();
  if (!client) return null;

  const rootId = getRootFolderId();
  const segments = reconciliationPath(propertyLabel, period);
  const folderId = await ensureFolderPath(client, rootId, segments);

  const filename = `PF_Reconciliation_${propertyLabel}_${formatPeriodFolder(period)}.pdf`;

  return client.uploadFile(filename, 'application/pdf', pdfBuffer, folderId);
}

/**
 * Upload a rental statement (or any document) into the property's
 * reconciliation folder for the given period.
 *
 * Returns `null` when the Drive integration is not configured.
 */
export async function uploadStatement(
  propertyLabel: string,
  period: Period,
  filename: string,
  buffer: Buffer,
): Promise<UploadResult | null> {
  const client = createDriveClient();
  if (!client) return null;

  const rootId = getRootFolderId();
  const segments = reconciliationPath(propertyLabel, period);
  const folderId = await ensureFolderPath(client, rootId, segments);

  const mimeType = filename.endsWith('.pdf')
    ? 'application/pdf'
    : 'application/octet-stream';

  return client.uploadFile(filename, mimeType, buffer, folderId);
}
