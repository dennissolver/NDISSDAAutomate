/**
 * Supabase Storage bucket names and path conventions.
 */
export const STORAGE_BUCKETS = {
  RENTAL_STATEMENTS: 'rental-statements',
  RECONCILIATIONS: 'reconciliations',
  PROPERTY_DOCUMENTS: 'property-documents',
  CLAIM_EVIDENCE: 'claim-evidence',
  VOICE_SUMMARIES: 'voice-summaries',
} as const;

/**
 * Generate storage paths following PF conventions.
 */
export function statementPath(propertyId: string, year: number, month: number): string {
  return `${propertyId}/${year}/${String(month).padStart(2, '0')}/statement.pdf`;
}

export function reconPdfPath(propertyId: string, year: number, month: number): string {
  return `${propertyId}/${year}/${String(month).padStart(2, '0')}/reconciliation.pdf`;
}

export function propertyDocPath(propertyId: string, docType: string, filename: string): string {
  return `${propertyId}/docs/${docType}/${filename}`;
}

export function voiceSummaryPath(clientId: string, year: number, month: number): string {
  return `${clientId}/${year}/${String(month).padStart(2, '0')}/summary.mp3`;
}
