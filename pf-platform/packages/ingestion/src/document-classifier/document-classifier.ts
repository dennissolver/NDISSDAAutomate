/**
 * Simple text-based document classifier.
 *
 * Analyses raw text extracted from a PDF to determine what kind of
 * document it is. Used to route incoming documents to the correct
 * processing pipeline.
 */

export type DocumentType =
  | 'rental_statement'
  | 'energy_invoice'
  | 'maintenance_invoice'
  | 'other';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number; // 0-1
  signals: string[];  // human-readable list of why this classification was chosen
}

interface Signal {
  pattern: RegExp;
  type: DocumentType;
  weight: number;
  label: string;
}

/**
 * Weighted signal patterns used to classify documents.
 * Each pattern that matches adds its weight to the corresponding document type.
 */
const SIGNALS: Signal[] = [
  // --- Rental Statement signals ---
  { pattern: /rental\s*statement/i,                type: 'rental_statement',    weight: 0.4,  label: 'Contains "rental statement"' },
  { pattern: /owner\s*(?:'?s?\s+)?statement/i,     type: 'rental_statement',    weight: 0.35, label: 'Contains "owner statement"' },
  { pattern: /rent\s+(?:received|collected)/i,      type: 'rental_statement',    weight: 0.3,  label: 'Contains "rent received/collected"' },
  { pattern: /management\s*fee/i,                   type: 'rental_statement',    weight: 0.25, label: 'Contains "management fee"' },
  { pattern: /(?:agency|agent)\s*fee/i,             type: 'rental_statement',    weight: 0.2,  label: 'Contains "agency fee"' },
  { pattern: /landlord/i,                           type: 'rental_statement',    weight: 0.15, label: 'Contains "landlord"' },
  { pattern: /(?:tenant|lessee)/i,                  type: 'rental_statement',    weight: 0.1,  label: 'Contains "tenant/lessee"' },
  { pattern: /property\s*management/i,              type: 'rental_statement',    weight: 0.15, label: 'Contains "property management"' },
  { pattern: /disbursement/i,                       type: 'rental_statement',    weight: 0.1,  label: 'Contains "disbursement"' },

  // --- Energy Invoice signals ---
  { pattern: /energy\s*(?:invoice|bill|account)/i,  type: 'energy_invoice',      weight: 0.4,  label: 'Contains "energy invoice/bill"' },
  { pattern: /electricity\s*(?:invoice|bill|charge|account)/i, type: 'energy_invoice', weight: 0.35, label: 'Contains "electricity invoice/bill"' },
  { pattern: /gas\s*(?:invoice|bill|account)/i,     type: 'energy_invoice',      weight: 0.3,  label: 'Contains "gas invoice/bill"' },
  { pattern: /(?:kwh|kilowatt)/i,                   type: 'energy_invoice',      weight: 0.3,  label: 'Contains energy unit (kWh)' },
  { pattern: /meter\s*(?:read|number)/i,            type: 'energy_invoice',      weight: 0.2,  label: 'Contains "meter read/number"' },
  { pattern: /(?:supply|usage)\s*charge/i,          type: 'energy_invoice',      weight: 0.2,  label: 'Contains "supply/usage charge"' },
  { pattern: /(?:agl|origin\s*energy|energy\s*australia|alinta|ergon|synergy)/i, type: 'energy_invoice', weight: 0.25, label: 'Contains known energy retailer name' },
  { pattern: /nmi\s*(?:number|:)/i,                 type: 'energy_invoice',      weight: 0.2,  label: 'Contains NMI reference' },

  // --- Maintenance Invoice signals ---
  { pattern: /(?:tax\s+)?invoice/i,                 type: 'maintenance_invoice', weight: 0.15, label: 'Contains "invoice"' },
  { pattern: /(?:plumb|electr(?:ical|ician)|locksmith|handyman|pest\s*control|cleaning\s*service)/i, type: 'maintenance_invoice', weight: 0.3, label: 'Contains trade/service keyword' },
  { pattern: /(?:labour|labor|materials|parts|callout)/i, type: 'maintenance_invoice', weight: 0.25, label: 'Contains "labour/materials/callout"' },
  { pattern: /work\s*(?:order|performed|completed)/i, type: 'maintenance_invoice', weight: 0.25, label: 'Contains "work order/performed"' },
  { pattern: /(?:quote|quotation)\s*(?:#|no|number)?/i, type: 'maintenance_invoice', weight: 0.15, label: 'Contains "quote/quotation"' },
  { pattern: /abn\s*[:\s]?\d/i,                     type: 'maintenance_invoice', weight: 0.1,  label: 'Contains ABN' },
];

/**
 * Classify a document based on its raw text content.
 */
export function classifyDocument(text: string): ClassificationResult {
  if (!text || text.trim().length === 0) {
    return { documentType: 'other', confidence: 0, signals: ['Empty document'] };
  }

  const scores: Record<DocumentType, number> = {
    rental_statement: 0,
    energy_invoice: 0,
    maintenance_invoice: 0,
    other: 0,
  };

  const matchedSignals: string[] = [];

  for (const signal of SIGNALS) {
    if (signal.pattern.test(text)) {
      scores[signal.type] += signal.weight;
      matchedSignals.push(signal.label);
    }
  }

  // Find the type with the highest score
  let bestType: DocumentType = 'other';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores) as [DocumentType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // If the best score is below threshold, classify as "other"
  if (bestScore < 0.2) {
    return {
      documentType: 'other',
      confidence: 0,
      signals: matchedSignals.length > 0
        ? matchedSignals
        : ['No recognisable document patterns found'],
    };
  }

  // Normalise confidence to 0-1 range (cap at 1.0)
  const confidence = Math.min(Math.round(bestScore * 100) / 100, 1);

  return {
    documentType: bestType,
    confidence,
    signals: matchedSignals,
  };
}
