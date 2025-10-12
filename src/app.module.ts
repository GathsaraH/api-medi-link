import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './core/configs/config.module';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthMiddleware } from './common/middlewares/jwt-auth.middleware';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { TenantConnectionMiddleware } from './common/middlewares/tenant-connection.middleware';
import { UuidMiddleware } from './common/middlewares/uuid.middleware';
import { OnboardModule } from './modules/onboard/onboard.module';

@Module({
  imports: [AppConfigModule, TerminusModule, AuthModule, OnboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     // Apply middleware in the correct order
//     consumer
//       .apply(UuidMiddleware) // First, add request IDs
//       .forRoutes('*');

//     consumer
//       .apply(JwtAuthMiddleware) // JWT authentication
//       .exclude('/health-check', '/docs', '/docs/(.*)') // Exclude health check and docs
//       .forRoutes('*');

//     consumer
//       .apply(TenantMiddleware) // Legacy tenant middleware (for clerk auth)
//       .exclude('/health-check', '/docs', '/docs/(.*)', '/api/v1/auth/(.*)') // Exclude auth routes
//       .forRoutes('*');

//     consumer
//       .apply(TenantConnectionMiddleware) // Cleanup middleware
//       .forRoutes('*');
//   }
// }
