export interface StatementParseResult {
  agencyName: string;
  statementNumber?: number;
  periodMonth: number;
  periodYear: number;
  rentReceived: number;        // dollars
  managementFee: number;       // dollars
  gstOnFee: number;            // dollars
  energyReimbursement: number; // dollars
  maintenanceCosts: number;    // dollars
  otherItems: { description: string; amount: number }[];
  totalMoneyIn: number;
  rawText: string;
  confidence: number;          // 0-1 how confident the parse was
}

export interface AgencyAdapter {
  agencyName: string;
  canParse(text: string): boolean;
  parse(text: string): StatementParseResult;
}
