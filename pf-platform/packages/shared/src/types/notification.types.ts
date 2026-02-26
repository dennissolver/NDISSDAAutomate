export interface Notification {
  id: string;
  recipientType: string;
  recipientId: string;
  channel: string;
  template: string;
  subject?: string;
  body?: string;
  sentAt?: Date;
  failedAt?: Date;
  createdAt: Date;
}
