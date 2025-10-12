import { Body, Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { OnboardService } from './onboard.service';
import { ApiEndpoint } from '@/common/decorators/swagger.decorator';
import { CreateOnboardMedicalCenterDto } from './dto/update-onboard-medial-center.dto';

@Controller('onboard')
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @ApiEndpoint('Onboard Medical Center', {
    body: {
      description: 'Details for onboarding a new medical center',
      type: CreateOnboardMedicalCenterDto,
    },
    consumes: 'application/json',
    okResponse: 'Onboarding successful',
    badRequestMessage: 'Invalid input data',
  })
  @HttpCode(HttpStatus.CREATED)
  async onboardMedicalCenter(@Body() dto: CreateOnboardMedicalCenterDto) {
    await this.onboardService.onboardMedicalCenter(dto);
  }
}
