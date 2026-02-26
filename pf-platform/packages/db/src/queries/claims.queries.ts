import type { TypedSupabaseClient } from '../client';
import type { Claim, PaginatedResult } from '@pf/shared';
import { toCents } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Claim {
  return {
    id: row.id as string,
    claimReference: row.claim_reference as string,
    propertyId: row.property_id as string,
    participantId: row.participant_id as string,
    serviceBookingId: row.service_booking_id as string | undefined,
    reconciliationId: row.reconciliation_id as string | undefined,
    claimPathway: row.claim_pathway as Claim['claimPathway'],
    periodStart: new Date(row.period_start as string),
    periodEnd: new Date(row.period_end as string),
    sdaAmount: toCents(Number(row.sda_amount)),
    mrrcAmount: row.mrrc_amount ? toCents(Number(row.mrrc_amount)) : undefined,
    totalAmount: toCents(Number(row.total_amount)),
    ndisItemNumber: row.ndis_item_number as string,
    status: row.status as Claim['status'],
    ndiaRequestId: row.ndia_request_id as string | undefined,
    ndiaResponse: row.ndia_response as Record<string, unknown> | undefined,
    xeroInvoiceId: row.xero_invoice_id as string | undefined,
    rejectionReason: row.rejection_reason as string | undefined,
    submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getClaims(
  db: TypedSupabaseClient,
  opts?: PaginationOpts & { status?: string; pathway?: string },
): Promise<PaginatedResult<Claim>> {
  let query = db.from('claims').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (opts?.status) query = query.eq('status', opts.status);
  if (opts?.pathway) query = query.eq('claim_pathway', opts.pathway);
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getClaimById(db: TypedSupabaseClient, id: string): Promise<Claim> {
  const result = await db.from('claims').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getClaimsByReconciliation(db: TypedSupabaseClient, reconciliationId: string): Promise<Claim[]> {
  const { data, error } = await db.from('claims').select('*').eq('reconciliation_id', reconciliationId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createClaim(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<Claim> {
  const result = await db.from('claims').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateClaimStatus(
  db: TypedSupabaseClient,
  id: string,
  status: string,
  extra?: Record<string, unknown>,
): Promise<Claim> {
  const result = await db
    .from('claims')
    .update({ status, ...extra })
    .eq('id', id)
    .select()
    .single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getClaimByReference(db: TypedSupabaseClient, reference: string): Promise<Claim> {
  const result = await db.from('claims').select('*').eq('claim_reference', reference).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}
