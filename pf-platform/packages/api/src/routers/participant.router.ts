import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import {
  getParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  getParticipantsByProperty,
  getExpiringPlans,
} from '@pf/db';

export const participantRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      planStatus: z.string().optional(),
    }).optional())
    .query(({ ctx, input }) => getParticipants(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getParticipantById(ctx.db, input.id)),

  getByProperty: protectedProcedure
    .input(z.object({ propertyId: z.string().uuid() }))
    .query(({ ctx, input }) => getParticipantsByProperty(ctx.db, input.propertyId)),

  getExpiringPlans: protectedProcedure
    .input(z.object({ withinDays: z.number().default(90) }).optional())
    .query(({ ctx, input }) => getExpiringPlans(ctx.db, input?.withinDays)),

  create: protectedProcedure
    .input(z.object({
      ndis_number: z.string().min(9),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      date_of_birth: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      plan_management_type: z.string(),
      plan_status: z.string(),
      plan_start_date: z.string().optional(),
      plan_end_date: z.string().optional(),
      sda_category_funded: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const participant = await createParticipant(ctx.db, input);
      await auditAction(ctx, 'participant.created', 'participant', participant.id);
      return participant;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const participant = await updateParticipant(ctx.db, input.id, input.data);
      await auditAction(ctx, 'participant.updated', 'participant', participant.id, input.data);
      return participant;
    }),
});
