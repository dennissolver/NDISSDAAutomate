import type { TypedSupabaseClient } from '../client';
import type { PaginatedResult, Cents } from '@pf/shared';
import { toCents } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

export interface ReconciliationRow {
  id: string;
  propertyId: string;
  periodMonth: number;
  periodYear: number;
  statementNumber?: number;
  status: string;
  totalRentReceived?: Cents;
  totalSdaSubsidy?: Cents;
  totalMoneyIn?: Cents;
  agencyManagementFee?: Cents;
  pfManagementFee?: Cents;
  gstPayable?: Cents;
  energyReimbursement?: Cents;
  energyInvoiceAmount?: Cents;
  maintenanceCosts?: Cents;
  otherDeductions?: Cents;
  netClientPayout?: Cents;
  approvedBy?: string;
  approvedAt?: Date;
  publishedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: Record<string, unknown>): ReconciliationRow {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    periodMonth: row.period_month as number,
    periodYear: row.period_year as number,
    statementNumber: row.statement_number as number | undefined,
    status: row.status as string,
    totalRentReceived: row.total_rent_received != null ? toCents(Number(row.total_rent_received)) : undefined,
    totalSdaSubsidy: row.total_sda_subsidy != null ? toCents(Number(row.total_sda_subsidy)) : undefined,
    totalMoneyIn: row.total_money_in != null ? toCents(Number(row.total_money_in)) : undefined,
    agencyManagementFee: row.agency_management_fee != null ? toCents(Number(row.agency_management_fee)) : undefined,
    pfManagementFee: row.pf_management_fee != null ? toCents(Number(row.pf_management_fee)) : undefined,
    gstPayable: row.gst_payable != null ? toCents(Number(row.gst_payable)) : undefined,
    energyReimbursement: row.energy_reimbursement != null ? toCents(Number(row.energy_reimbursement)) : undefined,
    energyInvoiceAmount: row.energy_invoice_amount != null ? toCents(Number(row.energy_invoice_amount)) : undefined,
    maintenanceCosts: row.maintenance_costs != null ? toCents(Number(row.maintenance_costs)) : undefined,
    otherDeductions: row.other_deductions != null ? toCents(Number(row.other_deductions)) : undefined,
    netClientPayout: row.net_client_payout != null ? toCents(Number(row.net_client_payout)) : undefined,
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    publishedAt: row.published_at ? new Date(row.published_at as string) : undefined,
    notes: row.notes as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getReconciliations(
  db: TypedSupabaseClient,
  opts?: PaginationOpts & { status?: string; propertyId?: string },
): Promise<PaginatedResult<ReconciliationRow>> {
  let query = db.from('reconciliations').select('*', { count: 'exact' }).order('period_year', { ascending: false }).order('period_month', { ascending: false });
  if (opts?.status) query = query.eq('status', opts.status);
  if (opts?.propertyId) query = query.eq('property_id', opts.propertyId);
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getReconciliationById(db: TypedSupabaseClient, id: string): Promise<ReconciliationRow> {
  const result = await db.from('reconciliations').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getReconciliationByPropertyPeriod(
  db: TypedSupabaseClient,
  propertyId: string,
  month: number,
  year: number,
): Promise<ReconciliationRow | null> {
  const { data, error } = await db
    .from('reconciliations')
    .select('*')
    .eq('property_id', propertyId)
    .eq('period_month', month)
    .eq('period_year', year)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createReconciliation(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<ReconciliationRow> {
  const result = await db.from('reconciliations').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateReconciliationStatus(
  db: TypedSupabaseClient,
  id: string,
  status: string,
  extra?: Record<string, unknown>,
): Promise<ReconciliationRow> {
  const result = await db.from('reconciliations').update({ status, ...extra }).eq('id', id).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export interface LineItemRow {
  id: string;
  reconciliationId: string;
  category: string;
  description: string;
  amount: Cents;
  source?: string;
  sourceReference?: string;
  sortOrder: number;
  createdAt: Date;
}

function mapLineItem(row: Record<string, unknown>): LineItemRow {
  return {
    id: row.id as string,
    reconciliationId: row.reconciliation_id as string,
    category: row.category as string,
    description: row.description as string,
    amount: toCents(Number(row.amount)),
    source: row.source as string | undefined,
    sourceReference: row.source_reference as string | undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: new Date(row.created_at as string),
  };
}

export async function upsertLineItems(
  db: TypedSupabaseClient,
  reconciliationId: string,
  items: Array<{ category: string; description: string; amount: number; source?: string; source_reference?: string; sort_order?: number }>,
): Promise<LineItemRow[]> {
  await db.from('reconciliation_line_items').delete().eq('reconciliation_id', reconciliationId);
  const rows = items.map((item, i) => ({
    reconciliation_id: reconciliationId,
    ...item,
    sort_order: item.sort_order ?? i,
  }));
  const { data, error } = await db.from('reconciliation_line_items').insert(rows).select();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLineItem);
}

export async function getLineItems(db: TypedSupabaseClient, reconciliationId: string): Promise<LineItemRow[]> {
  const { data, error } = await db
    .from('reconciliation_line_items')
    .select('*')
    .eq('reconciliation_id', reconciliationId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLineItem);
}
