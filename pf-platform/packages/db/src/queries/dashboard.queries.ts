import type { TypedSupabaseClient } from '../client';
import type {
  DashboardStats,
  RecentActivity,
  MonthlyOverviewData,
  ReconStatusCounts,
  ClaimStatusCounts,
  MissingReconProperty,
  DashboardAlerts,
  DashboardAlert,
} from '@pf/shared';

export async function getDashboardStats(db: TypedSupabaseClient): Promise<DashboardStats> {
  const [properties, participants, recons, exceptions, claims] = await Promise.all([
    db.from('properties').select('id', { count: 'exact', head: true }),
    db.from('occupancies').select('participant_id', { count: 'exact', head: true }).is('end_date', null),
    db.from('reconciliations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('exceptions').select('severity').eq('status', 'open'),
    db.from('claims').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const exceptionCounts = { info: 0, warning: 0, critical: 0 };
  for (const row of exceptions.data ?? []) {
    const severity = (row as Record<string, unknown>).severity as string;
    if (severity in exceptionCounts) exceptionCounts[severity as keyof typeof exceptionCounts]++;
  }

  return {
    propertyCount: properties.count ?? 0,
    activeParticipants: participants.count ?? 0,
    pendingRecons: recons.count ?? 0,
    openExceptions: exceptionCounts,
    claimsThisMonth: claims.count ?? 0,
  };
}

export async function getRecentActivity(db: TypedSupabaseClient, limit: number = 10): Promise<RecentActivity[]> {
  const { data, error } = await db
    .from('audit_log')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    description: `${row.action} on ${row.entity_type}`,
    userName: (row.users as Record<string, unknown> | null)?.full_name as string | undefined,
    createdAt: new Date(row.created_at as string),
  }));
}

/**
 * Enhanced monthly overview query.
 * Returns reconciliation status counts, NDIA/agency claim status counts,
 * per-property recon detail, and properties missing reconciliation.
 */
export async function getMonthlyOverview(
  db: TypedSupabaseClient,
  month: number,
  year: number,
): Promise<MonthlyOverviewData> {
  const periodStart = new Date(year, month - 1, 1).toISOString();
  const periodEnd = new Date(year, month, 1).toISOString();

  const [recons, ndiaClaims, agencyClaims, allProperties] = await Promise.all([
    db.from('reconciliations')
      .select('status, property_id, properties(property_label, address_line_1, suburb)')
      .eq('period_month', month)
      .eq('period_year', year),
    db.from('claims')
      .select('status')
      .eq('claim_pathway', 'ndia_managed')
      .gte('period_start', periodStart)
      .lt('period_start', periodEnd),
    db.from('claims')
      .select('status')
      .eq('claim_pathway', 'agency_managed')
      .gte('period_start', periodStart)
      .lt('period_start', periodEnd),
    db.from('properties')
      .select('id, property_label, address_line_1, suburb'),
  ]);

  // -- Reconciliation status counts --
  const reconRows = (recons.data ?? []) as Record<string, unknown>[];
  const reconStatus: ReconStatusCounts = { pending: 0, generated: 0, reviewed: 0, approved: 0, published: 0 };
  const reconProperties: MonthlyOverviewData['reconProperties'] = [];
  const reconPropertyIds = new Set<string>();

  for (const row of reconRows) {
    const status = row.status as string;
    if (status in reconStatus) reconStatus[status as keyof ReconStatusCounts]++;
    const propId = row.property_id as string;
    reconPropertyIds.add(propId);
    const prop = row.properties as Record<string, unknown> | null;
    reconProperties.push({
      propertyId: propId,
      propertyLabel: (prop?.property_label as string) || (prop?.address_line_1 as string) || propId,
      status,
    });
  }

  // -- Claims status counts --
  function countClaimStatuses(rows: Record<string, unknown>[]): ClaimStatusCounts {
    const counts: ClaimStatusCounts = { draft: 0, validated: 0, submitted: 0, approved: 0, rejected: 0, paid: 0 };
    for (const row of rows) {
      const s = row.status as string;
      if (s in counts) counts[s as keyof ClaimStatusCounts]++;
    }
    return counts;
  }

  const ndiaClaimsStatus = countClaimStatuses((ndiaClaims.data ?? []) as Record<string, unknown>[]);
  const agencyClaimsStatus = countClaimStatuses((agencyClaims.data ?? []) as Record<string, unknown>[]);

  // -- Properties missing reconciliation --
  const missingReconProperties: MissingReconProperty[] = [];
  for (const prop of (allProperties.data ?? []) as Record<string, unknown>[]) {
    const propId = prop.id as string;
    if (!reconPropertyIds.has(propId)) {
      missingReconProperties.push({
        propertyId: propId,
        propertyLabel: (prop.property_label as string) || (prop.address_line_1 as string) || propId,
        address: `${prop.address_line_1 ?? ''}, ${prop.suburb ?? ''}`.replace(/^, |, $/g, ''),
      });
    }
  }

  return {
    month,
    year,
    reconStatus,
    reconProperties,
    ndiaClaimsStatus,
    agencyClaimsStatus,
    missingReconProperties,
  };
}

