import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import { UserRole } from '@pf/shared';

export const authMiddleware = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminMiddleware = middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function roleMiddleware(roles: UserRole[]) {
  return middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires role: ${roles.join(' or ')}` });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}
