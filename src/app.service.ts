import { Injectable } from "@nestjs/common";
import { HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import { PublicPrismaService } from "./core/configs/database/public-prisma.service";

@Injectable()
export class AppService {
  private publicPrismaService: PublicPrismaService;

  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {
    this.publicPrismaService = new PublicPrismaService();
  }

  healthCheck() {
    return this.health.check([() => this.db.pingCheck("database", this.publicPrismaService)]);
  }
}
