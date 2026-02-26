import type { UserRole } from '../enums/user-role';

export interface User {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
