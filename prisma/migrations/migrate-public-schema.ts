import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

async function migratePublicSchema() {
  try {

    console.log("Starting migration for public schema...");

    //Run prisma db push for the public schema
    console.log("Pushing schema changes to database...");
    execSync("npx prisma db push --schema=./prisma/public-schema.prisma", { stdio: "inherit" });

    console.log("Successfully migrated public schema");

    //Generate updated Prisma client
    console.log("Generating updated Prisma client for public schema...");
    execSync("npx prisma generate --schema=./prisma/public-schema.prisma", { stdio: "inherit" });

    console.log("Successfully generated updated Prisma client for public schema");
  } catch (error) {
    console.error("Error during public schema migration:", error);
    process.exit(1);
  }
}

// Execute the migration
migratePublicSchema().catch(error => {
  console.error("Unhandled error in public schema migration script:", error);
  process.exit(1);
});
