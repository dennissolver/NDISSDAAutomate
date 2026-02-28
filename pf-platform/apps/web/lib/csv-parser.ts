/**
 * Client-side CSV parser. Handles quoted fields, newlines in quotes, and BOM stripping.
 */
export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export async function parseCSV(file: File): Promise<ParsedCSV> {
  const text = await file.text();
  const cleaned = text.replace(/^\uFEFF/, ''); // strip BOM
  const lines = splitCSVLines(cleaned);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => parseCSVLine(line));

  return { headers, rows };
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // skip \n after \r
      }
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}
