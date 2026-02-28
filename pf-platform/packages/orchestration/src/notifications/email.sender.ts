/**
 * Email sender module.
 *
 * Checks for an `EMAIL_API_KEY` environment variable. When present, emails
 * are sent via Resend (or nodemailer — whichever is available). When absent,
 * the function logs a warning and returns gracefully (no-op).
 *
 * This ensures the notification system never crashes due to missing email
 * configuration while keeping the code ready for production use.
 */

const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@pfplatform.com.au';

/**
 * Send an HTML email.
 *
 * @param to      - Recipient email address
 * @param subject - Email subject line
 * @param html    - HTML body content
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;

  if (!apiKey) {
    console.warn(
      '[EMAIL] No EMAIL_API_KEY configured — email delivery skipped.',
      { to, subject },
    );
    return;
  }

  // Attempt Resend (the lightweight email API used by many Next.js projects)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Resend API returned ${response.status}: ${errorBody}`,
      );
    }

    const data = (await response.json()) as { id?: string };
    console.log(`[EMAIL] Sent successfully via Resend (id: ${data.id ?? 'unknown'})`, {
      to,
      subject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL] Failed to send email: ${message}`, {
      to,
      subject,
    });
    throw err;
  }
}
