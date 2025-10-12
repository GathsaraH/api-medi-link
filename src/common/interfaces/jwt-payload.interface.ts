import { UserRole } from "@prisma-public/prisma/client";

export interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: UserRole;
  tenantCode?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
