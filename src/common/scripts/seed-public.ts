import { PrismaClient, SubscriptionTypeEnum, TenantStatusEnum, ShopStatusEnum, PaymentPlanEnum, EquipmentStatusEnum } from '@prisma-public/prisma/client';
import * as dotenv from 'dotenv';
import { v4 as uuidgen } from 'uuid';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding public database...');

  const baseDatabaseUrl = process.env.TENANT_DATABASE_URL!;
  const devSchemaName = 'dev';
  const devTenantCode = 'dev';
  const devTenantName = 'Dev Tenant';

  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${devSchemaName}"`);

  // Fixed: Use constant UUIDs to avoid creating new records on every run
  const datasourceId = '12345678-1234-1234-1234-123456789abc';
  
  // First check if datasource exists to handle potential conflicts
  const existingDatasource = await prisma.datasource.findUnique({
    where: { id: datasourceId }
  });
  
  const datasource = await prisma.datasource.upsert({
    where: { id: datasourceId },
    update: { url: `${baseDatabaseUrl}?schema=${devSchemaName}` },
    create: {
      id: datasourceId,
      url: `${baseDatabaseUrl}?schema=${devSchemaName}`,
      isActive: true,
    },
  });

  const subscriptionsData = [
    { 
      id: '26d82efb-5d5c-4795-b4c7-225c58e0b6f8', 
      SubscriptionTypeEnum: SubscriptionTypeEnum.STARTER, 
      price: 80000,
      isActive: true 
    },
    { 
      id: '36d82efb-5d5c-4795-b4c7-225c58e0b6f8', 
      SubscriptionTypeEnum: SubscriptionTypeEnum.PROFESSIONAL, 
      price: 100000,
      isActive: true 
    },
    { 
      id: '46d82efb-5d5c-4795-b4c7-225c58e0b6f8', 
      SubscriptionTypeEnum: SubscriptionTypeEnum.ENTERPRISE, 
      price: 120000,
      isActive: true 
    },
  ];

  const subscriptions = {};
  for (const s of subscriptionsData) {
    const sub = await prisma.subscription.upsert({
      where: { id: s.id },
      update: { price: s.price, isActive: s.isActive },
      create: s,
    });
    subscriptions[s.SubscriptionTypeEnum] = sub;
  }

  // Seed equipment data
  const equipmentData = [
    {
      id: '16d82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Laptop',
      description: 'High-performance laptop for POS operations',
      price: 80000,
      category: 'COMPUTER',
      model: 'HP ProBook 450',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    },
    {
      id: '27d82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Bill Printer',
      description: 'Thermal receipt printer',
      price: 14800,
      category: 'PRINTER',
      model: 'Epson TM-T20III',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    },
    {
      id: '38d82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Barcode Label Printer',
      description: 'Label printer for product barcodes',
      price: 16800,
      category: 'PRINTER',
      model: 'Zebra GK420d',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    },
    {
      id: '49d82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Barcode Scanner (Wired)',
      description: 'USB wired barcode scanner',
      price: 6500,
      category: 'SCANNER',
      model: 'Honeywell Voyager 1200g',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    },
    {
      id: '5ad82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Barcode Scanner (Table Mount)',
      description: 'Table mounted barcode scanner',
      price: 12500,
      category: 'SCANNER',
      model: 'Datalogic QuickScan QD2131',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    },
    {
      id: '6bd82efb-5d5c-4795-b4c7-225c58e0b6f8',
      name: 'Barcode Scanner (Wireless)',
      description: 'Wireless barcode scanner',
      price: 19000,
      category: 'SCANNER',
      model: 'Symbol LS4278',
      status: EquipmentStatusEnum.AVAILABLE,
      isActive: true
    }
  ];

  for (const equipment of equipmentData) {
    await prisma.equipment.upsert({
      where: { id: equipment.id },
      update: { 
        price: equipment.price,
        status: equipment.status,
        description: equipment.description,
        isActive: equipment.isActive
      },
      create: equipment,
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { code: devTenantCode },
    update: {
      name: devTenantName,
      status: TenantStatusEnum.ACTIVE,
      isActive: true,
      dataSource: { connect: { id: datasource.id } },
    },
    create: {
      code: devTenantCode,
      name: devTenantName,
      status: TenantStatusEnum.ACTIVE,
      isActive: true,
      dataSource: { connect: { id: datasource.id } },
    },
  });

  // Calculate free trial end date (30 days from now)
  const freeTrialEndDate = new Date();
  freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 30);

  // Fixed: Use constant UUID for shop to avoid creating new records on every run
  const devShopId = '87654321-4321-4321-4321-987654321cba';
  const externalShopId = 'dev-shop-external-id';

  // Check if shop exists by either ID or externalShopId to handle the unique constraint
  const existingShop = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: devShopId },
        { externalShopId: externalShopId }
      ]
    }
  });

  const devShop = await prisma.shop.upsert({
    where: { id: existingShop?.id || devShopId },
    update: {
      externalShopId: externalShopId, // Include this in the update to ensure consistency
      isFreeTrialEnded: false,
      freeTrialEndDate: freeTrialEndDate,
      selectedPaymentPlan: PaymentPlanEnum.FULL_PAYMENT,
      isActive: true,
    },
    create: {
      id: devShopId,
      tenant: { connect: { id: tenant.id } },
      subscription: { connect: { id: subscriptions[SubscriptionTypeEnum.STARTER].id } },
      externalShopId: externalShopId,
      productCount: 0,
      userCount: 0,
      customerCount: 0,
      categoryCount: 0,
      status: ShopStatusEnum.ACTIVE,
      isFreeTrialEnded: false,
      freeTrialEndDate: freeTrialEndDate,
      selectedPaymentPlan: PaymentPlanEnum.FULL_PAYMENT,
      totalAmount: 80000,
      discountAmount: 4800, // 6% discount for full payment
      finalAmount: 75200,
      isFullyPaid: false,
      isActive: true,
    },
  });

  console.log('✅ Public database seeding completed');
  console.log(`Dev tenant created with schema: ${devSchemaName}`);
  console.log(`Dev shop created with ID: ${devShopId}`);
  console.log(`External shop ID: ${externalShopId}`);
  console.log(
    `Use this env var for tenant seeding: TENANT_DATABASE_URL=${baseDatabaseUrl}?schema=${devSchemaName}`,
  );

  // Add some sample equipment to the dev shop
  const sampleEquipment = [
    { id: 'dev-shop-eq-1', equipmentId: '16d82efb-5d5c-4795-b4c7-225c58e0b6f8', quantity: 1 }, // Laptop
    { id: 'dev-shop-eq-2', equipmentId: '27d82efb-5d5c-4795-b4c7-225c58e0b6f8', quantity: 1 }, // Bill Printer
  ];

  for (const eq of sampleEquipment) {
    try {
      const equipment = await prisma.equipment.findUnique({ where: { id: eq.equipmentId } });
      if (equipment) {
        // Check if shop equipment already exists first
        const existingShopEquipment = await prisma.shopEquipment.findFirst({
          where: {
            OR: [
              { id: eq.id },
              { 
                shopId: devShop.id,
                equipmentId: eq.equipmentId
              }
            ]
          }
        });

        await prisma.shopEquipment.upsert({
          where: { id: existingShopEquipment?.id || eq.id },
          update: {
            quantity: eq.quantity,
            totalPrice: equipment.price * eq.quantity,
            shopId: devShop.id, // Ensure this is updated
            equipmentId: eq.equipmentId // Ensure this is updated
          },
          create: {
            id: eq.id,
            shopId: devShop.id,
            equipmentId: eq.equipmentId,
            quantity: eq.quantity,
            totalPrice: equipment.price * eq.quantity,
            isActive: true,
          },
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not create/update shop equipment (${eq.id}):`, error.message);
      // Continue to the next equipment even if one fails
    }
  }

  // Create sample payment record for full payment (with discount)
  try {
    await prisma.payment.upsert({
      where: { id: 'dev-payment-1' },
      update: {
        shopId: devShop.id, // Ensure this is updated in case shop ID has changed
        amount: 75200,
        originalAmount: 80000,
        discountAmount: 4800,
      },
      create: {
        id: 'dev-payment-1',
        shopId: devShop.id,
        paymentType: 'FULL_PACKAGE',
        paymentMethod: 'PAYHERE',
        paymentStatus: 'PENDING',
        amount: 75200, // After 6% discount
        originalAmount: 80000,
        discountAmount: 4800,
        installmentNumber: 1,
        totalInstallments: 1,
        dueDate: new Date(),
        metadata: {
          subscriptionPrice: 80000,
          equipmentTotal: 94800, // Laptop + Printer
          discountApplied: true,
          createdBy: 'seed',
        },
        isActive: true,
      },
    });
  } catch (error) {
    console.warn('Warning: Could not create/update payment record:', error.message);
    // Continue execution even if payment creation fails
  }

  console.log('✅ Sample equipment and payment records created');
}

main()
  .catch((e) => {
    console.error('Seed failed with error:');
    if (e.code === 'P2002') {
      console.error(`Unique constraint violation on ${e.meta?.modelName}: ${e.meta?.target.join(', ')}`);
      console.error('Try running the seed script with a different unique ID or check for existing records');
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
