import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient as PublicPrismaClient, Prisma } from "@prisma-public/prisma/client";

// Define the middleware type since it's not exported from Prisma
type PrismaMiddleware = (
  params: any,
  next: (params: any) => Promise<any>
) => Promise<any>;

@Injectable()
export class PublicPrismaService extends PublicPrismaClient implements OnModuleInit {
  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  declare $use: (cb: PrismaMiddleware) => void;
  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
      ],
    });
  }

  async onModuleInit() {
    this.$on("query" as never, (e: Prisma.QueryEvent) => {
      Logger.debug("Query: " + e.query);
      Logger.debug("Params: " + e.params);
      Logger.debug("Duration: " + e.duration + "ms");
    });

    // Using $use middleware with the declared type
    this.$use(async (params, next) => {
      const result = await next(params);
      return this.processDateFields(result);
    });

    await this.$connect();
  }
  
  /**
   * Use this and the any type to handle serial time object in prisma in nest
   */
  private processDateFields(data: any) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.processDateFields(item));
    }

    const processed = { ...data };

    for (const key in processed) {
      if (
        (key === 'createdAt' || key === 'updatedAt' || key === 'lastActiveAt') &&
        processed[key] !== null &&
        processed[key] !== undefined
      ) {
        if (processed[key] instanceof Date) {
          processed[key] = processed[key].toISOString();
        } else if (
          typeof processed[key] === 'object' &&
          Object.keys(processed[key]).length === 0
        ) {
          processed[key] = new Date().toISOString();
        }
      } else if (processed[key] && typeof processed[key] === 'object') {
        processed[key] = this.processDateFields(processed[key]);
      }
    }

    return processed;
  }
}