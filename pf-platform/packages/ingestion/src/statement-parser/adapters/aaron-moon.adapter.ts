import type { AgencyAdapter, StatementParseResult } from '../types';
import { extractPeriod, parseAustralianDollar, sumItems } from '../parse-utils';

/**
 * Parser adapter for Aaron Moon Realty rental statements.
 *
 * Aaron Moon Realty statements typically:
 *   - Have "Aaron Moon" or "Aaron Moon Realty" in the header
 *   - Use "Income" / "Rent" for rental income
 *   - List "Agency Fee" or "Management Fee" with GST shown separately
 *   - May show maintenance items grouped under "Disbursements" or "Expenses"
 *   - Statement number may appear as "Stmt No" or "Reference"
 */
export class AaronMoonAdapter implements AgencyAdapter {
  agencyName = 'Aaron Moon Realty';

  private static readonly IDENTITY_PATTERNS = [
    /aaron\s*moon/i,
    /a\.?\s*moon\s*realty/i,
  ];

  canParse(text: string): boolean {
    return AaronMoonAdapter.IDENTITY_PATTERNS.some((p) => p.test(text));
  }

  parse(text: string): StatementParseResult {
    let confidence = 0;
    const lines = text.split('\n').map((l) => l.trim());

    // --- Statement number ---
    const stmtMatch = text.match(
      /(?:statement|stm?t|reference|ref)\s*(?:#|no\.?|number)?\s*[:\s]?\s*(\d+)/i,
    );
    const statementNumber = stmtMatch ? parseInt(stmtMatch[1], 10) : undefined;
    if (statementNumber !== undefined) confidence += 0.1;

    // --- Period ---
    const period = extractPeriod(text);
    if (period) confidence += 0.15;

    // --- Rent / Income ---
    // Aaron Moon may use "Rent", "Rental Income", "Income Received"
    const rentPatterns = [
      /(?:rental?\s+)?income\s+(?:received)?[:\s]*\$?([\d,]+\.?\d*)/i,
      /(?:total\s+)?rent\s+(?:received|collected)?[:\s]*\$?([\d,]+\.?\d*)/i,
      /rent[:\s]+\$?([\d,]+\.?\d*)/i,
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

    // --- Management / Agency fee ---
    const feePatterns = [
      /(?:agency|management|mgmt)\s*fee[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /(?:commission)[^$\d\n]*\$?([\d,]+\.?\d*)/i,
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

    // --- GST ---
    const gstPatterns = [
      /gst\s*(?:on\s+(?:agency\s+|management\s+)?fee)?[^$\d\n]*\$?([\d,]+\.?\d*)/i,
      /goods\s*(?:&|and)\s*services\s*tax[^$\d\n]*\$?([\d,]+\.?\d*)/i,
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
    if (managementFee > 0 && gstOnFee === 0) {
      gstOnFee = round2(managementFee / 11);
    }

    // --- Energy charges ---
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

    // --- Disbursements / Maintenance ---
    // Aaron Moon groups repairs under "Disbursements" section
    const maintenanceKeywords =
      /(?:maintenance|repair|plumb|electr(?:ical|ician)|locksmith|cleaning|handyman|garden|pest|paint|replace|fix|service\s+call|callout|trades|disbursement)/i;
    const maintenanceItems: { description: string; amount: number }[] = [];
    for (const line of lines) {
      if (maintenanceKeywords.test(line)) {
        const amtMatch = line.match(/\$?([\d,]+\.?\d*)\s*$/);
        if (amtMatch) {
          const amount = parseAustralianDollar(amtMatch[1]);
          // Skip if it looks like the disbursement section header with a total
          if (amount > 0 && amount < 50000 && !/^(?:total\s+)?disbursement/i.test(line)) {
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
