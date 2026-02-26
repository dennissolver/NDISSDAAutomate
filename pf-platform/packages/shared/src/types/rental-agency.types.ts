export interface RentalAgency {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  feeRate: number;
  statementFormat: string;
  senderEmailPattern?: string;
  createdAt: Date;
}
