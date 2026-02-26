/**
 * Validate NDIS participant number format.
 * NDIS numbers are typically 9 digits.
 */
export function isValidNdisNumber(ndisNumber: string): boolean {
  const cleaned = ndisNumber.replace(/\s/g, '');
  return /^\d{9}$/.test(cleaned);
}

/** Format NDIS number with standard spacing */
export function formatNdisNumber(ndisNumber: string): string {
  const cleaned = ndisNumber.replace(/\s/g, '');
  if (cleaned.length !== 9) return ndisNumber;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}
