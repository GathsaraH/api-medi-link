import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt/jwt-token.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { DatabaseModule } from '@/core/configs/database/database.module';
import { SerialLoggerModule } from '@/core/logging/serial-logger.module';
import { JwtConfig } from '@/core/configs/jwt/jwt-config.type';

@Module({
  imports: [
    DatabaseModule,
    SerialLoggerModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get<JwtConfig>('jwt');
        return {
          secret: jwtConfig.jwtSecret,
          signOptions: {
            expiresIn: jwtConfig.jwtExpiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    JwtAuthGuard,
    AuthGuard,
    RolesGuard,
    TenantGuard,
  ],
  exports: [
    AuthService,
    JwtTokenService,
    JwtAuthGuard,
    AuthGuard,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}