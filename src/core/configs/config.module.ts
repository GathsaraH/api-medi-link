import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './database/database.config';
import { ScheduleModule } from '@nestjs/schedule';
import jwtConfig from './jwt/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
})
export class AppConfigModule {}
