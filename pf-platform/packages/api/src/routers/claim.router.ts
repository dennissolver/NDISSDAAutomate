import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import {
  getClaims,
  getClaimById,
  createClaim as dbCreateClaim,
  updateClaimStatus,
  getPropertyById,
  getParticipantById,
} from '@pf/db';
import { generateClaim } from '@pf/core';
import { toDollars } from '@pf/shared';

export const claimRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      status: z.string().optional(),
      pathway: z.string().optional(),
    }).optional())
    .query(({ ctx, input }) => getClaims(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getClaimById(ctx.db, input.id)),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.string().uuid(),
      participantId: z.string().uuid(),
      periodMonth: z.number().int().min(1).max(12),
      periodYear: z.number().int(),
      occupiedDays: z.number().int().positive().optional(),
      mrrcFortnightly: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [property, participant] = await Promise.all([
        getPropertyById(ctx.db, input.propertyId),
        getParticipantById(ctx.db, input.participantId),
      ]);

      const draft = generateClaim({
        property,
        participant,
        period: { month: input.periodMonth, year: input.periodYear },
        occupiedDays: input.occupiedDays,
        mrrcFortnightly: input.mrrcFortnightly,
      });

      const claim = await dbCreateClaim(ctx.db, {
        claim_reference: draft.claimReference,
        property_id: draft.propertyId,
        participant_id: draft.participantId,
        claim_pathway: draft.claimPathway,
        period_start: draft.periodStart.toISOString().split('T')[0],
        period_end: draft.periodEnd.toISOString().split('T')[0],
        sda_amount: toDollars(draft.sdaAmount),
        mrrc_amount: draft.mrrcAmount ? toDollars(draft.mrrcAmount) : null,
        total_amount: toDollars(draft.totalAmount),
        ndis_item_number: draft.ndisItemNumber,
        status: 'draft',
      });

      await auditAction(ctx, 'claim.created', 'claim', claim.id);
      return claim;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.string(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const extra: Record<string, unknown> = {};
      if (input.rejectionReason) extra.rejection_reason = input.rejectionReason;
      if (input.status === 'submitted') extra.submitted_at = new Date().toISOString();
      if (input.status === 'approved') extra.approved_at = new Date().toISOString();
      if (input.status === 'paid') extra.paid_at = new Date().toISOString();

      const claim = await updateClaimStatus(ctx.db, input.id, input.status, extra);
      await auditAction(ctx, `claim.${input.status}`, 'claim', claim.id);
      return claim;
    }),

  exportProdaCsv: protectedProcedure
    .input(z.object({
      claimIds: z.array(z.string().uuid()).min(1).max(500),
    }))
    .query(async ({ ctx, input }) => {
      const claims = await Promise.all(
        input.claimIds.map(id => getClaimById(ctx.db, id))
      );

      // Also need participant and property data for each claim
      const rows = await Promise.all(claims.map(async (claim) => {
        const [participant, property] = await Promise.all([
          getParticipantById(ctx.db, claim.participantId),
          getPropertyById(ctx.db, claim.propertyId),
        ]);
        return { claim, participant, property };
      }));

      // Build CSV header
      const headers = [
        'RegistrationNumber', 'NDISNumber', 'ParticipantFirstName', 'ParticipantLastName',
        'ParticipantDateOfBirth', 'SupportItemNumber', 'ClaimReference',
        'FromDate', 'ToDate', 'Quantity', 'Hours', 'UnitPrice', 'GSTCode',
        'ClaimType', 'CancellationReason',
      ];

      // Format dates as YYYY/MM/DD (US format for PRODA)
      const formatProdaDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${day}`;
      };

      const csvRows = rows.map(({ claim, participant, property }) => {
        // Calculate quantity as number of days
        const start = new Date(claim.periodStart);
        const end = new Date(claim.periodEnd);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Unit price = total / days (in dollars, 2dp)
        const unitPrice = (claim.totalAmount / 100 / days).toFixed(2);

        return [
          '', // RegistrationNumber - PF's NDIS registration number (to be configured)
          participant.ndisNumber,
          participant.firstName,
          participant.lastName,
          formatProdaDate(new Date(participant.dateOfBirth)),
          claim.ndisItemNumber,
          claim.claimReference,
          formatProdaDate(start),
          formatProdaDate(end),
          days.toString(),
          '', // Hours - not applicable for SDA
          unitPrice,
          'P1', // GST-free
          '1', // New claim
          '', // No cancellation
        ];
      });

      const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      return { csv, filename: `proda-claims-${new Date().toISOString().split('T')[0]}.csv` };
    }),
});
