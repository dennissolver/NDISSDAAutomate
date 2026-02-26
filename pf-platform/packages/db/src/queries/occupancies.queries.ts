import type { TypedSupabaseClient } from '../client';
import type { Occupancy } from '@pf/shared';
import { toCents } from '@pf/shared';
import { throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Occupancy {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    participantId: row.participant_id as string,
    startDate: new Date(row.start_date as string),
    endDate: row.end_date ? new Date(row.end_date as string) : undefined,
    roomNumber: row.room_number as number | undefined,
    mrrcFortnightly: row.mrrc_fortnightly != null ? toCents(Number(row.mrrc_fortnightly)) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getOccupanciesByProperty(db: TypedSupabaseClient, propertyId: string): Promise<Occupancy[]> {
  const { data, error } = await db
    .from('occupancies')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getActiveOccupancy(
  db: TypedSupabaseClient,
  propertyId: string,
  participantId: string,
): Promise<Occupancy | null> {
  const { data, error } = await db
    .from('occupancies')
    .select('*')
    .eq('property_id', propertyId)
    .eq('participant_id', participantId)
    .is('end_date', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createOccupancy(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<Occupancy> {
  const result = await db.from('occupancies').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function endOccupancy(db: TypedSupabaseClient, id: string, endDate: Date): Promise<Occupancy> {
  const result = await db
    .from('occupancies')
    .update({ end_date: endDate.toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}
