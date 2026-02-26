import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import { getExceptions, getExceptionById, updateExceptionStatus, getOpenExceptionCount } from '@pf/db';

export const exceptionRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      status: z.string().optional(),
      severity: z.string().optional(),
      type: z.string().optional(),
    }).optional())
    .query(({ ctx, input }) => getExceptions(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getExceptionById(ctx.db, input.id)),

  getOpenCounts: protectedProcedure
    .query(({ ctx }) => getOpenExceptionCount(ctx.db)),

  acknowledge: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const exception = await updateExceptionStatus(ctx.db, input.id, 'acknowledged', {
        assigned_to: ctx.user!.id,
      });
      await auditAction(ctx, 'exception.acknowledged', 'exception', exception.id);
      return exception;
    }),

  resolve: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const exception = await updateExceptionStatus(ctx.db, input.id, 'resolved', {
        resolved_by: ctx.user!.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: input.resolutionNotes,
      });
      await auditAction(ctx, 'exception.resolved', 'exception', exception.id);
      return exception;
    }),

  dismiss: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const exception = await updateExceptionStatus(ctx.db, input.id, 'dismissed', {
        resolved_by: ctx.user!.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: input.resolutionNotes,
      });
      await auditAction(ctx, 'exception.dismissed', 'exception', exception.id);
      return exception;
    }),
});
