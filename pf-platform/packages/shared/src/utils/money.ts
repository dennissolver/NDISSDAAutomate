import type { Cents } from '../types/common.types';

/**
 * All monetary arithmetic uses integer cents to avoid floating-point errors.
 * Convert to dollars only for display.
 */

/** Convert dollars to cents */
export function toCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars */
export function toDollars(cents: Cents): number {
  return cents / 100;
}

/** Format cents as AUD string */
export function formatAud(cents: Cents): string {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(dollars);
}

/** Calculate percentage of an amount (in cents) */
export function percentOf(cents: Cents, rate: number): Cents {
  return Math.round(cents * rate);
}

/** Sum an array of cent values */
export function sumCents(...values: Cents[]): Cents {
  return values.reduce((acc, val) => acc + val, 0);
}

/** GST: 1/11 of a GST-inclusive amount */
export function gstFromInclusive(inclusiveCents: Cents): Cents {
  return Math.round(inclusiveCents / 11);
}

/** Add GST to a GST-exclusive amount */
export function addGst(exclusiveCents: Cents): Cents {
  return Math.round(exclusiveCents * 1.1);
}
