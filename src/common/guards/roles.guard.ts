// import { UserRole } from "@prisma-tenant/prisma/client";
// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { ROLES_KEY } from "@/common/decorators/roles.decorator";
// import { SerialLoggerService } from "@/core/logging/seri-logger.service";
// import { IRequestWithProps } from "../interfaces/request-with-user.interface";

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private logger: SerialLoggerService,
//   ) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

//     if (!requiredRoles) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest<IRequestWithProps>();

//     if (!request.role) {
//       this.logger.error("Role not found in request");
//       throw new ForbiddenException("Role verification failed");
//     }

//     // Special case: SUPER_ADMIN can access anything
//     if (request.role === UserRole.SUPER_ADMIN && request.isSuperAdmin === true) {
//       return true;
//     }

//     const hasRole = requiredRoles.some(role => role === request.role);

//     if (!hasRole) {
//       this.logger.warn(`Access denied: User with role ${request.role} tried to access a resource that requires one of ${requiredRoles.join(", ")}`);
//       throw new ForbiddenException("Insufficient permissions");
//     }

//     return true;
//   }
// }
