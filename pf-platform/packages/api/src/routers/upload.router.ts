import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import { createParticipant, createProperty, createClient } from '@pf/db';

const participantSchema = z.object({
  ndis_number: z.string().min(9),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan_management_type: z.string(),
  plan_start_date: z.string().optional(),
  plan_end_date: z.string().optional(),
  sda_category_funded: z.string().optional(),
});

const propertySchema = z.object({
  address_line_1: z.string().min(1),
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
});

const clientSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  entity_type: z.string().default('individual'),
  entity_name: z.string().optional(),
  abn: z.string().optional(),
  bank_bsb: z.string().optional(),
  bank_account_number: z.string().optional(),
});

export const uploadRouter = router({
  bulkParticipants: protectedProcedure
    .input(z.array(participantSchema).max(500))
    .mutation(async ({ ctx, input }) => {
      let created = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < input.length; i++) {
        try {
          const participant = await createParticipant(ctx.db, {
            ...input[i],
            plan_status: 'active',
          });
          await auditAction(ctx, 'participant.created', 'participant', participant.id);
          created++;
        } catch (err) {
          errors.push({
            row: i + 1,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return { created, errors };
    }),

  bulkProperties: protectedProcedure
    .input(z.array(propertySchema).max(500))
    .mutation(async ({ ctx, input }) => {
      let created = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < input.length; i++) {
        try {
          const property = await createProperty(ctx.db, input[i]);
          await auditAction(ctx, 'property.created', 'property', property.id);
          created++;
        } catch (err) {
          errors.push({
            row: i + 1,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return { created, errors };
    }),

  bulkClients: protectedProcedure
    .input(z.array(clientSchema).max(500))
    .mutation(async ({ ctx, input }) => {
      let created = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < input.length; i++) {
        try {
          const client = await createClient(ctx.db, input[i]);
          await auditAction(ctx, 'client.created', 'client', client.id);
          created++;
        } catch (err) {
          errors.push({
            row: i + 1,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return { created, errors };
    }),
});
