import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { auditAction } from '../middleware/audit';
import {
  getReconciliations,
  getReconciliationById,
  createReconciliation,
  updateReconciliationStatus,
  getLineItems,
  upsertLineItems,
  getPropertyById,
  getRentalAgencyById,
} from '@pf/db';
import { generateReconciliation } from '@pf/core';
import { toDollars } from '@pf/shared';
import { parseStatement, getAdapterForAgency } from '@pf/ingestion';

export const reconciliationRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      status: z.string().optional(),
      propertyId: z.string().uuid().optional(),
    }).optional())
    .query(({ ctx, input }) => getReconciliations(ctx.db, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getReconciliationById(ctx.db, input.id)),

  getLineItems: protectedProcedure
    .input(z.object({ reconciliationId: z.string().uuid() }))
    .query(({ ctx, input }) => getLineItems(ctx.db, input.reconciliationId)),

  generate: protectedProcedure
    .input(z.object({
      propertyId: z.string().uuid(),
      periodMonth: z.number().int().min(1).max(12),
      periodYear: z.number().int(),
      statementNumber: z.number().int().optional(),
      lineItems: z.array(z.object({
        category: z.string(),
        description: z.string(),
        amount: z.number(),
        source: z.string(),
        sourceReference: z.string().optional(),
      })),
      sdaSubsidyAmount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const property = await getPropertyById(ctx.db, input.propertyId);
      const agencyFeeRate = property.rentalAgencyId
        ? (await getRentalAgencyById(ctx.db, property.rentalAgencyId)).feeRate
        : 0.044;

      const result = generateReconciliation(
        {
          propertyId: input.propertyId,
          period: { month: input.periodMonth, year: input.periodYear },
          statementNumber: input.statementNumber,
          lineItems: input.lineItems.map(li => ({
            ...li,
            category: li.category as never,
            source: li.source as never,
          })),
          sdaSubsidyAmount: input.sdaSubsidyAmount,
        },
        { agencyFeeRate },
      );

      const recon = await createReconciliation(ctx.db, {
        property_id: input.propertyId,
        period_month: input.periodMonth,
        period_year: input.periodYear,
        statement_number: input.statementNumber,
        status: result.status,
        total_rent_received: toDollars(result.totalRentReceived),
        total_sda_subsidy: toDollars(result.totalSdaSubsidy),
        total_money_in: toDollars(result.totalMoneyIn),
        agency_management_fee: toDollars(result.agencyManagementFee),
        pf_management_fee: toDollars(result.pfManagementFee),
        gst_payable: toDollars(result.gstPayable),
        energy_reimbursement: toDollars(result.energyReimbursement),
        energy_invoice_amount: toDollars(result.energyInvoiceAmount),
        maintenance_costs: toDollars(result.maintenanceCosts),
        other_deductions: toDollars(result.otherDeductions),
        net_client_payout: toDollars(result.netClientPayout),
      });

      await upsertLineItems(
        ctx.db,
        recon.id,
        result.lineItems.map(li => ({
          category: li.category,
          description: li.description,
          amount: toDollars(li.amount),
          source: li.source,
          source_reference: li.sourceReference,
        })),
      );

      await auditAction(ctx, 'reconciliation.generated', 'reconciliation', recon.id);
      return recon;
    }),

  parseStatement: protectedProcedure
    .input(z.object({
      text: z.string(),
      propertyId: z.string().uuid(),
      agencyHint: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve adapter — try agency hint first, then auto-detect from text
      const adapter = getAdapterForAgency(input.agencyHint, input.text);
      const result = parseStatement(input.text, adapter);

      await auditAction(ctx, 'statement.parsed', 'property', input.propertyId);

      return {
        agencyName: result.agencyName,
        statementNumber: result.statementNumber,
        periodMonth: result.periodMonth,
        periodYear: result.periodYear,
        rentReceived: result.rentReceived,
        managementFee: result.managementFee,
        gstOnFee: result.gstOnFee,
        energyReimbursement: result.energyReimbursement,
        maintenanceCosts: result.maintenanceCosts,
        otherItems: result.otherItems,
        totalMoneyIn: result.totalMoneyIn,
        confidence: result.confidence,
      };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const extra: Record<string, unknown> = {};
      if (input.notes) extra.notes = input.notes;
      if (input.status === 'approved') {
        extra.approved_by = ctx.user!.id;
        extra.approved_at = new Date().toISOString();
      }
      if (input.status === 'published') {
        extra.published_at = new Date().toISOString();
      }
      const recon = await updateReconciliationStatus(ctx.db, input.id, input.status, extra);
      await auditAction(ctx, `reconciliation.${input.status}`, 'reconciliation', recon.id);
      return recon;
    }),
});
