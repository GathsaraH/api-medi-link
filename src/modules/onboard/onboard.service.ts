import { PublicPrismaService } from '@/core/configs/database/public-prisma.service';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import e from 'express';

@Injectable()
export class OnboardService {
    private readonly logger = new Logger(OnboardService.name);
    constructor(
        private readonly publicPrismaService: PublicPrismaService
    ){}
  async onboardMedicalCenter() {
    try{

    }catch(error){
        console.error('Error during onboarding:', error);
        this.logger.error('Error during onboarding', error);
        throw  new HttpException(error.message ?? 'Something went wrong during onboarding', error.status ?? 500);
    }
  }
}
