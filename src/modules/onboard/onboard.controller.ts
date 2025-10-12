import { Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { OnboardService } from './onboard.service';
import { ApiEndpoint } from '@/common/decorators/swagger.decorator';

@Controller('onboard')
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @ApiEndpoint('Onboard Medical Center', {})
  @HttpCode(HttpStatus.CREATED)
  async onboardMedicalCenter() {
    return this.onboardService.onboardMedicalCenter();
  }
}
