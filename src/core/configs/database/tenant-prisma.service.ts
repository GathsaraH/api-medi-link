import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient as TenantPrismaClient, Prisma } from "@prisma-tenant/prisma/client";

@Injectable()
export class TenantPrismaService extends TenantPrismaClient implements OnModuleInit {
  constructor(datasourceUrl: string) {
    super({
      datasourceUrl,
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "event",
          level: "error",
        },
        {
          emit: "event",
          level: "info",
        },
        {
          emit: "event",
          level: "warn",
        },
      ],
    });
  }

  withQueryExtensions(tenantCode: string) {
    return this.$extends({
      query: {
        $allOperations({ query }) {
          return query({ where: { tenantId: tenantCode } });
        },
      },
    });
  }

  async onModuleInit() {
    this.$on("query" as never, (e: Prisma.QueryEvent) => {
      Logger.debug("Query: " + e.query);
      Logger.debug("Params: " + e.params);
      Logger.debug("Duration: " + e.duration + "ms");
    });

    // Store reference to processDateFields to maintain context
    const processDateFields = this.processDateFields.bind(this);

    // Replace $use with $extends for date field processing
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const result = await query(args);
            return processDateFields(result);
          },
        },
      },
    });

    // Copy extended client methods back to this instance
    Object.assign(this, extended);

    await this.$connect();
  }

  /**
   * Use this and the any type to handle serial time object in prisma in nest
   */
  private processDateFields(data: any) {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.processDateFields(item));
    }

    const processed = { ...data };
    for (const key in processed) {
      if ((key === "createdAt" || key === "updatedAt" || key === "lastActiveAt") && processed[key] !== null && processed[key] !== undefined) {
        if (processed[key] instanceof Date) {
          processed[key] = processed[key].toISOString();
        } else if (typeof processed[key] === "object" && Object.keys(processed[key]).length === 0) {
          processed[key] = new Date().toISOString();
        }
      } else if (processed[key] && typeof processed[key] === "object") {
        processed[key] = this.processDateFields(processed[key]);
      }
    }
    return processed;
  }
}