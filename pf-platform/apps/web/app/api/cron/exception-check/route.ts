import { NextResponse } from 'next/server';
import { createServerClient } from '@pf/db';
import { runExceptionDetection } from '@pf/orchestration';

/**
 * Daily exception detection cron job.
 * Schedule: 0 7 * * * (7am daily via Vercel Cron)
 *
 * Checks for:
 * - Plan expiries within 30 days
 * - Missing rental statements (after the 5th of the following month)
 * - Overdue invoices (>14 days warning, >30 days critical)
 *
 * Idempotent: will not create duplicate exceptions for the same entity+type.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = createServerClient();
    const summary = await runExceptionDetection(db);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/exception-check] Error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
