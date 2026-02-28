/** Gmail integration types. */

export interface GmailConfig {
  serviceAccountKey: string;
  watchEmail: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  receivedAt: Date;
  snippet: string;
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface IncomingStatement {
  messageId: string;
  from: string;
  subject: string;
  attachmentBuffer: Buffer;
  attachmentFilename: string;
  receivedAt: Date;
}
