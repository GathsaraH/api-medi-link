import { PrismaClient, UserRole } from "@prisma-tenant/prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const tenantDatabaseUrl = process.env.TENANT_DATABASE_URL;
  if (!tenantDatabaseUrl) {
    throw new Error("TENANT_DATABASE_URL is not defined.");
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: tenantDatabaseUrl },
    },
  });

  // Create a shop (let Prisma generate the UUID)
  const shop = await prisma.shop.create({
    data: {
      name: "Dev Shop",
    },
  });

  await prisma.users.create({
    data: {
      shopId: shop.id,
      name: "Admin User",
      email: "admin@wireapps.co.uk",
      role: UserRole.ADMIN,
    },
  });

  await prisma.users.create({
    data: {
      shopId: shop.id,
      name: "Staff User",
      email: "user@wireapps.co.uk",
      role: UserRole.STAFF,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      name: "Test Customer",
      phoneNumber: "1234567890",
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      name: "Test Vendor",
      email: "vendor@wireapps.co.uk",
    },
  });

  const category = await prisma.category.create({
    data: {

      name: "General",
      description: "General products",
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      code: "P001",
      name: "Sample Product",
      description: "A sample product",
      // sku: "SKU001",
      // stock: 100,
      lowStockLimit: 10,
      imageUrl: "",
      sellingPrice: 9.99,
    },
  });

  // await prisma.productDetails.create({
  //   data: {
  //     productId: product.id,
  //     vendorId: vendor.id,
  //     barcode: "BARCODE001",
  //     originalPrice: 5.0,
  //     stock: 100,
  //   },
  // });

  console.log("Tenant database seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });