import type { AgencyAdapter, StatementParseResult } from '../types';
import { extractPeriod, parseAustralianDollar, sumItems } from '../parse-utils';

/**
 * Parser adapter for Century 21 rental statements.
 *
 * Century 21 statements typically contain:
 *   - "Century 21" branding in the header
 *   - "Rent Received" or "Rent Collected" line item
 *   - "Management Fee" (sometimes "Mgmt Fee") line item, GST-inclusive
 *   - GST line showing tax on management fee
 *   - Itemised maintenance / repairs
 *   - Energy charges (sometimes listed as "Water" or "Electricity")
 *   - Statement number and period in header
 */
export class Century21Adapter implements AgencyAdapter {
  agencyName = 'Century 21';

  /** Fingerprint patterns unique to Century 21 statements */
  private static readonly IDENTITY_PATTERNS = [
    /century\s*21/i,
    /c21/i,
  ];

  canParse(text: string): boolean {
    return Century21Adapter.IDENTITY_PATTERNS.some((p) => p.test(text));
  }

  parse(text: string): StatementParseResult {
    let confidence = 0;
    const lines = text.split('\n').map((l) => l.trim());

    // --- Statement number ---
    const stmtMatch = text.match(
      /(?:statement|stm?t)\s*(?:#|no\.?|number)?\s*[:\s]?\s*(\d+)/i,
    );
    const statementNumber = stmtMatch ? parseInt(stmtMatch[1], 10) : undefined;
    if (statementNumber !== undefined) confidence += 0.1;

    // --- Period ---
    const period = extractPeriod(text);
    if (period) confidence += 0.15;

    // --- Rent received ---
    // Matches: "Rent Received  $3,200.00", "Rent Collected  3200.00", "Total Rent $3,200"
    const rentPatterns = [
      /(?:total\s+)?rent\s+(?:received|collected|paid)[:\s]*\$?([\d,]+\.?\d*)/i,
      /rent\s*[:\s]+\$?([\d,]+\.?\d*)/i,
    ];
    let rentReceived = 0;
    for (const pattern of rentPatterns) {
      const m = text.match(pattern);
      if (m) {
        rentReceived = parseAustralianDollar(m[1]);
        confidence += 0.2;
        break;
      }
    }

    // --- Management fee ---
    // "Management Fee $140.80", "Mgmt Fee (incl GST) $140.80"
    const feePatterns = [
      /(?:management|mgmt|mgt)\s*fee[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /(?:commission|agent(?:'?s)?\s+fee)[^$\d\n]*\$?([\d,]+\.?\d*)/i,
    ];
    let managementFee = 0;
    for (const pattern of feePatterns) {
      const m = text.match(pattern);
      if (m) {
        managementFee = parseAustralianDollar(m[1]);
        confidence += 0.15;
        break;
      }
    }

    // --- GST on fee ---
    // "GST $12.80", "GST on Fee $12.80"
    const gstPatterns = [
      /gst\s*(?:on\s+(?:management\s+)?fee)?[^$\d\n]*\$?([\d,]+\.?\d*)/i,
    ];
    let gstOnFee = 0;
    for (const pattern of gstPatterns) {
      const m = text.match(pattern);
      if (m) {
        gstOnFee = parseAustralianDollar(m[1]);
        confidence += 0.1;
        break;
      }
    }
    // If we have management fee but no explicit GST, calculate it (fee is normally GST-inclusive)
    if (managementFee > 0 && gstOnFee === 0) {
      gstOnFee = round2(managementFee / 11);
    }

    // --- Energy / utility charges ---
    const energyPatterns = [
      /(?:energy|electricity|water|gas|utilit(?:y|ies))\s*(?:charge|reimbursement|cost)?[^$\d\n]*\$?([\d,]+\.?\d*)/gi,
    ];
    let energyReimbursement = 0;
    for (const pattern of energyPatterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        energyReimbursement += parseAustralianDollar(m[1]);
      }
    }
    if (energyReimbursement > 0) confidence += 0.1;

    // --- Maintenance / repair items ---
    // Look for lines containing maintenance-related keywords followed by a dollar amount
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
    if (maintenanceCosts > 0) confidence += 0.1;

    // --- Other deduction items (non-maintenance, non-fee) ---
    const otherItems: { description: string; amount: number }[] = [];
    const otherKeywords =
      /(?:advertising|letting\s+fee|lease\s+renewal|inspection|insurance|postage|sundry|tribunal|strata|body\s+corp)/i;
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

    // --- Total money in ---
    // Try to find an explicit total, otherwise use rent received
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

    // Agency identity boost
    if (this.canParse(text)) confidence += 0.1;

    confidence = Math.min(confidence, 1);

    return {
      agencyName: this.agencyName,
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
