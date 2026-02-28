/**
 * Shared parsing utilities used by all agency adapters.
 */

const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/**
 * Parse an Australian dollar string into a number.
 * Handles: "3,200.00", "3200", "3,200", "3200.5"
 */
export function parseAustralianDollar(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : Math.round(value * 100) / 100;
}

/**
 * Extract a period (month + year) from statement text.
 *
 * Handles common patterns:
 *   - "Period: January 2026"
 *   - "Statement for Jan 2026"
 *   - "01/2026"
 *   - "Period: 1 January 2026 - 31 January 2026"
 *   - "For the month of February 2026"
 *   - "Date: 15/01/2026" (extracts month/year from date)
 */
export function extractPeriod(
  text: string,
): { month: number; year: number } | null {
  // Pattern 1: "Period: January 2026" or "For the month of Feb 2026"
  const monthNameYearRe =
    /(?:period|month|for|statement|date)[:\s]*(?:the\s+month\s+of\s+)?(?:\d{1,2}\s+)?(\w+)\s+(20\d{2})/i;
  const m1 = text.match(monthNameYearRe);
  if (m1) {
    const month = MONTH_NAMES[m1[1].toLowerCase()];
    const year = parseInt(m1[2], 10);
    if (month && year >= 2000 && year <= 2100) {
      return { month, year };
    }
  }

  // Pattern 2: standalone "January 2026" anywhere in first ~500 chars of text
  const headerText = text.substring(0, 500);
  const standaloneMonthYear =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(20\d{2})\b/i;
  const m2 = headerText.match(standaloneMonthYear);
  if (m2) {
    const month = MONTH_NAMES[m2[1].toLowerCase()];
    const year = parseInt(m2[2], 10);
    if (month && year >= 2000 && year <= 2100) {
      return { month, year };
    }
  }

  // Pattern 3: "01/2026" or "1/2026"
  const mmYYYY = text.match(/\b(\d{1,2})\/(20\d{2})\b/);
  if (mmYYYY) {
    const month = parseInt(mmYYYY[1], 10);
    const year = parseInt(mmYYYY[2], 10);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return { month, year };
    }
  }

  // Pattern 4: "dd/mm/yyyy" date — extract month/year
  const dateDMY = text.match(/\b\d{1,2}\/(\d{1,2})\/(20\d{2})\b/);
  if (dateDMY) {
    const month = parseInt(dateDMY[1], 10);
    const year = parseInt(dateDMY[2], 10);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return { month, year };
    }
  }

  return null;
}

/**
 * Sum amounts from an array of items.
 */
export function sumItems(items: { amount: number }[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
}
