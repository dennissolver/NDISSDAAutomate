import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { getDashboardStats, getRecentActivity } from '@pf/db';

export const dashboardRouter = router({
  getStats: protectedProcedure
    .query(({ ctx }) => getDashboardStats(ctx.db)),

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(({ ctx, input }) => getRecentActivity(ctx.db, input?.limit)),
});
