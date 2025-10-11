import { UserRole } from "@prisma-tenant/prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantCode?: string;
}
