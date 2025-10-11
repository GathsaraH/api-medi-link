import { BadRequestException, Global, Module, NotFoundException, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { PublicPrismaService } from "./public-prisma.service";
import { TenantPrismaService } from "./tenant-prisma.service";
import { TenantPrismaFactory } from "./tenant-prisma-factory";
import { TenantPrismaPoolService } from "./tenant-prisma-pool.service";
import { IRequestWithUser } from "@/common/interfaces/request-with-user.interface";

@Global()
@Module({
  exports: [PublicPrismaService, TenantPrismaService, TenantPrismaFactory, TenantPrismaPoolService],
  providers: [
    {
      provide: PublicPrismaService,
      scope: Scope.DEFAULT,
      useClass: PublicPrismaService,
    },
    {
      provide: TenantPrismaPoolService,
      scope: Scope.DEFAULT,
      useClass: TenantPrismaPoolService,
    },
    {
      provide: TenantPrismaService,
      scope: Scope.REQUEST,
      inject: [REQUEST, TenantPrismaPoolService],
      useFactory: async (request: IRequestWithUser, poolService: TenantPrismaPoolService) => {
        const { tenant } = request;
        // If we have tenant info, use pooled connection
        if (tenant?.datasourceUrl) {
          return poolService.getConnection(tenant.datasourceUrl);
        }

        // This check is redundant now - if we get here, tenant must be null/undefined
        // since we already checked tenant?.datasourceUrl above
        if (!tenant) throw new BadRequestException("Invalid tenant code.");

        // This code is unreachable because:
        // 1. If tenant exists with datasourceUrl, we returned in the first if
        // 2. If tenant exists without datasourceUrl, we would have returned in the first if
        // 3. If tenant doesn't exist, we throw in the previous if
        const { tenantCode, datasourceUrl } = tenant;

        if (!datasourceUrl) {
          throw new NotFoundException(`This tenant has no datasource.${tenantCode}`);
        }

        return poolService.getConnection(datasourceUrl);
      },
    },
    TenantPrismaFactory,
  ],
})
export class DatabaseModule {}
