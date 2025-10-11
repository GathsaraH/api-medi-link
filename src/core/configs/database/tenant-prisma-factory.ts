import { Injectable, HttpException } from "@nestjs/common";
import { TenantPrismaService } from "./tenant-prisma.service";
import { PublicPrismaService } from "@/core/configs/database/public-prisma.service";
import { TenantPrismaPoolService } from "./tenant-prisma-pool.service";
import { TenantStatusEnum } from "@prisma-public/prisma/client";

@Injectable()
export class TenantPrismaFactory {
  constructor(
    private readonly publicPrisma: PublicPrismaService,
    private readonly prismaPool: TenantPrismaPoolService,
  ) {}

  async getPooledPrismaInstance(datasourceUrl: string): Promise<TenantPrismaService> {
    return this.prismaPool.getConnection(datasourceUrl);
  }

  releaseConnection(datasourceUrl: string): void {
    this.prismaPool.releaseConnection(datasourceUrl);
  }

  createPrismaInstance(datasourceUrl: string): TenantPrismaService {
    return new TenantPrismaService(datasourceUrl);
  }

  async getTenantPrisma(tenantCode: string) {
    const tenant = await this.publicPrisma.tenant.findUnique({
      where: {
        code: tenantCode,
        status: TenantStatusEnum.ACTIVE,
      },
      include: {
        dataSource: true,
      },
    });

    if (!tenant) {
      throw new HttpException(`Tenant with code ${tenantCode} not found`, 404);
    }
    if (!tenant.dataSource?.url) {
      throw new HttpException(`Tenant ${tenantCode} has no datasource URL`, 500);
    }
    
    const tenantPrisma = await this.getPooledPrismaInstance(tenant.dataSource.url);
    return { tenant, tenantPrisma };
  }
}
