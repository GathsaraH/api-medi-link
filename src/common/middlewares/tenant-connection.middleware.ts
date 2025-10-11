import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantPrismaFactory } from '@/core/configs/database/tenant-prisma-factory';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';

@Injectable()
export class TenantConnectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantConnectionMiddleware.name);

  constructor(
    private readonly tenantPrismaFactory: TenantPrismaFactory,
  ) {}

  use(request: IRequestWithUser, response: Response, next: NextFunction) {
    // Add cleanup function to request context
    request.cleanupTenantConnection = () => {
      if (request.tenant?.datasourceUrl) {
        this.tenantPrismaFactory.releaseConnection(request.tenant.datasourceUrl);
        this.logger.debug(`Released connection for tenant: ${request.tenant.tenantCode}`);
      }
    };

    // Cleanup connection when response finishes
    response.on('finish', () => {
      request.cleanupTenantConnection?.();
    });

    // Cleanup connection on response close (in case of errors)
    response.on('close', () => {
      request.cleanupTenantConnection?.();
    });

    next();
  }
}
