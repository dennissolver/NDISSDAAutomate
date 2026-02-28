import type { AgencyAdapter } from '../types';
import { Century21Adapter } from './century21.adapter';
import { AaronMoonAdapter } from './aaron-moon.adapter';
import { GenericAdapter } from './generic.adapter';

export { Century21Adapter } from './century21.adapter';
export { AaronMoonAdapter } from './aaron-moon.adapter';
export { GenericAdapter } from './generic.adapter';

/**
 * All registered agency adapters, in priority order.
 * Agency-specific adapters come first; the generic fallback is last.
 */
const ADAPTERS: AgencyAdapter[] = [
  new Century21Adapter(),
  new AaronMoonAdapter(),
  new GenericAdapter(),
];

/**
 * Resolve the best adapter for a given agency name or statement text.
 *
 * @param agencyName  Optional hint — if provided, we look for an adapter
 *                    whose agencyName matches (case-insensitive substring).
 * @param text        Optional raw statement text — used to auto-detect the
 *                    agency via each adapter's `canParse()` fingerprint.
 *
 * If both are provided, agencyName hint takes priority.
 * Always falls back to the GenericAdapter.
 */
export function getAdapterForAgency(
  agencyName?: string,
  text?: string,
): AgencyAdapter {
  // 1. Try matching by name hint
  if (agencyName) {
    const lower = agencyName.toLowerCase();
    for (const adapter of ADAPTERS) {
      if (adapter.agencyName.toLowerCase().includes(lower)) {
        return adapter;
      }
      // Also check reversed: hint might be "c21" while adapter is "Century 21"
      if (lower.includes(adapter.agencyName.toLowerCase())) {
        return adapter;
      }
    }
    // Check partial keywords
    if (/century\s*21|c21/i.test(agencyName)) {
      return new Century21Adapter();
    }
    if (/aaron\s*moon/i.test(agencyName)) {
      return new AaronMoonAdapter();
    }
  }

  // 2. Try auto-detecting from text content
  if (text) {
    for (const adapter of ADAPTERS) {
      // Skip generic — it always returns true
      if (adapter instanceof GenericAdapter) continue;
      if (adapter.canParse(text)) {
        return adapter;
      }
    }
  }

  // 3. Fallback
  return new GenericAdapter();
}
