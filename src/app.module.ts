import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './core/configs/config.module';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
        AppConfigModule,
    TerminusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
