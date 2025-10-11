import { registerAs } from "@nestjs/config";
import { IsNotEmpty, IsString } from "class-validator";
import { DatabaseConfig } from "./database-config.type";
import validateConfig from "@/utils/validate-config";

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  TENANT_DATABASE_URL: string;
}

export default registerAs<DatabaseConfig>("database", () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    tenantDatabaseUrl: process.env.TENANT_DATABASE_URL,
  };
});
