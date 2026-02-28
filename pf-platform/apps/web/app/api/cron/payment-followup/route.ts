import { NextResponse } from 'next/server';
import { createServerClient } from '@pf/db';
import { detectOverdueInvoices } from '@pf/orchestration';

/**
 * Daily payment follow-up cron job.
 * Schedule: 0 9 * * * (9am daily via Vercel Cron)
 *
 * Checks for agency-managed claims with status 'submitted' that are overdue:
 * - >14 days: creates/maintains warning exception
 * - >30 days: escalates to critical exception
 *
 * Idempotent: updates severity on existing exceptions rather than creating duplicates.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = createServerClient();
    const overdueCount = await detectOverdueInvoices(db);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: {
        overdueExceptionsCreatedOrUpdated: overdueCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/payment-followup] Error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
