import { ConfigService } from '@nestjs/config';
import { PublicPrismaService } from '@/core/configs/database/public-prisma.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOnboardMedicalCenterDto } from './dto/update-onboard-medial-center.dto';
import { generateSchemaName, generateTenantCode } from '@/utils/tenant';
import { exec } from 'child_process';
import {
  Prisma,
  TenantStatusEnum,
  UserRole,
} from '@prisma-public/prisma/client';
import { TenantPrismaFactory } from '@/core/configs/database/tenant-prisma-factory';
import { AuthService } from '../auth/auth.service';

interface DatabaseConfig {
  schemaName: string;
  tenantCode: string;
  databaseUrl: string;
}

@Injectable()
export class OnboardService {
  private readonly logger = new Logger(OnboardService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly publicPrismaService: PublicPrismaService,
    private readonly tenantPrismaFactory: TenantPrismaFactory,
    private readonly authService: AuthService,
  ) {}
  async onboardMedicalCenter(dto: CreateOnboardMedicalCenterDto) {
    try {
      this.logger.log('Starting onboarding process', {
        dto: { ...dto, password: '****' },
      });
      await this.validateOnboardData(dto);
      const dbConfig = await this.initializeDatabaseConfig(
        dto.medicalCenterName,
      );
      const tenant = await this.createAndSetupTenant(dto, dbConfig);
      await this.createPublicSchemaResources(
        this.publicPrismaService,
        tenant.medicalCenterId,
        tenant.userId,
        dto,
      );
    } catch (error) {
      console.error('Error during onboarding:', error);
      this.logger.error('Error during onboarding', error);
      throw new HttpException(
        error.message ?? 'Something went wrong during onboarding',
        error.status ?? 500,
      );
    }
  }

  private async createAndSetupTenant(
    dto: CreateOnboardMedicalCenterDto,
    dbConfig: DatabaseConfig,
  ): Promise<{ medicalCenterId: string; tenantId: string; userId: string }> {
    const { tenantCode, databaseUrl } = dbConfig;

    const transaction = await this.publicPrismaService.$transaction(
      async (prisma) => {
        const createTenantPromise = this.createTenantResources(
          prisma,
          dto,
          dbConfig,
        );
        const migrationPromise = this.runTenantMigration(
          databaseUrl,
          tenantCode,
        );

        const tenantResources = await createTenantPromise;

        await migrationPromise;

        const tenantPrisma =
          this.tenantPrismaFactory.createPrismaInstance(databaseUrl);
        await tenantPrisma.$connect();

        try {
          const setupTenantSchemaDetails = await tenantPrisma.$transaction(
            async (prisma) => {
              const medicalCenter = await prisma.medicalCenter.create({
                data: {
                  name: dto.medicalCenterName,
                  address: dto.address,
                },
              });
              const user = await prisma.user.create({
                data: {
                  /**
                   * We set this role as Doctor since this endpoint only used to
                   * - onboard and that is a doctor
                   */
                  role: UserRole.DOCTOR,
                  email: dto.email,
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  // Set this flag as true since this user is the owner of the medical center
                  isMedicalCenterOwner: true,
                },
              });

              return {
                medicalCenterId: medicalCenter.id,
                userId: user.id,
              };
            },
          );

          return {
            medicalCenterId: setupTenantSchemaDetails.medicalCenterId,
            tenantId: tenantResources.id,
            userId: setupTenantSchemaDetails.userId,
          };
        } finally {
          await tenantPrisma.$disconnect();
        }
      },
      {
        timeout: 120000,
        maxWait: 5000,
      },
    );

    return {
      medicalCenterId: transaction.medicalCenterId,
      tenantId: transaction.tenantId,
      userId: transaction.userId,
    };
  }

