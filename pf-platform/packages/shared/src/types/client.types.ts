export enum ClientEntityType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  TRUST = 'trust',
}

export interface Client {
  id: string;
  authUserId?: string;
  fullName: string;
  email: string;
  phone?: string;
  entityType: ClientEntityType;
  entityName?: string;
  abn?: string;
  bankBsb?: string;
  bankAccountNumber?: string;
  notificationEmail: boolean;
  notificationVoice: boolean;
  createdAt: Date;
  updatedAt: Date;
}
