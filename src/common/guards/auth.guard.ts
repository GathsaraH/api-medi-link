import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY, PublicPaths } from "../decorators/public-route.decorator";
import { SerialLoggerService } from "@/core/logging/seri-logger.service";
import { UserRole } from "@prisma-public/prisma/client";
import { IRequestWithUser } from "../interfaces/request-with-user.interface";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: SerialLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), 
      context.getClass()
    ]);
    
    const request = context.switchToHttp().getRequest<IRequestWithUser>();
    
    if (isPublic || PublicPaths.some(path => request.path.startsWith(path))) {
      return true;
    }

    // Check that the user and role exist (basic auth check)
    if (!request.user || !request.role) {
      this.logger.error("Missing basic authentication details in request");
      throw new UnauthorizedException("Authentication credentials not found");
    }

    // For system users (public screen), no tenant required
    if (request.authType === 'jwt' && !request.tenant) {
      // System user authentication is sufficient
      return true;
    }

    // For tenant users, check tenant-specific details
    if (request.authType === 'jwt' && request.tenant) {
      // Tenant user authentication is sufficient
      return true;
    }

    // Legacy clerk authentication paths
    if (request.authType === 'clerk') {
      // Super admin check - doesn't need tenant or organization
      if ((request.role === UserRole.ADMIN && request['isSuperAdmin'] === true) || 
          Array.isArray(request['accessibleTenants'])) {
        return true;
      }

      // For regular users, check tenant-specific details
      if (!request.tenant) {
        this.logger.error("Missing tenant details in request for non-super admin user");
        throw new UnauthorizedException("Tenant authentication failed");
      }
    }

    return true;
  }
}
