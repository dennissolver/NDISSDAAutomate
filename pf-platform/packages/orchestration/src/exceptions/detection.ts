import type { TypedSupabaseClient } from '@pf/db';
import {
  getExpiringPlans,
  getExceptionByEntityAndType,
  createException,
} from '@pf/db';
import { ExceptionType, ExceptionSeverity } from '@pf/shared';

export interface DetectionSummary {
  planExpiries: number;
  missingStatements: number;
  overdueInvoices: number;
  total: number;
}

/**
 * Run all exception detection checks. Returns a summary of exceptions created.
 */
export async function runExceptionDetection(
  db: TypedSupabaseClient,
): Promise<DetectionSummary> {
  const now = new Date();
  // Previous month for statement checks
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() is 0-indexed
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [planExpiries, missingStatements, overdueInvoices] = await Promise.all([
    detectExpiringPlans(db, 30),
    detectMissingStatements(db, prevMonth, prevYear),
    detectOverdueInvoices(db),
  ]);

  return {
    planExpiries,
    missingStatements,
    overdueInvoices,
    total: planExpiries + missingStatements + overdueInvoices,
  };
}

/**
 * Detect participants with plans expiring within `withinDays` days.
 * Creates warning-level exceptions for each, deduplicated by participant + type.
 */
export async function detectExpiringPlans(
  db: TypedSupabaseClient,
  withinDays: number = 30,
): Promise<number> {
  const participants = await getExpiringPlans(db, withinDays);
  let created = 0;

  for (const participant of participants) {
    // Deduplicate: don't create if an open exception already exists for this participant
    const existing = await getExceptionByEntityAndType(
      db,
      participant.id,
      'participant',
      ExceptionType.PLAN_EXPIRY,
    );
    if (existing) continue;

    const daysUntilExpiry = participant.planEndDate
      ? Math.ceil((participant.planEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    const severity = daysUntilExpiry <= 7
      ? ExceptionSeverity.CRITICAL
      : ExceptionSeverity.WARNING;

    await createException(db, {
      type: ExceptionType.PLAN_EXPIRY,
      severity,
      title: `Plan expiring for ${participant.firstName} ${participant.lastName}`,
      description: `NDIS plan for participant ${participant.ndisNumber} expires on ${participant.planEndDate?.toISOString().split('T')[0]} (${daysUntilExpiry} days remaining). Action required to ensure continuity of SDA funding.`,
      participant_id: participant.id,
      status: 'open',
      metadata: {
        ndis_number: participant.ndisNumber,
        plan_end_date: participant.planEndDate?.toISOString(),
        days_until_expiry: daysUntilExpiry,
      },
    });
    created++;
  }

  return created;
}

/**
 * Detect properties that are missing a reconciliation record for a given month/year.
 * Only runs after the 5th of the following month (to allow time for statements to arrive).
 * Creates warning exceptions for each missing statement.
 */
export async function detectMissingStatements(
  db: TypedSupabaseClient,
  month: number,
  year: number,
): Promise<number> {
  const now = new Date();
  // Only flag missing statements after the 5th of the following month
  const checkDate = new Date(year, month, 5); // month is 1-indexed, Date expects 0-indexed — but month here IS the "following" month
  if (now < checkDate) return 0;

  // Get all active properties
  const { data: properties, error: propError } = await db
    .from('properties')
    .select('id, property_label, address_line_1, suburb')
    .eq('sda_enrolment_status', 'enrolled');
  if (propError) throw new Error(propError.message);
  if (!properties || properties.length === 0) return 0;

  // Get all reconciliations for this period
  const { data: recons, error: reconError } = await db
    .from('reconciliations')
    .select('property_id')
    .eq('period_month', month)
    .eq('period_year', year);
  if (reconError) throw new Error(reconError.message);

  const reconPropertyIds = new Set((recons ?? []).map((r: Record<string, unknown>) => r.property_id as string));

  let created = 0;

  for (const property of properties) {
    const propId = (property as Record<string, unknown>).id as string;
    if (reconPropertyIds.has(propId)) continue;

    // Deduplicate
    const existing = await getExceptionByEntityAndType(
      db,
      propId,
      'property',
      ExceptionType.MISSING_STATEMENT,
      month,
      year,
    );
    if (existing) continue;

    const label = (property as Record<string, unknown>).property_label
      || (property as Record<string, unknown>).address_line_1;

    await createException(db, {
      type: ExceptionType.MISSING_STATEMENT,
      severity: ExceptionSeverity.WARNING,
      title: `Missing rental statement for ${label}`,
      description: `No rental statement has been received for ${label} (${(property as Record<string, unknown>).suburb}) for ${year}-${String(month).padStart(2, '0')}. Please follow up with the rental agency.`,
      property_id: propId,
      status: 'open',
      metadata: {
        month,
        year,
        property_label: label,
      },
    });
    created++;
  }

  return created;
}

/**
 * Detect overdue invoices — claims with status 'submitted' that have been
 * waiting too long for payment.
 * >14 days = warning, >30 days = critical.
 */
export async function detectOverdueInvoices(
  db: TypedSupabaseClient,
): Promise<number> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get all submitted claims older than 14 days
  const { data: claims, error } = await db
    .from('claims')
    .select('id, claim_reference, property_id, participant_id, claim_pathway, submitted_at, total_amount')
    .eq('status', 'submitted')
    .lte('submitted_at', fourteenDaysAgo.toISOString())
    .order('submitted_at');
  if (error) throw new Error(error.message);
  if (!claims || claims.length === 0) return 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let created = 0;

  for (const claim of claims) {
    const claimId = (claim as Record<string, unknown>).id as string;
    const submittedAt = new Date((claim as Record<string, unknown>).submitted_at as string);
    const daysOverdue = Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    const severity = daysOverdue >= 30 ? ExceptionSeverity.CRITICAL : ExceptionSeverity.WARNING;

    // Check for existing exception on this claim
    const existing = await getExceptionByEntityAndType(
      db,
      claimId,
      'claim',
      ExceptionType.PAYMENT_OVERDUE,
    );

    if (existing) {
      // If severity escalated from warning to critical, update it
      if (existing.severity === ExceptionSeverity.WARNING && severity === ExceptionSeverity.CRITICAL) {
        await db
          .from('exceptions')
          .update({
            severity: ExceptionSeverity.CRITICAL,
            description: `Claim ${(claim as Record<string, unknown>).claim_reference} has been submitted for ${daysOverdue} days without payment. Immediate follow-up required.`,
            metadata: {
              ...((existing.metadata as Record<string, unknown>) ?? {}),
              days_overdue: daysOverdue,
              escalated_at: new Date().toISOString(),
            },
          })
          .eq('id', existing.id);
        created++;
      }
      continue;
    }

    const claimRef = (claim as Record<string, unknown>).claim_reference as string;
    const pathway = (claim as Record<string, unknown>).claim_pathway as string;

    await createException(db, {
      type: ExceptionType.PAYMENT_OVERDUE,
      severity,
      title: `Overdue payment: ${claimRef}`,
      description: `Claim ${claimRef} (${pathway}) was submitted ${daysOverdue} days ago and has not been paid. ${severity === 'critical' ? 'Immediate follow-up required.' : 'Follow-up recommended.'}`,
      claim_id: claimId,
      property_id: (claim as Record<string, unknown>).property_id as string,
      participant_id: (claim as Record<string, unknown>).participant_id as string,
      status: 'open',
      metadata: {
        claim_reference: claimRef,
        claim_pathway: pathway,
        submitted_at: (claim as Record<string, unknown>).submitted_at,
        days_overdue: daysOverdue,
      },
    });
    created++;
  }

  return created;
}
