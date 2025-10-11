
import { Request } from 'express';
import { UserRole } from '@prisma-tenant/prisma/client';

export interface IUser {
  id: string;
  email: string;
  emailAddresses: Array<{ emailAddress: string }>;
}

export interface ITenantInfo {
  tenantCode: string;
  datasourceUrl: string;
  tenantId: string;
}

export interface IRequestWithUser extends Request {
  user?: IUser;
  userId?: string;
  role?: UserRole;
  publicShopId?: string;
  tenant?: ITenantInfo;
  authType?: 'jwt' | 'clerk';
  cleanupTenantConnection?: () => void;
}
