/** Xero integration types. */

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface XeroLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  taxType?: string;
}

export interface XeroInvoiceInput {
  contactName: string;
  contactEmail?: string;
  lineItems: XeroLineItem[];
  reference?: string;
  dueDate: string; // YYYY-MM-DD
  currencyCode?: string;
}

export interface XeroInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
}

export interface XeroInvoiceStatus {
  status: string;
  amountPaid: number;
  amountDue: number;
  total: number;
}

export interface PaymentUpdate {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  reference: string;
}
