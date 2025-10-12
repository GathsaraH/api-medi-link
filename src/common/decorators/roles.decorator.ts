import { SetMetadata } from "@nestjs/common";
import { UserRole as PublicUserRole } from "@prisma-public/prisma/client";
import { UserRole as TenantUserRole } from "@prisma-tenant/prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: (PublicUserRole | TenantUserRole)[]) => SetMetadata(ROLES_KEY, roles);
