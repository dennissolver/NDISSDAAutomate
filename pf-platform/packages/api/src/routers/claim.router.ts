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
});
