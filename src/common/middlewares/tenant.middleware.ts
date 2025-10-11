import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PublicPrismaService } from '@/core/configs/database/public-prisma.service';
import { TenantPrismaFactory } from '@/core/configs/database/tenant-prisma-factory';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  constructor(
    private publicPrisma: PublicPrismaService,
    private readonly tenantPrismaFactory: TenantPrismaFactory,
  ) {}

  async use(request: Request, res: Response, next: NextFunction) {
    // Skip middleware for shop routes and auth routes
    if (request.path.includes('/shop') || request.path.includes('/auth/jwt')) {
      return next();
    }

    // Check if JWT authentication already processed this request
    if (request['authType'] === 'jwt') {
      return next();
    }

    // Try multiple sources for the session token
    let sessionToken: string | undefined;
    
    // 1. First try to get from cookies
    sessionToken = request.cookies['__session'];
    
    // 2. If not in cookies, try Authorization header (Bearer token)
    if (!sessionToken) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    // 3. Try custom X-Session-Token header
    if (!sessionToken) {
      sessionToken = request.headers['x-session-token'] as string;
    }
    
    // 4. Try other common header variations
    if (!sessionToken) {
      sessionToken = request.headers['x-auth-token'] as string;
    }
    
    if (!sessionToken) {
      throw new BadRequestException('No session token provided');
    }

    try {
      // const { user } = await this.clerkService.validateToken(sessionToken);
      // if (!user) {
      //   throw new UnauthorizedException('User not found');
      // }

      // // Extract role and tenantCode/tenantCodes from private metadata
      // const privateMetadata = user.privateMetadata as {
      //   role?: string;
      //   tenantCode?: string;
      // };

      // if (!privateMetadata.role) {
      //   throw new BadRequestException('User has no role assignment');
      // }

      // // Always attach the user and role to the request
      // request['user'] = user;
      // request['role'] = privateMetadata.role;

      // // Regular tenant user flow - requires single tenant code
      // if (!privateMetadata.tenantCode) {
      //   throw new BadRequestException('User has no tenant assignment');
      // }

      // // Get tenant data from public Prisma
      // const tenant = await this.publicPrisma.tenant.findUnique({
      //   where: {
      //     code: privateMetadata.tenantCode,
      //   },
      //   include: {
      //     dataSource: true,
      //   },
      // });

      // if (!tenant) {
      //   throw new BadRequestException('Tenant not found');
      // }

      // // Get organization details
      // const tenantPrisma = this.tenantPrismaFactory.createPrismaInstance(tenant.dataSource.url);
      // await tenantPrisma.$connect();
      // const shop = await tenantPrisma.shop.findFirst({
      //   where: {
      //     users: {
      //       some: {
      //         email: user.emailAddresses[0].emailAddress,
      //       },
      //     },
      //   },
      // });
      // await tenantPrisma.$disconnect();

      // if (!shop) {
      //   throw new BadRequestException('Shop not found');
      // }

      // // Attach organization and tenant info to the request
      // request['shopId'] = shop.id;
      // request['tenant'] = {
      //   tenantCode: tenant.code,
      //   datasourceUrl: tenant.dataSource.url,
      //   tenantId: tenant.id,
      // };

      next();
    } catch (error) {
      console.error('TenantMiddleware: Error processing request', error);
      this.logger.error('Authentication failed', error.message);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Authentication service error');
    }
  }
}
