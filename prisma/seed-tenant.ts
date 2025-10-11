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


  console.log("Tenant database seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });