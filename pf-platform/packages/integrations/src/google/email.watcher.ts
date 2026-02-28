/**
 * Email watcher — scans Gmail for incoming rental statements.
 *
 * Looks for unread emails from known rental agency senders, downloads
 * PDF attachments, and returns them for processing by the ingestion
 * pipeline.
 */

import { createGmailClient, type GmailClient } from './gmail.client';
import type { IncomingStatement } from './gmail.types';

// Known rental agency sender patterns.
// Add new agencies here as they are onboarded.
const KNOWN_SENDERS = [
  'century21',
  'aaronmoon',
  'raywhite',
  'remax',
  'ljhooker',
  'elders',
  'prdalex',
  'harcourts',
];

function buildSenderQuery(): string {
  // Gmail query: match any known sender pattern in from field, unread only
  const fromClauses = KNOWN_SENDERS.map((s) => `from:${s}`).join(' OR ');
  return `(${fromClauses}) is:unread has:attachment filename:pdf`;
}

function extractHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

interface MessagePart {
  mimeType: string;
  filename?: string;
  body?: { attachmentId?: string; size: number };
  parts?: MessagePart[];
}

function findPdfAttachments(
  parts: MessagePart[],
): Array<{ filename: string; attachmentId: string }> {
  const results: Array<{ filename: string; attachmentId: string }> = [];

  for (const part of parts) {
    if (
      part.filename &&
      part.filename.toLowerCase().endsWith('.pdf') &&
      part.body?.attachmentId
    ) {
      results.push({
        filename: part.filename,
        attachmentId: part.body.attachmentId,
      });
    }
    if (part.parts) {
      results.push(...findPdfAttachments(part.parts));
    }
  }

  return results;
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Check Gmail for unread rental statement emails from known agencies.
 *
 * Returns an array of incoming statements with their PDF attachment
 * buffers ready for parsing. Returns an empty array when Gmail is
 * not configured.
 */
export async function checkForStatements(): Promise<IncomingStatement[]> {
  const client = createGmailClient();
  if (!client) {
    console.warn('[email-watcher] Gmail not configured — skipping statement check.');
    return [];
  }

  const query = buildSenderQuery();
  const messageRefs = await client.searchMessages(query, 20);

  if (messageRefs.length === 0) return [];

  const results: IncomingStatement[] = [];

  for (const ref of messageRefs) {
    try {
      const msg = await client.getMessage(ref.id);
      const from = extractHeader(msg.payload.headers, 'From');
      const subject = extractHeader(msg.payload.headers, 'Subject');
      const receivedAt = new Date(parseInt(msg.internalDate, 10));

      const parts = msg.payload.parts ?? [];
      const pdfAttachments = findPdfAttachments(parts);

      for (const att of pdfAttachments) {
        const buffer = await client.getAttachment(ref.id, att.attachmentId);
        results.push({
          messageId: ref.id,
          from,
          subject,
          attachmentBuffer: buffer,
          attachmentFilename: att.filename,
          receivedAt,
        });
      }
    } catch (err) {
      console.error(
        `[email-watcher] Failed to process message ${ref.id}:`,
        err,
      );
    }
  }

  return results;
}

/**
 * Mark a Gmail message as processed by removing the UNREAD label.
 *
 * This prevents the message from being picked up again on the
 * next check cycle.
 */
export async function markAsProcessed(messageId: string): Promise<void> {
  const client = createGmailClient();
  if (!client) return;

  await client.modifyMessage(messageId, undefined, ['UNREAD']);
}