  private async createPublicSchemaResources(
    prisma: Prisma.TransactionClient,
    medicalCenterId: string,
    tenantUserId: string,
    dto: CreateOnboardMedicalCenterDto,
  ) {
    try {
      // Create Public Schema Medical Center Resource
      const medicalCenter = await prisma.medicalCenter.create({
        data: {
          name: dto.medicalCenterName,
          address: dto.address,
          tenantRecordId: medicalCenterId,
        },
      });
      this.logger.log(
        `Created public medical center record with ID: ${medicalCenter.id}`,
      );
      // Create Public Schema System User Resource
      const systemUser = await prisma.systemUsers.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          slmcNumber: dto.slmcNumber,
          role: UserRole.DOCTOR,
          medicalCenter: { connect: { id: medicalCenter.id } },
          tenantRecordId: tenantUserId,
          isMedicalCenterOwner: true,
        },
      });
      this.logger.log(
        `Created public system user record with ID: ${systemUser.id}`,
      );
      // Set password and other details
      await this.authService.register({
        email: dto.email,
        password: dto.password,
        phoneNumber: dto.phoneNumber,
        medicalCenterId: medicalCenter.id,
        role: UserRole.DOCTOR,
      });
      this.logger.log(`Set password for system user ID: ${systemUser.id}`);
      return { medicalCenter, systemUser };
    } catch (error) {
      this.logger.error('Failed to create public schema resources', error);
      throw new HttpException(
        'Failed to create public schema resources',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createTenantResources(
    prisma: Prisma.TransactionClient,
    dto: CreateOnboardMedicalCenterDto,
    dbConfig: DatabaseConfig,
  ) {
    const datasource = await prisma.datasource.create({
      data: { url: dbConfig.databaseUrl },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: dto.medicalCenterName,
        code: dbConfig.tenantCode,
        status: TenantStatusEnum.ACTIVE,
        dataSource: { connect: { id: datasource.id } },
      },
    });

    return tenant;
  }

  private async validateOnboardData(dto: CreateOnboardMedicalCenterDto) {
    try {
      const existingCenter =
        await this.publicPrismaService.systemUsers.findFirst({
          where: {
            OR: [
              { email: dto.email },
              { phoneNumber: dto.phoneNumber },
              { slmcNumber: dto.slmcNumber },
            ],
          },
          include: { medicalCenter: true },
        });

      if (existingCenter) {
        throw new HttpException(
          'Email, phone number, or SLMC number already in use by another medical center',
          400,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  private async runTenantMigration(
    databaseUrl: string,
    tenantName: string,
  ): Promise<void> {
    this.logger.log(`Starting migrations for tenant: ${tenantName}`);

    try {
      const opts = {
        stdio: 'pipe',
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      };

      await new Promise<void>((resolve, reject) => {
        exec(
          `npx cross-env TENANT_DATABASE_URL="${databaseUrl}" pnpm prisma db push --schema=./prisma/tenant-schema.prisma`,
          opts,
          (error, stdout, stderr) => {
            if (error) {
              this.logger.error(`db push failed: ${stderr}`);
              reject(error);
            } else {
              this.logger.log(`db push output: ${stdout}`);
              resolve();
            }
          },
        );
      });

      this.logger.log(`Completed migrations for tenant: ${tenantName}`);
    } catch (error) {
      this.logger.error(`Migration failed for tenant: ${tenantName}`, error);
      throw new HttpException(
        'Failed to run database migrations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async initializeDatabaseConfig(
    companyName: string,
  ): Promise<DatabaseConfig> {
    const tenantCode = generateTenantCode(companyName);
    const schemaName = generateSchemaName(tenantCode);
    const databaseUrl = this.createDatabaseUrl(schemaName);

    // Create database schema
    await this.createDatabaseSchema(schemaName);

    return { schemaName, tenantCode, databaseUrl };
  }
  private createDatabaseUrl(schemaName: string): string {
    const baseUrl = this.configService.get<string>(
      'database.tenantDatabaseUrl',
      { infer: true },
    );
    if (!baseUrl) {
      throw new HttpException(
        'Database configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return `${baseUrl}?schema=${schemaName}`;
  }

  private async createDatabaseSchema(schemaName: string): Promise<void> {
    try {
      await this.publicPrismaService.$executeRawUnsafe(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      );
    } catch (error) {
      this.logger.error('Failed to create database schema', error);
      throw new HttpException(
        'Failed to create database schema',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
