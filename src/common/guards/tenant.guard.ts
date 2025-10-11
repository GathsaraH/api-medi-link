// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
// import { SerialLoggerService } from "@/core/logging/seri-logger.service";
// import { IRequestWithProps } from "../interfaces/request-with-user.interface";
// import { Reflector } from "@nestjs/core";
// import { IS_PUBLIC_KEY, PublicPaths } from "../decorators/public-route.decorator";
// import { UserRole } from "@prisma-public/prisma/client";

// @Injectable()
// export class TenantGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private logger: SerialLoggerService,
//   ) {}

//   canActivate(context: ExecutionContext): boolean {
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
//     const request = context.switchToHttp().getRequest<IRequestWithProps | any>();
//     if (isPublic || PublicPaths.some(path => request.path.startsWith(path))) {
//       return true;
//     }

//     // Super admin bypass
//     if ((request.role === UserRole.SUPER_ADMIN && request.isSuperAdmin === true) || Array.isArray(request.accessibleTenants)) {
//       return true;
//     }

//     // For regular users, verify tenant details
//     if (!request.tenant || !request.tenant.tenantCode) {
//       this.logger.error("Tenant not found in request for non-super admin user");
//       throw new ForbiddenException("Tenant verification failed");
//     }

//     return true;
//   }
// }
