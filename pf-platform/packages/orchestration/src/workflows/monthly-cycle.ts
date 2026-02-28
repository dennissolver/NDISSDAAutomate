import type { TypedSupabaseClient } from '@pf/db';
import {
  getReconciliationByPropertyPeriod,
  createReconciliation,
} from '@pf/db';

export interface MonthlyCycleSummary {
  propertiesChecked: number;
  reconciliationsCreated: number;
  skipped: number;
  errors: Array<{ propertyId: string; error: string }>;
}

/**
 * Creates pending reconciliation records for all enrolled properties
 * for a given month/year if they don't already exist.
 *
 * Intended to run on the 1st of each month, creating recons for the previous month.
 */
export async function runMonthlyReconciliationCycle(
  db: TypedSupabaseClient,
  month: number,
  year: number,
): Promise<MonthlyCycleSummary> {
  // Get all enrolled properties
  const { data: properties, error: propError } = await db
    .from('properties')
    .select('id, property_label, address_line_1')
    .eq('sda_enrolment_status', 'enrolled');

  if (propError) throw new Error(propError.message);

  const summary: MonthlyCycleSummary = {
    propertiesChecked: properties?.length ?? 0,
    reconciliationsCreated: 0,
    skipped: 0,
    errors: [],
  };

  if (!properties || properties.length === 0) return summary;

  for (const property of properties) {
    const propId = (property as Record<string, unknown>).id as string;

    try {
      // Check if a reconciliation already exists for this property+period
      const existing = await getReconciliationByPropertyPeriod(db, propId, month, year);
      if (existing) {
        summary.skipped++;
        continue;
      }

      // Create a pending reconciliation
      await createReconciliation(db, {
        property_id: propId,
        period_month: month,
        period_year: year,
        status: 'pending',
      });
      summary.reconciliationsCreated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ propertyId: propId, error: message });
    }
  }

  return summary;
}
