import { NextResponse } from 'next/server';
import { createServerClient } from '@pf/db';
import { runMonthlyReconciliationCycle } from '@pf/orchestration';

/**
 * Monthly reconciliation cycle cron job.
 * Schedule: 0 2 1 * * (2am on the 1st of each month via Vercel Cron)
 *
 * Creates pending reconciliation records for the previous month
 * for all enrolled properties that don't already have one.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = createServerClient();

    // Calculate the previous month
    const now = new Date();
    let month = now.getMonth(); // 0-indexed, so January = 0 -> previous month = December
    let year = now.getFullYear();
    if (month === 0) {
      month = 12;
      year = year - 1;
    }
    // month is now 1-indexed representing the previous month

    const summary = await runMonthlyReconciliationCycle(db, month, year);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      period: { month, year },
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/monthly-cycle] Error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