/**
 * Returns active alerts: open exceptions, properties without reconciliation
 * for the current month, and participants with plans expiring within 30 days.
 */
export async function getAlerts(db: TypedSupabaseClient): Promise<DashboardAlerts> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [exceptions, reconPropertyIds, allProperties, expiringPlans] = await Promise.all([
    db.from('exceptions')
      .select('id, severity, exception_type, title, entity_type, entity_id')
      .eq('status', 'open')
      .order('severity', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('reconciliations')
      .select('property_id')
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear),
    db.from('properties')
      .select('id, property_label, address_line_1'),
    db.from('participants')
      .select('id, first_name, last_name, plan_end_date')
      .eq('plan_status', 'active')
      .lte('plan_end_date', thirtyDaysFromNow.toISOString())
      .gte('plan_end_date', now.toISOString())
      .order('plan_end_date'),
  ]);

  const alerts: DashboardAlert[] = [];

  // 1. Open exceptions
  for (const row of (exceptions.data ?? []) as Record<string, unknown>[]) {
    alerts.push({
      id: `exc-${row.id}`,
      type: row.severity as 'info' | 'warning' | 'critical',
      category: 'exception',
      message: (row.title as string) || `${row.exception_type} exception`,
      entityType: row.entity_type as string | undefined,
      entityId: row.entity_id as string | undefined,
      href: '/exceptions',
    });
  }

  // 2. Properties without reconciliation for current month
  const reconPropSet = new Set(
    ((reconPropertyIds.data ?? []) as Record<string, unknown>[]).map(r => r.property_id as string),
  );
  for (const prop of (allProperties.data ?? []) as Record<string, unknown>[]) {
    if (!reconPropSet.has(prop.id as string)) {
      const label = (prop.property_label as string) || (prop.address_line_1 as string) || (prop.id as string);
      alerts.push({
        id: `missing-recon-${prop.id}`,
        type: 'warning',
        category: 'missing_recon',
        message: `No reconciliation for ${label} this month`,
        entityType: 'property',
        entityId: prop.id as string,
        href: '/reconciliation',
      });
    }
  }

  // 3. Expiring plans (within 30 days)
  for (const p of (expiringPlans.data ?? []) as Record<string, unknown>[]) {
    const endDate = new Date(p.plan_end_date as string);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: `expiring-plan-${p.id}`,
      type: daysLeft <= 7 ? 'critical' : 'warning',
      category: 'expiring_plan',
      message: `${p.first_name} ${p.last_name}'s plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      entityType: 'participant',
      entityId: p.id as string,
      href: `/participants/${p.id}`,
    });
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  return { alerts };
}
