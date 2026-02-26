import type { TypedSupabaseClient } from '../client';
import type { ServiceBooking } from '@pf/shared';
import { toCents } from '@pf/shared';
import { throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): ServiceBooking {
  return {
    id: row.id as string,
    participantId: row.participant_id as string,
    propertyId: row.property_id as string,
    ndiaBookingId: row.ndia_booking_id as string | undefined,
    ndisItemNumber: row.ndis_item_number as string,
    startDate: new Date(row.start_date as string),
    endDate: new Date(row.end_date as string),
    allocatedAmount: toCents(Number(row.allocated_amount)),
    claimedYtd: toCents(Number(row.claimed_ytd)),
    remainingAmount: toCents(Number(row.remaining_amount)),
    status: row.status as ServiceBooking['status'],
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getServiceBookings(
  db: TypedSupabaseClient,
  filters?: { participantId?: string; propertyId?: string; status?: string },
): Promise<ServiceBooking[]> {
  let query = db.from('service_bookings').select('*').order('start_date', { ascending: false });
  if (filters?.participantId) query = query.eq('participant_id', filters.participantId);
  if (filters?.propertyId) query = query.eq('property_id', filters.propertyId);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getActiveBookingForClaim(
  db: TypedSupabaseClient,
  participantId: string,
  propertyId: string,
): Promise<ServiceBooking | null> {
  const { data, error } = await db
    .from('service_bookings')
    .select('*')
    .eq('participant_id', participantId)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createServiceBooking(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<ServiceBooking> {
  const result = await db.from('service_bookings').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateBookingClaimedAmount(
  db: TypedSupabaseClient,
  id: string,
  claimedYtd: number,
): Promise<ServiceBooking> {
  const result = await db
    .from('service_bookings')
    .update({ claimed_ytd: claimedYtd })
    .eq('id', id)
    .select()
    .single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}
