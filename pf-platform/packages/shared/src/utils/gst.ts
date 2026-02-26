import type { Cents } from '../types/common.types';
import { GST_DIVISOR } from '../constants/fee-structure';

/** Calculate GST component from a GST-inclusive amount */
export function gstFromInclusive(inclusiveAmount: Cents): Cents {
  return Math.round(inclusiveAmount / GST_DIVISOR);
}

/** Calculate GST-exclusive amount from GST-inclusive */
export function excludeGst(inclusiveAmount: Cents): Cents {
  return inclusiveAmount - gstFromInclusive(inclusiveAmount);
}

/** Add GST to a GST-exclusive amount */
export function includeGst(exclusiveAmount: Cents): Cents {
  return Math.round(exclusiveAmount * 1.1);
}
