/**
 * NDIA service — high-level operations for participant lookup,
 * service bookings, plan status, and bulk payment requests.
 *
 * All methods gracefully return null/empty when the NDIA API
 * is not configured, allowing the rest of the system to function
 * without PRODA credentials.
 */

import { createNdiaClient, isNdiaConfigured } from './ndia.client';
import type {
  ParticipantLookup,
  ServiceBooking,
  PlanStatus,
  ClaimData,
  SubmissionResult,
  ClaimResult,
} from './ndia.types';

// ── API response shapes ──────────────────────────────────────────────

interface ParticipantResponse {
  ndisNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  currentPlan: {
    status: string;
    startDate: string;
    endDate: string;
    managedBy: 'ndia' | 'plan_manager' | 'self';
  };
}

interface ServiceBookingsResponse {
  bookings: Array<{
    bookingId: string;
    ndisNumber: string;
    supportCategory: string;
    supportItemNumber: string;
    startDate: string;
    endDate: string;
    allocatedAmount: number;
    remainingAmount: number;
    status: 'active' | 'expired' | 'cancelled';
  }>;
}

interface PlanStatusResponse {
  ndisNumber: string;
  planId: string;
  status: 'active' | 'expiring' | 'expired' | 'reassessment';
  startDate: string;
  endDate: string;
  managedBy: 'ndia' | 'plan_manager' | 'self';
  paceTransition: boolean;
}

interface BulkPaymentResponse {
  batchId: string;
  submittedAt: string;
  totalClaims: number;
  accepted: number;
  rejected: number;
  results: ClaimResult[];
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Look up an NDIS participant by their NDIS number.
 *
 * Returns `null` when the NDIA API is not configured or the
 * participant is not found.
 */
export async function lookupParticipant(
  ndisNumber: string,
): Promise<ParticipantLookup | null> {
  if (!isNdiaConfigured()) {
    console.warn('[ndia] Not configured — skipping participant lookup.');
    return null;
  }

  const client = createNdiaClient();
  if (!client) return null;

  try {
    const data = await client.get<ParticipantResponse>(
      `/v1/participants/${ndisNumber}`,
    );

    return {
      ndisNumber: data.ndisNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      planStatus: data.currentPlan.status,
      planStartDate: data.currentPlan.startDate,
      planEndDate: data.currentPlan.endDate,
      planManagedBy: data.currentPlan.managedBy,
    };
  } catch (err) {
    console.error(`[ndia] Participant lookup failed for ${ndisNumber}:`, err);
    return null;
  }
}

/**
 * Get active and recent service bookings for a participant.
 *
 * Returns an empty array when the NDIA API is not configured.
 */
export async function getServiceBookings(
  ndisNumber: string,
): Promise<ServiceBooking[]> {
  if (!isNdiaConfigured()) return [];

  const client = createNdiaClient();
  if (!client) return [];

  try {
    const data = await client.get<ServiceBookingsResponse>(
      `/v1/participants/${ndisNumber}/service-bookings`,
    );

    return data.bookings.map((b) => ({
      bookingId: b.bookingId,
      ndisNumber: b.ndisNumber,
      supportCategory: b.supportCategory,
      supportItemNumber: b.supportItemNumber,
      startDate: b.startDate,
      endDate: b.endDate,
      allocatedAmount: b.allocatedAmount,
      remainingAmount: b.remainingAmount,
      status: b.status,
    }));
  } catch (err) {
    console.error(
      `[ndia] Service bookings fetch failed for ${ndisNumber}:`,
      err,
    );
    return [];
  }
}

/**
 * Get the current plan status for a participant, including
 * days remaining and PACE transition flag.
 *
 * Returns `null` when the NDIA API is not configured or on error.
 */
export async function getPlanStatus(
  ndisNumber: string,
): Promise<PlanStatus | null> {
  if (!isNdiaConfigured()) return null;

  const client = createNdiaClient();
  if (!client) return null;

  try {
    const data = await client.get<PlanStatusResponse>(
      `/v1/participants/${ndisNumber}/plan-status`,
    );

    const endDate = new Date(data.endDate);
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      ndisNumber: data.ndisNumber,
      planId: data.planId,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      daysRemaining,
      managedBy: data.managedBy,
      paceTransition: data.paceTransition,
    };
  } catch (err) {
    console.error(`[ndia] Plan status fetch failed for ${ndisNumber}:`, err);
    return null;
  }
}

/**
 * Submit a bulk payment request to the NDIA.
 *
 * This is the primary method for submitting SDA claims via PRODA.
 * Each claim includes the NDIS number, support item, dates, and amounts.
 *
 * Returns `null` when the NDIA API is not configured.
 */
export async function submitBulkPaymentRequest(
  claims: ClaimData[],
): Promise<SubmissionResult | null> {
  if (!isNdiaConfigured()) {
    console.warn('[ndia] Not configured — cannot submit bulk payment request.');
    return null;
  }

  const client = createNdiaClient();
  if (!client) return null;

  if (claims.length === 0) {
    return {
      batchId: '',
      submittedAt: new Date().toISOString(),
      totalClaims: 0,
      accepted: 0,
      rejected: 0,
      results: [],
    };
  }

  try {
    const payload = {
      claims: claims.map((c) => ({
        ndisNumber: c.ndisNumber,
        supportItemNumber: c.supportItemNumber,
        claimReference: c.claimReference,
        serviceDate: c.serviceDate,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        gstCode: c.gstCode,
        cancellationReason: c.cancellationReason,
      })),
    };

    const data = await client.post<BulkPaymentResponse>(
      '/v1/bulk-payment-requests',
      payload,
    );

    return {
      batchId: data.batchId,
      submittedAt: data.submittedAt,
      totalClaims: data.totalClaims,
      accepted: data.accepted,
      rejected: data.rejected,
      results: data.results,
    };
  } catch (err) {
    console.error('[ndia] Bulk payment request failed:', err);
    throw err;
  }
}
