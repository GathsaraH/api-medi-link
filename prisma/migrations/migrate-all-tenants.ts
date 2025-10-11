import { PrismaClient as PublicPrismaClient } from '@prisma-public/prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateAllTenantSchemas() {
  const publicPrisma = new PublicPrismaClient();

  try {
    console.log('Fetching all active tenants...');

    const tenants = await publicPrisma.tenant.findMany({
      // where: {
      //   status: 'ACTIVE',
      //   dataSourceId: { not: null },
      // },
      include: {
        dataSource: true,
      },
    });

    console.log(`Found ${tenants.length} active tenants to migrate`);

    for (const tenant of tenants) {
      if (!tenant.dataSource?.url) {
        console.warn(`Tenant ${tenant.code} has no datasource URL, skipping...`);
        continue;
      }

      try {
        console.log(
          `Starting migration for tenant: ${tenant.code} with schema: ${tenant.dataSource.url}`,
        );

        execSync(
          `npx cross-env TENANT_DATABASE_URL="${tenant.dataSource.url}" prisma generate --schema=./prisma/tenant-schema.prisma`,
          { stdio: 'inherit' },
        );
        execSync(
          `npx cross-env TENANT_DATABASE_URL="${tenant.dataSource.url}" prisma db push --schema=./prisma/tenant-schema.prisma`,
          { stdio: 'inherit' },
        );

        console.log(`Successfully migrated schema for tenant: ${tenant.code}`);
      } catch (error) {
        console.error(`Failed to migrate schema for tenant: ${tenant.code}`, error);
      }
    }

    console.log('Migration completed for all tenants');
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  } finally {
    await publicPrisma.$disconnect();
  }
}

migrateAllTenantSchemas().catch((error) => {
  console.error('Unhandled error in migration script:', error);
  process.exit(1);
});
