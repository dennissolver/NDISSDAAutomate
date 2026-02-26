import { type Cents, type Period } from './common.types';
import { type ReconStatus } from '../enums/recon-status';

export interface ReconciliationInput {
  propertyId: string;
  period: Period;
  statementNumber?: number;
  lineItems: ReconciliationLineItemInput[];
  sdaSubsidyAmount: Cents;
}

export interface ReconciliationLineItemInput {
  category: LineItemCategory;
  description: string;
  amount: Cents; // positive = money in, negative = money out
  source: LineItemSource;
  sourceReference?: string;
}

export enum LineItemCategory {
  RENT = 'rent',
  SDA_SUBSIDY = 'sda_subsidy',
  ENERGY_REIMBURSEMENT = 'energy_reimbursement',
  ENERGY_INVOICE = 'energy_invoice',
  MAINTENANCE = 'maintenance',
  MANAGEMENT_FEE = 'management_fee',
  OTHER = 'other',
}

export enum LineItemSource {
  RENTAL_STATEMENT = 'rental_statement',
  PRODA_CLAIM = 'proda_claim',
  ENERGY_INVOICE = 'energy_invoice',
  MANUAL = 'manual',
}

export interface ReconciliationResult {
  propertyId: string;
  period: Period;
  status: ReconStatus;
  statementNumber?: number;

  // Money In
  totalRentReceived: Cents;
  totalSdaSubsidy: Cents;
  totalMoneyIn: Cents;

  // Deductions
  agencyManagementFee: Cents;
  pfManagementFee: Cents;
  gstPayable: Cents;
  energyReimbursement: Cents;
  energyInvoiceAmount: Cents;
  maintenanceCosts: Cents;
  otherDeductions: Cents;

  // Result
  netClientPayout: Cents;

  // Detail
  lineItems: ReconciliationLineItemInput[];
}
