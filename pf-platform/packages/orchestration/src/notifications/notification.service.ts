/**
 * Notification routing service.
 *
 * Logs every notification to console and prepares the shape for the
 * `notifications` table defined in 00006_create_system_tables.sql.
 * Actual persistence and delivery (email, Google Chat, voice) will
 * activate once the relevant credentials are configured.
 */

import { sendEmail } from './email.sender';

export interface Notification {
  type:
    | 'exception'
    | 'reconciliation_published'
    | 'plan_expiry'
    | 'payment_overdue'
    | 'invoice_sent';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  recipientEmail?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Shape matching the `notifications` table in 00006_create_system_tables.sql.
 */
interface NotificationRecord {
  recipient_type: string;
  recipient_id: string;
  channel: string;
  template: string;
  subject: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

const SEVERITY_LABELS: Record<Notification['severity'], string> = {
  info: 'INFO',
  warning: 'WARNING',
  critical: 'CRITICAL',
};

/**
 * Route a notification through available channels.
 *
 * Current behaviour:
 *  1. Logs to console with severity prefix.
 *  2. If `recipientEmail` is provided, attempts email delivery (graceful no-op
 *     when no email provider is configured).
 *  3. Builds a `NotificationRecord` compatible with the `notifications` table
 *     for future persistence via Supabase.
 */
export async function sendNotification(notification: Notification): Promise<void> {
  const label = SEVERITY_LABELS[notification.severity];

  // 1. Console log
  console.log(
    `[NOTIFICATION][${label}] ${notification.type}: ${notification.title}`,
  );
  console.log(`  ${notification.body}`);
  if (notification.entityType && notification.entityId) {
    console.log(
      `  Entity: ${notification.entityType}#${notification.entityId}`,
    );
  }

  // 2. Build record for future DB persistence
  const _record: NotificationRecord = {
    recipient_type: notification.recipientEmail ? 'email' : 'system',
    recipient_id: notification.recipientEmail ?? 'system',
    channel: 'email',
    template: notification.type,
    subject: `[${label}] ${notification.title}`,
    body: notification.body,
    related_entity_type: notification.entityType ?? null,
    related_entity_id: notification.entityId ?? null,
    sent_at: null,
    failed_at: null,
    error_message: null,
  };

  // TODO: persist _record to Supabase `notifications` table once DB client
  // is wired into orchestration package.

  // 3. Email delivery attempt
  if (notification.recipientEmail) {
    const subject = `[PF Platform] ${notification.title}`;
    const html = buildEmailHtml(notification);

    try {
      await sendEmail(notification.recipientEmail, subject, html);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[NOTIFICATION] Email delivery failed: ${message}`);
    }
  }
}

function buildEmailHtml(notification: Notification): string {
  const severityColor =
    notification.severity === 'critical'
      ? '#dc2626'
      : notification.severity === 'warning'
        ? '#d97706'
        : '#2563eb';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">${notification.title}</h2>
        <span style="font-size: 12px; opacity: 0.85;">${notification.type.replace(/_/g, ' ').toUpperCase()}</span>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">${notification.body}</p>
        ${
          notification.entityType && notification.entityId
            ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">Related: ${notification.entityType} (${notification.entityId})</p>`
            : ''
        }
      </div>
      <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
        PF Platform Notification
      </p>
    </div>
  `.trim();
}
