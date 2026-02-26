import { router, publicProcedure } from '../trpc';

export const authRouter = router({
  me: publicProcedure
    .query(({ ctx }) => ctx.user),
});
