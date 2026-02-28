import type { AgencyAdapter, StatementParseResult } from '../types';
import { extractPeriod, parseAustralianDollar, sumItems } from '../parse-utils';

/**
 * Generic fallback adapter that tries common patterns found across
 * Australian property management rental statements.
 *
 * This adapter always returns canParse = true, so it should be tried
 * last after all agency-specific adapters have been checked.
 */
export class GenericAdapter implements AgencyAdapter {
  agencyName = 'Unknown Agency';

  canParse(_text: string): boolean {
    // Fallback adapter always accepts
    return true;
  }

  parse(text: string): StatementParseResult {
    let confidence = 0;
    const lines = text.split('\n').map((l) => l.trim());

    // --- Try to detect agency name from first few lines ---
    const agencyName = detectAgencyName(text) ?? 'Unknown Agency';

    // --- Statement number ---
    const stmtMatch = text.match(
      /(?:statement|stm?t|invoice|ref(?:erence)?)\s*(?:#|no\.?|number)?\s*[:\s]?\s*(\d+)/i,
    );
    const statementNumber = stmtMatch ? parseInt(stmtMatch[1], 10) : undefined;
    if (statementNumber !== undefined) confidence += 0.05;

    // --- Period ---
    const period = extractPeriod(text);
    if (period) confidence += 0.1;

    // --- Rent ---
    const rentPatterns = [
      /(?:total\s+)?rent\s+(?:received|collected|paid|income)[:\s]*\$?([\d,]+\.?\d*)/i,
      /(?:rental?\s+)?income[:\s]*\$?([\d,]+\.?\d*)/i,
      /rent[:\s]+\$?([\d,]+\.?\d*)/i,
    ];
    let rentReceived = 0;
    for (const pattern of rentPatterns) {
      const m = text.match(pattern);
      if (m) {
        rentReceived = parseAustralianDollar(m[1]);
        confidence += 0.15;
        break;
      }
    }

    // --- Management fee ---
    const feePatterns = [
      /(?:management|mgmt|mgt|agency)\s*fee[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /commission[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /agent(?:'?s)?\s+fee[^$\d\n]*\$?([\d,]+\.?\d*)/i,
    ];
    let managementFee = 0;
    for (const pattern of feePatterns) {
      const m = text.match(pattern);
      if (m) {
        managementFee = parseAustralianDollar(m[1]);
        confidence += 0.1;
        break;
      }
    }

    // --- GST ---
    let gstOnFee = 0;
    const gstMatch = text.match(
      /gst[^$\d\n]*\$?([\d,]+\.?\d*)/i,
    );
    if (gstMatch) {
      gstOnFee = parseAustralianDollar(gstMatch[1]);
      confidence += 0.05;
    } else if (managementFee > 0) {
      gstOnFee = round2(managementFee / 11);
    }

    // --- Energy ---
    let energyReimbursement = 0;
    const energyRe =
      /(?:energy|electricity|water|gas|utilit(?:y|ies))\s*(?:charge|reimbursement|cost)?[^$\d\n]*\$?([\d,]+\.?\d*)/gi;
    let em: RegExpExecArray | null;
    while ((em = energyRe.exec(text)) !== null) {
      energyReimbursement += parseAustralianDollar(em[1]);
    }
    if (energyReimbursement > 0) confidence += 0.05;

    // --- Maintenance items ---
    const maintenanceKeywords =
      /(?:maintenance|repair|plumb|electr(?:ical|ician)|locksmith|cleaning|handyman|garden|pest|paint|replace|fix|service\s+call|callout|trades)/i;
    const maintenanceItems: { description: string; amount: number }[] = [];
    for (const line of lines) {
      if (maintenanceKeywords.test(line)) {
        const amtMatch = line.match(/\$?([\d,]+\.?\d*)\s*$/);
        if (amtMatch) {
          const amount = parseAustralianDollar(amtMatch[1]);
          if (amount > 0 && amount < 50000) {
            maintenanceItems.push({
              description: line.replace(/\$?[\d,]+\.?\d*\s*$/, '').trim(),
              amount,
            });
          }
        }
      }
    }
    const maintenanceCosts = sumItems(maintenanceItems);
    if (maintenanceCosts > 0) confidence += 0.05;

    // --- Other items ---
    const otherItems: { description: string; amount: number }[] = [];
    const otherKeywords =
      /(?:advertising|letting\s+fee|lease\s+renewal|inspection|insurance|postage|sundry|tribunal|strata|body\s+corp|admin)/i;
    for (const line of lines) {
      if (otherKeywords.test(line)) {
        const amtMatch = line.match(/\$?([\d,]+\.?\d*)\s*$/);
        if (amtMatch) {
          const amount = parseAustralianDollar(amtMatch[1]);
          if (amount > 0 && amount < 50000) {
            otherItems.push({
              description: line.replace(/\$?[\d,]+\.?\d*\s*$/, '').trim(),
              amount,
            });
          }
        }
      }
    }

    // --- Total ---
    const totalPatterns = [
      /total\s+(?:money\s+)?(?:in|received|income)[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /(?:gross|total)\s+rent[^$\d\n]*\$?([\d,]+\.?\d*)/i,
    ];
    let totalMoneyIn = rentReceived;
    for (const pattern of totalPatterns) {
      const m = text.match(pattern);
      if (m) {
        totalMoneyIn = parseAustralianDollar(m[1]);
        break;
      }
    }

    // Generic adapter always has lower confidence
    confidence = Math.min(confidence, 0.7);

    return {
      agencyName,
      statementNumber,
      periodMonth: period?.month ?? 0,
      periodYear: period?.year ?? 0,
      rentReceived,
      managementFee,
      gstOnFee,
      energyReimbursement,
      maintenanceCosts,
      otherItems: [...maintenanceItems, ...otherItems],
      totalMoneyIn,
      rawText: text,
      confidence,
    };
  }
}

/**
 * Attempt to pull the agency or business name from the first 10 lines of text.
 * Many statements have the agency name as one of the first lines, often in
 * all-caps or followed by "Pty Ltd", "Real Estate", "Realty", etc.
 */
function detectAgencyName(text: string): string | null {
  const headerLines = text.split('\n').slice(0, 10);
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Match lines like "XYZ Real Estate", "ABC Property Group Pty Ltd"
    if (/(?:real\s*estate|realty|property|group|pty|ltd)/i.test(trimmed)) {
      // Clean up and return
      return trimmed.replace(/\s{2,}/g, ' ').substring(0, 60);
    }
  }
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
