import type { AgencyAdapter, StatementParseResult } from './types';
import { getAdapterForAgency } from './adapters';

/**
 * Parse raw text content from a rental agency statement PDF.
 *
 * The text should already have been extracted from the PDF (e.g. via
 * the browser FileReader / pdf.js on the client, or a server-side
 * PDF-to-text tool).
 *
 * @param text         Raw text content extracted from the PDF.
 * @param adapter      Optional pre-resolved agency adapter. If not supplied,
 *                     the parser will auto-detect from the text.
 * @param agencyHint   Optional agency name hint for adapter resolution.
 * @returns            Structured parse result with extracted financial data.
 */
export function parseStatement(
  text: string,
  adapter?: AgencyAdapter,
  agencyHint?: string,
): StatementParseResult {
  if (!text || text.trim().length === 0) {
    return emptyResult(text);
  }

  // Normalise whitespace: collapse multiple spaces, convert tabs
  const normalised = text
    .replace(/\t/g, '  ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Resolve adapter
  const resolvedAdapter = adapter ?? getAdapterForAgency(agencyHint, normalised);

  // Parse
  const result = resolvedAdapter.parse(normalised);

  // Post-processing sanity checks
  return applyPostChecks(result);
}

/**
 * Apply basic sanity checks and adjustments to parsed results.
 */
function applyPostChecks(result: StatementParseResult): StatementParseResult {
  // If totalMoneyIn was not explicitly found but we have rent, use rent
  if (result.totalMoneyIn === 0 && result.rentReceived > 0) {
    result.totalMoneyIn = result.rentReceived;
  }

  // Ensure management fee is not greater than rent (likely a parse error)
  if (result.managementFee > result.rentReceived && result.rentReceived > 0) {
    // Swap — probably extracted the wrong values
    result.confidence = Math.max(result.confidence - 0.2, 0);
  }

  // Ensure GST is reasonable (should be ~10% of fee ex-GST, i.e. fee/11)
  if (result.gstOnFee > 0 && result.managementFee > 0) {
    const expectedGst = result.managementFee / 11;
    const ratio = result.gstOnFee / expectedGst;
    // If GST is wildly off (more than 2x or less than 0.5x expected), lower confidence
    if (ratio > 2 || ratio < 0.5) {
      result.confidence = Math.max(result.confidence - 0.1, 0);
    }
  }

  // Ensure period values are valid
  if (result.periodMonth < 1 || result.periodMonth > 12) {
    result.periodMonth = 0;
    result.confidence = Math.max(result.confidence - 0.1, 0);
  }
  if (result.periodYear > 0 && (result.periodYear < 2000 || result.periodYear > 2100)) {
    result.periodYear = 0;
    result.confidence = Math.max(result.confidence - 0.1, 0);
  }

  // Round confidence to 2 decimals
  result.confidence = Math.round(result.confidence * 100) / 100;

  return result;
}

function emptyResult(rawText: string): StatementParseResult {
  return {
    agencyName: 'Unknown',
    statementNumber: undefined,
    periodMonth: 0,
    periodYear: 0,
    rentReceived: 0,
    managementFee: 0,
    gstOnFee: 0,
    energyReimbursement: 0,
    maintenanceCosts: 0,
    otherItems: [],
    totalMoneyIn: 0,
    rawText,
    confidence: 0,
  };
}
