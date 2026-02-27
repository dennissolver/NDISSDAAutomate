import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import {
  getProperties,
  getPropertyById,
  getPropertyWithOccupants,
  createProperty,
  updateProperty,
} from '@pf/db';
import { calculatePropertySdaAmount } from '@pf/core';

export const propertyRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }).optional())
    .query(({ ctx, input }) => getProperties(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getPropertyById(ctx.db, input.id)),

  getWithOccupants: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getPropertyWithOccupants(ctx.db, input.id)),

  create: protectedProcedure
    .input(z.object({
      address_line_1: z.string().min(1),
      address_line_2: z.string().optional(),
      suburb: z.string().min(1),
      state: z.string().length(3),
      postcode: z.string().length(4),
      property_label: z.string().optional(),
      building_type: z.string(),
      design_category: z.string(),
      has_ooa: z.boolean().default(false),
      has_breakout_room: z.boolean().default(false),
      has_fire_sprinklers: z.boolean().default(false),
      location_factor: z.number().positive(),
      max_residents: z.number().int().positive(),
      owner_id: z.string().uuid(),
      rental_agency_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const property = await createProperty(ctx.db, input);
      await auditAction(ctx, 'property.created', 'property', property.id);
      return property;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const property = await updateProperty(ctx.db, input.id, input.data);
      await auditAction(ctx, 'property.updated', 'property', property.id, input.data);
      return property;
    }),

  calculateSda: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const property = await getPropertyById(ctx.db, input.id);
      return calculatePropertySdaAmount(property);
    }),
});
