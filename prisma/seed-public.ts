import { PrismaClient, UserRole } from '@prisma-public/prisma/client';
import * as dotenv from 'dotenv';
import { v4 as uuidgen } from 'uuid';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenant database...');
  console.log('Seeding public database...');

  const baseDatabaseUrl = process.env.TENANT_DATABASE_URL!;
  const devSchemaName = 'dev';
  const devTenantCode = 'dev';
  const devTenantName = 'Dev Tenant';

  await prisma.$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS "${devSchemaName}"`,
  );

  // Fixed: Use constant UUIDs to avoid creating new records on every run
  const datasourceId = '12345678-1234-1234-1234-123456789abc';

  const datasource = await prisma.datasource.upsert({
    where: { id: datasourceId },
    update: { url: `${baseDatabaseUrl}?schema=${devSchemaName}` },
    create: {
      id: datasourceId,
      url: `${baseDatabaseUrl}?schema=${devSchemaName}`,
    },
  });
  console.log(`✅ Datasource set up: ${datasource.url}`);

  const tenant = await prisma.tenant.upsert({
    where: { code: devTenantCode },
    update: {
      name: devTenantName,
      status: 'ACTIVE',
      updatedAt: new Date(),
      dataSource: {
        connect: {
          id: datasource.id,
        },
      },
    },
    create: {
      id: `${uuidgen()}`,
      name: devTenantName,
      code: devTenantCode,
      status: 'ACTIVE',
      dataSource: {
        connect: {
          id: datasource.id,
        },
      },
    },
  });
  console.log(`✅ Tenant set up: ${tenant.name} (${tenant.code})`);

  // 1️⃣ Medical Center
  const medicalCenterId = `${uuidgen()}`;
  const medicalCenter = await prisma.medicalCenter.upsert({
    where: { id: medicalCenterId },
    update: {
      name: 'Dev Medical Center',
      address: '123 Main Street, Colombo, Sri Lanka',
      updatedAt: new Date(),
    },
    create: {
      id: medicalCenterId,
      name: 'Dev Medical Center',
      address: '123 Main Street, Colombo, Sri Lanka',
    },
  });

  console.log(`✅ Medical Center created: ${medicalCenter.name}`);

  // 2️⃣ Users (Doctors, Pharmacist, etc.)
  const usersData = [
    {
      id: `${uuidgen()}`,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '0777000001',
      email: 'admin@devmed.com',
      role: UserRole.ADMIN,
      password: 'admin123',
      medicalCenter: {
        connect: { id: medicalCenterId },
      },
    },
    {
      id: `${uuidgen()}`,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '0777000002',
      email: 'dr.john@devmed.com',
      role: UserRole.DOCTOR,
      password: 'doctor123',
      medicalCenter: {
        connect: { id: medicalCenterId },
      },
    },
    {
      id: `${uuidgen()}`,
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '0777000003',
      email: 'jane@devmed.com',
      role: UserRole.RECEPTIONIST,
      password: 'reception123',
      medicalCenter: {
        connect: { id: medicalCenterId },
      },
    },
    {
      id: `${uuidgen()}`,
      firstName: 'Peter',
      lastName: 'Pharma',
      phoneNumber: '0777000004',
      email: 'peter@devmed.com',
      role: UserRole.PHARMACIST,
      password: 'pharma123',
      medicalCenter: {
        connect: { id: medicalCenterId },
      },
    },
  ];

  for (const u of usersData) {
    await prisma.systemUsers.upsert({
      where: { id: u.id },
      update: {
        ...u,
      },
      create: {
        ...u,
      },
    });
  }

  console.log(`✅ Users seeded: ${usersData.length}`);

  console.log('🎉 Tenant database seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
