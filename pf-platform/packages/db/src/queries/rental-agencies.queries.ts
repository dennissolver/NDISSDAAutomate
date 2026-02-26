import type { TypedSupabaseClient } from '../client';
import type { RentalAgency } from '@pf/shared';

function mapRow(row: Record<string, unknown>): RentalAgency {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    feeRate: Number(row.fee_rate),
    statementFormat: row.statement_format as string,
    senderEmailPattern: row.sender_email_pattern as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

export async function getRentalAgencies(db: TypedSupabaseClient): Promise<RentalAgency[]> {
  const { data, error } = await db.from('rental_agencies').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getRentalAgencyById(db: TypedSupabaseClient, id: string): Promise<RentalAgency> {
  const { data, error } = await db.from('rental_agencies').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}
