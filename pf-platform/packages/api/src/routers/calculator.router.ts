import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { calculateSdaPricing, calculateMrrc } from '@pf/core';

export const calculatorRouter = router({
  calculateSda: protectedProcedure
    .input(z.object({
      buildingType: z.string(),
      designCategory: z.string(),
      hasOoa: z.boolean().default(false),
      hasBreakoutRoom: z.boolean().default(false),
      hasFireSprinklers: z.boolean().default(false),
      locationFactor: z.number().positive().default(1.0),
    }))
    .query(({ input }) => calculateSdaPricing(input as Parameters<typeof calculateSdaPricing>[0])),

  calculateMrrc: protectedProcedure
    .input(z.object({
      dspBasicFortnight: z.number().nonnegative(),
      pensionSuppFortnight: z.number().nonnegative(),
      craMaxFortnight: z.number().nonnegative(),
    }))
    .query(({ input }) => calculateMrrc(input)),
});
