import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicRoute } from './common/decorators/public-route.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}



  @Get("health-check")
  @PublicRoute()
  async healthCheck() {
    return this.appService.healthCheck();
  }
}
