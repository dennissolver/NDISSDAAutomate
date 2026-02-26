import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import { getClients, getClientById, createClient, updateClient } from '@pf/db';

export const clientRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }).optional())
    .query(({ ctx, input }) => getClients(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getClientById(ctx.db, input.id)),

  create: protectedProcedure
    .input(z.object({
      full_name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      entity_type: z.string().default('individual'),
      entity_name: z.string().optional(),
      abn: z.string().optional(),
      bank_bsb: z.string().optional(),
      bank_account_number: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await createClient(ctx.db, input);
      await auditAction(ctx, 'client.created', 'client', client.id);
      return client;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await updateClient(ctx.db, input.id, input.data);
      await auditAction(ctx, 'client.updated', 'client', client.id, input.data);
      return client;
    }),
});
