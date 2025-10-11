import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '@/modules/auth/jwt/jwt-token.service';
import { PublicPrismaService } from '@/core/configs/database/public-prisma.service';
import { TenantPrismaFactory } from '@/core/configs/database/tenant-prisma-factory';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';
import { UserRole } from '@prisma-tenant/prisma/client';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly publicPrisma: PublicPrismaService,
    private readonly tenantPrismaFactory: TenantPrismaFactory,
  ) {}

  async use(request: IRequestWithUser, response: Response, next: NextFunction) {
    console.log('JWT Auth Middleware triggered', request.path);
    // Skip middleware for shop routes and auth routes
    if (
      request.path.startsWith('/api/v1/shop') ||
      request.path.startsWith('/api/v1/auth') ||
      request.path.startsWith('/api/v1/equipment') ||
      request.path.startsWith('/api/v1/admin') ||
      request.path.startsWith('/api/v1/health-check')
    ) {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header missing or malformed');
    }
    const token = authHeader.split(' ')[1]; // Extract the token part

    try {
      // Verify the JWT token
      const payload = await this.jwtTokenService.verifyAccessToken(token);

      // Get tenant information
      const tenant = await this.publicPrisma.tenant.findUnique({
        where: { code: payload.tenantCode },
        include: {
          dataSource: true,
          shops: { include: { users: true } },
        },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }

      const tenantPrisma = await this.tenantPrismaFactory.getPooledPrismaInstance(
        tenant.dataSource.url,
      );

      const user = await tenantPrisma.users.findUnique({
        where: { id: payload.userId },
        include: { shop: true },
      });

      if (!user || user.isArchived) {
        throw new UnauthorizedException('User not found or archived');
      }

      // Attach user and tenant info to the request
      request.user = {
        id: user.id,
        email: user.email,
        emailAddresses: [{ emailAddress: user.email }],
      };
      request.userId = user.id;
      request.role = user.role as UserRole;
      request.publicShopId = tenant.shops[0]?.id;
      request.tenant = {
        tenantCode: tenant.code,
        datasourceUrl: tenant.dataSource.url,
        tenantId: tenant.id,
      };
      request.authType = 'jwt';

      this.logger.debug(`JWT user authenticated: ${user.email} in tenant ${tenant.code}`);

      next();
    } catch (error) {
      this.logger.warn(`JWT authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
